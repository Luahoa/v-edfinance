# Stripe Configuration Guide

## Setup Instructions

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Sign up or log in to your account
3. Navigate to **Developers** section

### 2. Get API Keys
1. Go to **Developers > API Keys**
2. Find your **Test mode** keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
3. Copy these to your `.env` file:
   ```env
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
   ```

### 3. Set Up Webhook Endpoint
1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   - Development: `http://localhost:3001/api/payment/webhook`
   - Production: `https://your-domain.com/api/payment/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.created`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
   ```

### 4. Currency Configuration
V-EdFinance supports Vietnamese Dong (VND):
```env
STRIPE_CURRENCY=vnd
```

**Note:** Stripe requires VND amounts to be in smallest currency unit (no decimals).
Example: 500,000 VND = `500000` (not `5000.00`)

### 5. Test Your Setup
Use Stripe's test mode with these test cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)

### 6. Production Checklist
Before going live:
- [ ] Replace test keys with live keys (`sk_live_`, `pk_live_`)
- [ ] Update webhook endpoint to production URL
- [ ] Enable live mode in Stripe Dashboard
- [ ] Test with real (small) transactions
- [ ] Set up proper error monitoring
- [ ] Review Stripe's security best practices

## Environment Variables Summary

```env
# Backend (apps/api/.env)
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_CURRENCY=vnd

# Frontend (apps/web/.env.local)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
```

## Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing with Stripe](https://stripe.com/docs/testing)
