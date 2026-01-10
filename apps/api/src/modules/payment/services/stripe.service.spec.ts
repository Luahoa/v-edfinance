import { ConfigService } from '@nestjs/config';
import { describe, it, expect, vi } from 'vitest';
import { StripeService } from './stripe.service';

describe('StripeService', () => {
  const mockConfigService = {
    get: vi.fn((key: string) => {
      const config: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_mock_key_for_testing',
        STRIPE_WEBHOOK_SECRET: 'whsec_mock_secret_for_testing',
      };
      return config[key];
    }),
  };

  // Create service directly without NestJS DI
  const service = new StripeService(mockConfigService as unknown as ConfigService);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize Stripe client', () => {
    const client = service.getClient();
    expect(client).toBeDefined();
    // Stripe SDK doesn't expose class name consistently, check for Stripe-specific methods instead
    expect(typeof client.checkout).toBe('object');
    expect(typeof client.paymentIntents).toBe('object');
  });

  it('should throw error if STRIPE_SECRET_KEY is missing', () => {
    const configWithNoKey = {
      get: vi.fn(() => undefined),
    };

    expect(() => {
      new StripeService(configWithNoKey as unknown as ConfigService);
    }).toThrow('STRIPE_SECRET_KEY is not configured');
  });

  it('should have createCheckoutSession method', () => {
    expect(service.createCheckoutSession).toBeDefined();
    expect(typeof service.createCheckoutSession).toBe('function');
  });

  it('should have retrieveCheckoutSession method', () => {
    expect(service.retrieveCheckoutSession).toBeDefined();
    expect(typeof service.retrieveCheckoutSession).toBe('function');
  });

  it('should have createPaymentIntent method', () => {
    expect(service.createPaymentIntent).toBeDefined();
    expect(typeof service.createPaymentIntent).toBe('function');
  });

  it('should have createCustomer method', () => {
    expect(service.createCustomer).toBeDefined();
    expect(typeof service.createCustomer).toBe('function');
  });

  it('should have constructWebhookEvent method', () => {
    expect(service.constructWebhookEvent).toBeDefined();
    expect(typeof service.constructWebhookEvent).toBe('function');
  });
});
