import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';

describe('StripeService', () => {
  let service: StripeService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              const config = {
                STRIPE_SECRET_KEY: 'sk_test_mock_key_for_testing',
                STRIPE_WEBHOOK_SECRET: 'whsec_mock_secret_for_testing',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize Stripe client', () => {
    const client = service.getClient();
    expect(client).toBeDefined();
    expect(client.constructor.name).toBe('Stripe');
  });

  it('should throw error if STRIPE_SECRET_KEY is missing', () => {
    const mockConfigService = {
      get: vi.fn(() => undefined),
    };

    expect(() => {
      new StripeService(mockConfigService as any);
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
