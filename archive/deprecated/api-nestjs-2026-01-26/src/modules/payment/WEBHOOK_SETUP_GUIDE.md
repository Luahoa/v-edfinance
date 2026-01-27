# Stripe Webhook Setup Guide

This guide explains how to set up and test Stripe webhooks for the V-EdFinance payment system.

## Table of Contents

1. [Overview](#overview)
2. [Webhook Events Handled](#webhook-events-handled)
3. [Local Development Setup](#local-development-setup)
4. [Production Setup](#production-setup)
5. [Testing Webhooks](#testing-webhooks)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The webhook system handles Stripe payment events and updates transaction status automatically. When a payment succeeds, fails, or is refunded, Stripe sends an event to our webhook endpoint, which then:

1. **Verifies** the webhook signature for security
2. **Updates** the transaction status in the database
3. **Creates** course enrollment (UserProgress) on successful payment
4. **Logs** all events for debugging

**Webhook Endpoint:** `POST /payment/webhook`

---

## Webhook Events Handled

### 1. `checkout.session.completed`

**Triggered:** When customer completes Stripe Checkout

**Actions:**
- Updates Transaction status to `COMPLETED`
- Stores `stripePaymentIntentId`
- Creates course enrollment (UserProgress for first lesson)
- Logs `COURSE_ENROLLED` event to BehaviorLog

**Example Flow:**
```
User clicks "Pay Now" 
→ Redirected to Stripe Checkout 
→ Completes payment 
→ Stripe sends checkout.session.completed webhook
→ Transaction marked COMPLETED
→ User enrolled in course
```

---

### 2. `payment_intent.succeeded`

**Triggered:** When payment is successfully processed

**Actions:**
- Updates Transaction status to `COMPLETED`
- Creates course enrollment if applicable

**Note:** This event is usually redundant with `checkout.session.completed` but handles direct Payment Intent flows.

---

### 3. `payment_intent.payment_failed`

**Triggered:** When payment fails (card declined, insufficient funds, etc.)

**Actions:**
- Updates Transaction status to `FAILED`
- Stores error details in transaction metadata:
  - `stripeError`: Error message
  - `stripeErrorCode`: Stripe error code

**Example Metadata:**
```json
{
  "stripeError": "Your card has insufficient funds",
  "stripeErrorCode": "card_declined"
}
```

---

### 4. `charge.refunded`

**Triggered:** When a charge is refunded (manually or automatically)

**Actions:**
- Updates Transaction status to `REFUNDED`
- Stores refund details in transaction metadata:
  - `refundAmount`: Amount refunded (VND)
  - `refundReason`: Reason for refund

**Note:** Course access revocation is handled in a separate task (ved-0jl6).

---

## Local Development Setup

### Step 1: Install Stripe CLI

```bash
# Windows (using Scoop)
scoop install stripe

# macOS (using Homebrew)
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### Step 2: Login to Stripe CLI

```bash
stripe login
```

This opens a browser window to authorize the CLI with your Stripe account.

### Step 3: Forward Webhooks to Localhost

```bash
# Forward webhooks to local API server (port 3001)
stripe listen --forward-to localhost:3001/payment/webhook
```

**Output:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxx
```

### Step 4: Copy Webhook Secret to .env

Add the webhook secret to `apps/api/.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
```

### Step 5: Start Your API Server

```bash
pnpm --filter api dev
```

### Step 6: Test with Trigger Events

```bash
# Trigger a checkout.session.completed event
stripe trigger checkout.session.completed

# Trigger a payment_intent.succeeded event
stripe trigger payment_intent.succeeded

# Trigger a payment_intent.payment_failed event
stripe trigger payment_intent.payment_failed
```

---

## Production Setup

### Step 1: Deploy Your API

Ensure your API is deployed and accessible at a public URL (e.g., `https://api.v-edfinance.com`).

### Step 2: Create Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://api.v-edfinance.com/payment/webhook`
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
5. Click **"Add endpoint"**

### Step 3: Copy Webhook Signing Secret

1. Click on the newly created webhook endpoint
2. Reveal the **"Signing secret"** (starts with `whsec_`)
3. Add it to your production environment variables:

```bash
# Dokploy, Railway, Heroku, etc.
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
```

### Step 4: Test Production Webhook

1. Make a test purchase using Stripe test cards (e.g., `4242 4242 4242 4242`)
2. Check webhook logs in Stripe Dashboard
3. Verify transaction status in database

---

## Testing Webhooks

### Manual Testing with Stripe CLI

```bash
# Test checkout.session.completed
stripe trigger checkout.session.completed

# Test payment failure
stripe trigger payment_intent.payment_failed

# Test refund
stripe trigger charge.refunded
```

### Testing with Real Checkout Flow

1. **Create checkout session:**
   ```bash
   curl -X POST http://localhost:3001/payment/create-checkout \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "courseId": "course_123",
       "successUrl": "http://localhost:3002/success",
       "cancelUrl": "http://localhost:3002/cancel"
     }'
   ```

2. **Complete payment** using Stripe test card: `4242 4242 4242 4242`

3. **Check webhook logs:**
   ```bash
   # In Stripe CLI terminal
   stripe listen --print-secret
   ```

4. **Verify transaction status:**
   ```bash
   curl http://localhost:3001/payment/transaction/YOUR_TRANSACTION_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Testing Signature Verification

```bash
# Send webhook without signature (should fail)
curl -X POST http://localhost:3001/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'

# Expected: 400 Bad Request - Missing stripe-signature header
```

---

## Troubleshooting

### Issue: "Invalid webhook signature"

**Cause:** Webhook secret mismatch or corrupted payload

**Solutions:**
1. Verify `STRIPE_WEBHOOK_SECRET` in `.env` matches Stripe CLI output
2. Ensure raw body is preserved (NestJS config required)
3. Check Stripe CLI is forwarding to correct port

**Raw Body Middleware (required for NestJS):**

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { json } from 'express';

const app = await NestFactory.create(AppModule, {
  rawBody: true, // Enable raw body for webhook signature verification
});
```

---

### Issue: "No transaction found for payment_intent"

**Cause:** Payment Intent created outside of our checkout flow

**Solution:** This is expected for direct Payment Intent flows. Webhook logs a warning and continues.

---

### Issue: Transaction not updating to COMPLETED

**Causes:**
1. Webhook endpoint not receiving events
2. Transaction already completed (idempotency)
3. Database connection issues

**Debug Steps:**

```bash
# Check webhook delivery in Stripe Dashboard
# Developers → Webhooks → [Your Endpoint] → Events

# Check API logs
pnpm --filter api dev # Check console output

# Verify transaction status
SELECT * FROM "Transaction" WHERE "stripeSessionId" = 'cs_test_xxx';
```

---

### Issue: Course enrollment not created

**Causes:**
1. Course has no chapters/lessons
2. User already has progress for the course
3. Database transaction failed

**Debug:**

```sql
-- Check if user has progress
SELECT * FROM "UserProgress" 
WHERE "userId" = 'user_123' 
AND "lessonId" IN (
  SELECT l.id FROM "Lesson" l
  INNER JOIN "Chapter" c ON l."chapterId" = c.id
  WHERE c."courseId" = 'course_123'
);

-- Check BehaviorLog for enrollment events
SELECT * FROM "BehaviorLog" 
WHERE "userId" = 'user_123' 
AND "eventType" = 'COURSE_ENROLLED'
ORDER BY "timestamp" DESC;
```

---

### Issue: Duplicate webhook events

**Cause:** Stripe retries webhook delivery if endpoint doesn't respond with 200 within 5 seconds

**Solution:** Our webhook is idempotent - it checks transaction status before updating:

```typescript
if (transaction.status === TransactionStatus.COMPLETED) {
  this.logger.log('Transaction already completed, skipping');
  return; // Safe to skip
}
```

---

## Event Flow Diagram

```
┌─────────────────────┐
│   User completes    │
│  Stripe Checkout    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Stripe sends      │
│ checkout.session.   │
│   completed event   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Webhook endpoint   │
│  verifies signature │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ WebhookService      │
│ processes event     │
└──────────┬──────────┘
           │
           ├──► Update Transaction → COMPLETED
           ├──► Store stripePaymentIntentId
           ├──► Create UserProgress (enrollment)
           └──► Log COURSE_ENROLLED event
```

---

## Security Best Practices

1. **Always verify webhook signatures** - Never trust webhook data without verification
2. **Use HTTPS in production** - Stripe requires HTTPS for webhook endpoints
3. **Keep webhook secret secure** - Store in environment variables, never commit to git
4. **Implement idempotency** - Handle duplicate events gracefully
5. **Log all webhook events** - Essential for debugging and auditing

---

## Related Documentation

- [Stripe Setup Guide](./STRIPE_SETUP_GUIDE.md) - Initial Stripe configuration
- [Payment Schema Guide](../../prisma/MIGRATION_GUIDE_PAYMENT_SYSTEM.md) - Database schema
- [Payment Module README](./README.md) - Module overview

---

## Test Coverage

The webhook system has **14 unit tests** covering:

- ✅ Signature verification (valid + invalid)
- ✅ Event routing (checkout.session.completed, payment_intent.*, charge.refunded)
- ✅ Transaction status updates
- ✅ Course enrollment creation
- ✅ Idempotency checks
- ✅ Error handling (missing transaction, already completed, etc.)

**Run tests:**
```bash
pnpm --filter api test webhook.service.spec.ts
```

---

**Last Updated:** 2026-01-05  
**Task:** ved-do76 (Stripe Webhook Handler)
