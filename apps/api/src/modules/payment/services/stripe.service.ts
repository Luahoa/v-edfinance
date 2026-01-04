import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured. Please add it to your .env file.',
      );
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });

    this.logger.log('Stripe service initialized');
  }

  async onModuleInit() {
    // Test Stripe connection on module initialization
    try {
      const balance = await this.stripe.balance.retrieve();
      this.logger.log('Stripe connection successful');
      this.logger.debug(`Stripe account balance: ${JSON.stringify(balance)}`);
    } catch (error) {
      this.logger.error('Failed to connect to Stripe', error);
      throw error;
    }
  }

  /**
   * Get the Stripe client instance
   */
  getClient(): Stripe {
    return this.stripe;
  }

  /**
   * Create a checkout session
   */
  async createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create(params);
  }

  /**
   * Retrieve a checkout session
   */
  async retrieveCheckoutSession(
    sessionId: string,
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    params: Stripe.PaymentIntentCreateParams,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create(params);
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Construct webhook event from raw body
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET is not configured. Please add it to your .env file.',
      );
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }

  /**
   * Create a customer
   */
  async createCustomer(
    params: Stripe.CustomerCreateParams,
  ): Promise<Stripe.Customer> {
    return this.stripe.customers.create(params);
  }

  /**
   * Retrieve a customer
   */
  async retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
    return this.stripe.customers.retrieve(customerId);
  }

  /**
   * List all prices
   */
  async listPrices(
    params?: Stripe.PriceListParams,
  ): Promise<Stripe.ApiList<Stripe.Price>> {
    return this.stripe.prices.list(params);
  }

  /**
   * Retrieve a price
   */
  async retrievePrice(priceId: string): Promise<Stripe.Price> {
    return this.stripe.prices.retrieve(priceId);
  }
}
