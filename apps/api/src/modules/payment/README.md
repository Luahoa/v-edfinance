# Payment Module - Stripe Integration

## Overview
The Payment Module provides comprehensive Stripe payment integration for V-EdFinance, supporting course purchases, subscriptions, and payment processing.

## Architecture

### Files Structure
```
apps/api/src/modules/payment/
├── payment.module.ts              # NestJS module definition
├── payment.controller.ts          # REST API endpoints (upcoming)
├── services/
│   └── stripe.service.ts         # Stripe SDK wrapper
├── dto/
│   └── payment.dto.ts            # Data Transfer Objects
└── STRIPE_SETUP_GUIDE.md         # Setup documentation
```

## Features

### Current Implementation (ved-khlu)
✅ Stripe SDK integration
✅ Environment configuration
✅ Service initialization with connection testing
✅ Basic Stripe operations wrapper
✅ Frontend Stripe.js setup

### Upcoming Features
- [ ] Checkout session creation (ved-ejqc)
- [x] Webhook event handling (ved-do76) ✅
- [ ] Payment UI components (ved-6s0z)
- [ ] Webhook signature verification (ved-cl04)

## Setup

### 1. Install Dependencies

**Backend:**
```bash
cd apps/api
pnpm add stripe
```

**Frontend:**
```bash
cd apps/web
pnpm add @stripe/stripe-js
```

### 2. Configure Environment Variables

**Backend (apps/api/.env):**
```env
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_CURRENCY=vnd
```

**Frontend (apps/web/.env.local):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
```

See [STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md) for detailed setup instructions.

### 3. Test Connection

Start the API server:
```bash
cd apps/api
pnpm dev
```

Check logs for:
```
[StripeService] Stripe service initialized
[StripeService] Stripe connection successful
```

## Usage

### Backend - StripeService

The `StripeService` provides a comprehensive wrapper around Stripe SDK:

```typescript
import { StripeService } from './modules/payment/services/stripe.service';

@Injectable()
export class MyService {
  constructor(private readonly stripeService: StripeService) {}

  async createCheckout() {
    // Create a checkout session
    const session = await this.stripeService.createCheckoutSession({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'vnd',
            product_data: {
              name: 'Financial Literacy Course',
            },
            unit_amount: 500000, // 500,000 VND
          },
          quantity: 1,
        },
      ],
      success_url: 'https://your-domain.com/success',
      cancel_url: 'https://your-domain.com/cancel',
    });

    return session;
  }

  async handleWebhook(payload: Buffer, signature: string) {
    // Construct and verify webhook event
    const event = this.stripeService.constructWebhookEvent(
      payload,
      signature,
    );

    // Handle event
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful payment
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        break;
    }
  }
}
```

### Frontend - Stripe.js

```typescript
import { getStripe, formatAmount } from '@/lib/stripe';

async function handleCheckout(courseId: string) {
  const stripe = await getStripe();
  if (!stripe) {
    console.error('Stripe failed to initialize');
    return;
  }

  // Call backend to create checkout session
  const response = await fetch('/api/payment/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId }),
  });

  const { sessionId } = await response.json();

  // Redirect to Stripe Checkout
  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    console.error('Stripe checkout error:', error);
  }
}

// Format currency for display
const displayPrice = formatAmount(500000, 'vnd');
// Output: "₫500,000"
```

## API Reference

### StripeService Methods

#### Checkout Sessions
- `createCheckoutSession(params)` - Create new checkout session
- `retrieveCheckoutSession(sessionId)` - Retrieve session details

#### Payment Intents
- `createPaymentIntent(params)` - Create payment intent
- `retrievePaymentIntent(paymentIntentId)` - Retrieve payment intent

#### Customers
- `createCustomer(params)` - Create Stripe customer
- `retrieveCustomer(customerId)` - Retrieve customer details

#### Prices
- `listPrices(params)` - List all prices
- `retrievePrice(priceId)` - Retrieve price details

#### Webhooks
- `constructWebhookEvent(payload, signature)` - Verify and construct webhook event

#### Utility
- `getClient()` - Get raw Stripe SDK instance

## Currency Handling

V-EdFinance uses Vietnamese Dong (VND) as the primary currency.

**Important:** Stripe requires VND amounts in the smallest currency unit (no decimals).

```typescript
// ✅ Correct
amount: 500000 // 500,000 VND

// ❌ Wrong
amount: 5000.00 // Will be treated as 5,000 VND
```

### Helper Functions

```typescript
import { convertToStripeAmount, formatAmount } from '@/lib/stripe';

// Convert display amount to Stripe amount
const stripeAmount = convertToStripeAmount(500000); // 500000

// Format for display
const displayPrice = formatAmount(500000, 'vnd'); // "₫500,000"
```

## Security Best Practices

### 1. Never Expose Secret Keys
- ✅ Use `STRIPE_SECRET_KEY` only in backend
- ✅ Use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in frontend
- ❌ Never commit keys to Git
- ❌ Never expose secret keys in client-side code

### 2. Verify Webhook Signatures
Always verify webhook signatures to prevent spoofing:

```typescript
const event = this.stripeService.constructWebhookEvent(
  payload,
  signature,
);
// Will throw error if signature is invalid
```

### 3. Use Idempotency Keys
For critical operations, use idempotency keys:

```typescript
await this.stripeService.createPaymentIntent(
  {
    amount: 500000,
    currency: 'vnd',
  },
  {
    idempotencyKey: `payment_${userId}_${courseId}_${timestamp}`,
  },
);
```

## Testing

### Test Mode
Use Stripe's test mode for development:

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
```

### Test Cards
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

### Webhook Testing
Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3001/api/payment/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
```

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const session = await this.stripeService.createCheckoutSession(params);
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Card declined
  } else if (error.type === 'StripeInvalidRequestError') {
    // Invalid parameters
  } else {
    // Other errors
  }
}
```

## Monitoring

### Connection Health
The service automatically tests connection on startup:

```typescript
async onModuleInit() {
  const balance = await this.stripe.balance.retrieve();
  this.logger.log('Stripe connection successful');
}
```

### Logging
All operations are logged:
- Service initialization
- Connection status
- Errors and exceptions

## Next Steps

1. **ved-pqpv:** Add Payment/Transaction schema to Prisma
2. **ved-ejqc:** Implement checkout session API endpoint
3. **ved-do76:** Implement webhook event handlers
4. **ved-6s0z:** Build payment UI components
5. **ved-cl04:** Add webhook signature verification

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Node.js Library](https://github.com/stripe/stripe-node)
- [Stripe.js Documentation](https://stripe.com/docs/js)
- [Testing Guide](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)

## Support

For issues or questions:
1. Check [STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md)
2. Review Stripe Dashboard logs
3. Enable debug logging in `.env`:
   ```env
   LOG_LEVEL=debug
   ```
