# P1 Incident Runbook: Payment Failure

**Severity:** P1 (High)  
**MTTR Target:** 20 minutes  
**Status:** Active

---

## 🚨 Detection

### Automated Alerts
- Payment gateway webhook failures (>3 consecutive)
- Error rate on `/api/payments/*` endpoints (>5%)
- User reports: "Payment failed but money deducted"
- Transaction status stuck in "pending" for >30 minutes

### Manual Detection
- Stripe dashboard shows failed transactions
- Database shows transactions without payment_intent_id
- Payment confirmation emails not sent

### Quick Diagnosis Commands
```bash
# Check recent payment errors
ssh root@103.54.153.248
docker logs <api_container> --tail 100 | grep -i "payment\|stripe"

# Check payment transactions in database
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT id, status, amount, created_at FROM \"Transaction\" 
   WHERE created_at > NOW() - INTERVAL '1 hour' 
   ORDER BY created_at DESC LIMIT 10;"

# Test payment gateway connectivity
curl -X GET https://api.stripe.com/v1/charges \
  -u sk_test_xxxxx: \
  -H "Stripe-Version: 2023-10-16"
```

---

## ⚡ Immediate Actions (First 5 Minutes)

### Step 1: Assess Impact Scope
```bash
# Count pending transactions
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT COUNT(*) FROM \"Transaction\" 
   WHERE status = 'pending' AND created_at > NOW() - INTERVAL '1 hour';"

# If >10 transactions pending → System-wide issue
# If 1-2 transactions → User-specific or random failure
```

### Step 2: Verify Payment Gateway Status
```bash
# Check Stripe API status
curl https://status.stripe.com/api/v2/status.json | jq

# Check API key validity
curl https://api.stripe.com/v1/balance \
  -u $STRIPE_SECRET_KEY: \
  -H "Stripe-Version: 2023-10-16"

# Expected: Balance object returned
# Error: "Invalid API Key" → Configuration issue
```

### Step 3: Check Recent Payment Logs
```bash
# Get detailed payment errors
docker logs <api_container> --tail 500 | grep -A 5 "payment.*error"

# Common error patterns:
# - "card_declined" → User's card issue (not incident)
# - "authentication_required" → 3D Secure needed (not incident)
# - "api_connection_error" → Stripe API unreachable
# - "rate_limit_error" → Too many requests to Stripe
# - "invalid_request_error" → Missing required parameters
```

---

## 🔧 Diagnosis & Resolution

### Scenario A: Stripe API Key Invalid/Expired
**Symptoms:** All payments fail with "Invalid API Key"

```bash
# Check environment variable
docker exec <api_container> printenv | grep STRIPE

# Required variables:
# STRIPE_SECRET_KEY=sk_live_xxx (production)
# STRIPE_PUBLISHABLE_KEY=pk_live_xxx (frontend)
# STRIPE_WEBHOOK_SECRET=whsec_xxx (for webhooks)

# Verify key format
# Live: sk_live_xxx, pk_live_xxx
# Test: sk_test_xxx, pk_test_xxx

# If missing or wrong format → Update in Dokploy
```

**Fix: Rotate Stripe API Keys**
```bash
# 1. Generate new keys in Stripe Dashboard
# 2. Update Dokploy environment variables
# 3. Update frontend environment (if needed)
# 4. Redeploy both API and Web
# 5. Test with small transaction
```

### Scenario B: Webhook Signature Verification Failure
**Symptoms:** Payments succeed but status not updated in DB

```bash
# Check webhook endpoint
curl -X POST http://103.54.153.248:3001/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: dummy" \
  -d '{"type":"payment_intent.succeeded"}' \
  -v

# Expected: 200 OK or 400 (signature verification failed)
# If 500 or timeout → Webhook handler broken

# Check recent webhook deliveries in Stripe Dashboard
# Stripe Dashboard → Developers → Webhooks → Recent Deliveries
# Look for failed attempts with response codes
```

**Fix: Update Webhook Secret**
```bash
# Get current webhook secret from Stripe Dashboard
# Update environment variable
docker exec <api_container> sh -c "export STRIPE_WEBHOOK_SECRET=whsec_xxx"
docker restart <api_container>

# Test webhook manually
stripe trigger payment_intent.succeeded
```

### Scenario C: Database Transaction Rollback
**Symptoms:** Payment succeeds in Stripe but DB shows failure

```bash
# Check for database errors during payment processing
docker logs <api_container> | grep -i "transaction.*error\|rollback"

# Common causes:
# - Constraint violation (duplicate payment_intent_id)
# - Connection timeout during transaction
# - Foreign key constraint (user deleted mid-payment)

# Find orphaned Stripe charges (paid but no DB record)
# 1. Export recent charges from Stripe
# 2. Compare with DB transactions
```

**Fix: Reconcile Stripe & Database**
```bash
# Create reconciliation script
cd /root/v-edfinance/scripts

# Find unmatched transactions (last 24 hours)
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT t.id, t.stripe_payment_intent_id, t.status, t.amount 
   FROM \"Transaction\" t 
   WHERE t.created_at > NOW() - INTERVAL '24 hours' 
   AND t.stripe_payment_intent_id IS NOT NULL 
   AND t.status = 'pending';"

# For each unmatched transaction:
# 1. Verify status in Stripe
# 2. Update DB status accordingly
# 3. Send confirmation email if successful
```

### Scenario D: Rate Limiting by Stripe
**Symptoms:** Intermittent failures during high traffic

```bash
# Check for rate limit errors
docker logs <api_container> | grep "rate_limit_error"

# Stripe rate limits (as of 2024):
# - 100 requests/second (bursts allowed)
# - Lower limits for test mode

# Check request rate
docker logs <api_container> | grep "POST /api/payments" | \
  awk '{print $1}' | uniq -c | sort -rn | head -n 10
```

**Fix: Implement Request Queuing**
```typescript
// apps/api/src/modules/payments/payments.service.ts

import PQueue from 'p-queue';

export class PaymentsService {
  private queue = new PQueue({ concurrency: 50, interval: 1000 });

  async createPaymentIntent(amount: number) {
    return this.queue.add(async () => {
      // Stripe API call here
      return await this.stripe.paymentIntents.create({ amount });
    });
  }
}
```

### Scenario E: Insufficient Balance (Test Mode)
**Symptoms:** All test payments fail with "insufficient funds"

```bash
# Check if using test mode in production
docker exec <api_container> printenv STRIPE_SECRET_KEY | grep "sk_test"

# If sk_test found in production → CRITICAL CONFIG ERROR
# Should use sk_live for production!

# Fix immediately:
# 1. Update to live key in Dokploy
# 2. Redeploy
# 3. Notify all affected users
```

---

## 🛡️ Payment Reconciliation Procedure

### Step 1: Export Stripe Transactions
```bash
# Using Stripe CLI
stripe charges list --limit 100 --created '>2024-01-01' > /tmp/stripe-charges.json

# Or via API
curl https://api.stripe.com/v1/charges?limit=100 \
  -u $STRIPE_SECRET_KEY: \
  -H "Stripe-Version: 2023-10-16" \
  > /tmp/stripe-charges.json
```

### Step 2: Export Database Transactions
```bash
# Get all transactions from last 24 hours
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "COPY (
    SELECT id, stripe_payment_intent_id, status, amount, created_at 
    FROM \"Transaction\" 
    WHERE created_at > NOW() - INTERVAL '24 hours'
  ) TO STDOUT WITH CSV HEADER" > /tmp/db-transactions.csv
```

### Step 3: Compare and Reconcile
```python
# reconcile-payments.py
import json
import csv

# Load Stripe data
with open('/tmp/stripe-charges.json') as f:
    stripe_data = json.load(f)

# Load DB data
with open('/tmp/db-transactions.csv') as f:
    db_data = list(csv.DictReader(f))

# Find mismatches
stripe_ids = {charge['id'] for charge in stripe_data['data']}
db_ids = {row['stripe_payment_intent_id'] for row in db_data if row['stripe_payment_intent_id']}

# Orphaned in Stripe (paid but not in DB)
orphaned = stripe_ids - db_ids
print(f"Orphaned in Stripe: {len(orphaned)}")
for charge_id in orphaned:
    # Investigate and create DB record if legitimate
    pass

# Pending in DB but succeeded in Stripe
pending_in_db = [row for row in db_data if row['status'] == 'pending']
for row in pending_in_db:
    if row['stripe_payment_intent_id'] in stripe_ids:
        # Update DB status to 'completed'
        pass
```

---

## ✅ Recovery Verification

### Test Payment Flow End-to-End
```bash
# 1. Create test customer
curl -X POST http://103.54.153.248:3001/api/customers \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-payment@example.com","name":"Test User"}'

# 2. Create payment intent
curl -X POST http://103.54.153.248:3001/api/payments/create-intent \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"currency":"usd"}' | jq

# 3. Simulate webhook (payment succeeded)
curl -X POST http://103.54.153.248:3001/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: $TEST_WEBHOOK_SIGNATURE" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": { "object": { "id": "pi_test_xxx" } }
  }'

# 4. Verify transaction in database
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT * FROM \"Transaction\" WHERE stripe_payment_intent_id = 'pi_test_xxx';"
```

### Monitor Payment Success Rate
```bash
# Track payment success rate for 30 minutes
for i in {1..30}; do
  TOTAL=$(docker exec <postgres_container> psql -U postgres -d vedfinance_staging -t -c \
    "SELECT COUNT(*) FROM \"Transaction\" WHERE created_at > NOW() - INTERVAL '1 minute';")
  
  SUCCESS=$(docker exec <postgres_container> psql -U postgres -d vedfinance_staging -t -c \
    "SELECT COUNT(*) FROM \"Transaction\" 
     WHERE created_at > NOW() - INTERVAL '1 minute' AND status = 'completed';")
  
  RATE=$((SUCCESS * 100 / (TOTAL + 1)))
  echo "$(date): Success rate: $RATE% ($SUCCESS/$TOTAL)"
  sleep 60
done

# Target: >95% success rate (excluding user card declines)
```

---

## 📝 Post-Incident Actions

### Immediate (Within 1 Hour)
1. **Notify Affected Users:**
   ```bash
   # Get emails of users with failed payments
   docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
     "SELECT DISTINCT u.email 
      FROM \"User\" u 
      JOIN \"Transaction\" t ON t.user_id = u.id 
      WHERE t.status = 'failed' AND t.created_at > NOW() - INTERVAL '1 hour';" \
     > /tmp/affected-users.txt
   
   # Send apology email + refund instructions
   ```

2. **Create Reconciliation Report:**
   - Total failed transactions
   - Total amount affected
   - Number of users impacted
   - Refund status

3. **Create Follow-up Beads:**
   ```bash
   beads create "Implement payment reconciliation monitoring" --type task --priority 1
   beads create "Add Stripe webhook delivery monitoring to Grafana" --type task --priority 1
   ```

### Short-Term (Within 1 Week)
1. **Add Payment Monitoring Dashboard:**
   - Payment success rate (last 1h, 24h, 7d)
   - Webhook delivery success rate
   - Average time to payment confirmation
   - Failed payment reasons breakdown

2. **Implement Automatic Reconciliation:**
   ```typescript
   // Cron job to run every 15 minutes
   @Cron('*/15 * * * *')
   async reconcilePendingPayments() {
     // Find transactions pending >10 minutes
     // Check status in Stripe
     // Update DB accordingly
     // Alert if discrepancies found
   }
   ```

3. **Add Integration Tests:**
   ```typescript
   describe('Payment Flow', () => {
     it('should handle payment success webhook', async () => {
       // Create payment intent
       // Simulate webhook
       // Verify DB updated
       // Verify email sent
     });
     
     it('should handle payment failure gracefully', async () => {
       // Test refund flow
       // Test error handling
     });
   });
   ```

---

## 🚀 Escalation Paths

### Level 1: Automated Recovery (0-10 minutes)
- Restart payment service
- Verify API keys
- Check Stripe status page
- Run reconciliation script

### Level 2: Backend Engineer (10-30 minutes)
- Deep log analysis
- Database transaction review
- Webhook debugging
- Contact: [Slack: #payments-oncall]

### Level 3: Payment Specialist (30-60 minutes)
- Stripe support contact
- Manual transaction reconciliation
- Refund processing
- Contact: [Slack: #finance]

### Level 4: Compliance/Legal (60+ minutes)
- Large-scale payment failures (>$10k affected)
- Regulatory reporting required
- User data breach related to payments
- Contact: [Email: legal@vedfinance.com]

---

## 📚 Related Resources
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Payment Reconciliation Guide](../../docs/PAYMENT_RECONCILIATION.md)
- [Refund Procedures](../../docs/REFUND_PROCEDURES.md)

---

**Last Updated:** 2026-01-04  
**Owner:** Track 4 - PurpleBear  
**Review Frequency:** Monthly  
**Next Drill:** [Schedule quarterly payment failure simulation]
