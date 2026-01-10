import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhookService } from './webhook.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { TransactionService } from './transaction.service';
import { TransactionStatus, TransactionType } from '../dto/payment.dto';
import Stripe from 'stripe';

describe('WebhookService', () => {
  let service: WebhookService;
  let prismaService: { transaction: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }; courseEnrollment: { create: ReturnType<typeof vi.fn> } };
  let stripeService: { verifyWebhookSignature: ReturnType<typeof vi.fn> };
  let transactionService: { updateTransactionStatus: ReturnType<typeof vi.fn> };

  const mockTransaction = {
    id: 'txn_123',
    userId: 'user_123',
    courseId: 'course_123',
    amount: 500000,
    currency: 'vnd',
    type: TransactionType.COURSE_PURCHASE,
    status: TransactionStatus.PROCESSING,
    stripeSessionId: 'cs_test_123',
    stripePaymentIntentId: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    failedAt: null,
    refundedAt: null,
  };

  const mockCourse = {
    id: 'course_123',
    slug: 'test-course',
    title: { vi: 'Khóa học test', en: 'Test Course' },
    price: 500000,
    published: true,
    chapters: [
      {
        id: 'chapter_123',
        order: 1,
        lessons: [
          {
            id: 'lesson_123',
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: PrismaService,
          useValue: {
            transaction: jest.fn(),
            course: {
              findUnique: jest.fn(),
            },
            userProgress: {
              create: jest.fn(),
              findFirst: jest.fn(),
            },
            behaviorLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: StripeService,
          useValue: {
            constructWebhookEvent: jest.fn(),
          },
        },
        {
          provide: TransactionService,
          useValue: {
            getTransactionById: jest.fn(),
            getTransactionByStripePaymentIntentId: jest.fn(),
            updateTransaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    prismaService = module.get(PrismaService);
    stripeService = module.get(StripeService);
    transactionService = module.get(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processWebhookEvent', () => {
    it('should verify webhook signature and process event', async () => {
      const payload = JSON.stringify({ type: 'test.event' });
      const signature = 'sig_test_123';

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: { transactionId: 'txn_123' },
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      transactionService.getTransactionById.mockResolvedValue(mockTransaction as any);
      transactionService.updateTransaction.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      } as any);
      prismaService.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaService.userProgress.findFirst.mockResolvedValue(null);
      prismaService.userProgress.create.mockResolvedValue({} as any);
      prismaService.behaviorLog.create.mockResolvedValue({} as any);

      const result = await service.processWebhookEvent(payload, signature);

      expect(result).toEqual({ received: true });
      expect(stripeService.constructWebhookEvent).toHaveBeenCalledWith(
        payload,
        signature,
      );
    });

    it('should throw BadRequestException if signature verification fails', async () => {
      const payload = 'invalid payload';
      const signature = 'invalid_signature';

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        service.processWebhookEvent(payload, signature),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log unhandled event types', async () => {
      const payload = JSON.stringify({ type: 'unknown.event' });
      const signature = 'sig_test_123';

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'unknown.event',
        data: { object: {} },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await service.processWebhookEvent(payload, signature);

      expect(result).toEqual({ received: true });
    });
  });

  describe('handleCheckoutSessionCompleted', () => {
    it('should update transaction to COMPLETED and create enrollment', async () => {
      const session: Stripe.Checkout.Session = {
        id: 'cs_test_123',
        payment_intent: 'pi_test_123',
        metadata: {
          transactionId: 'txn_123',
          userId: 'user_123',
          courseId: 'course_123',
        },
      } as Stripe.Checkout.Session;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: session },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      transactionService.getTransactionById.mockResolvedValue(mockTransaction as any);
      transactionService.updateTransaction.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      } as any);
      prismaService.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaService.userProgress.findFirst.mockResolvedValue(null);
      prismaService.userProgress.create.mockResolvedValue({} as any);
      prismaService.behaviorLog.create.mockResolvedValue({} as any);

      await service.processWebhookEvent(
        JSON.stringify(mockEvent),
        'sig_test_123',
      );

      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        'txn_123',
        {
          status: TransactionStatus.COMPLETED,
          stripePaymentIntentId: 'pi_test_123',
        },
      );
      expect(prismaService.course.findUnique).toHaveBeenCalled();
      expect(prismaService.userProgress.create).toHaveBeenCalled();
    });

    it('should skip if transaction already completed', async () => {
      const session: Stripe.Checkout.Session = {
        id: 'cs_test_123',
        metadata: { transactionId: 'txn_123' },
      } as Stripe.Checkout.Session;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: session },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      transactionService.getTransactionById.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      } as any);

      await service.processWebhookEvent(
        JSON.stringify(mockEvent),
        'sig_test_123',
      );

      expect(transactionService.updateTransaction).not.toHaveBeenCalled();
    });

    it('should skip if no transactionId in metadata', async () => {
      const session: Stripe.Checkout.Session = {
        id: 'cs_test_123',
        metadata: {},
      } as Stripe.Checkout.Session;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: session },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      await service.processWebhookEvent(
        JSON.stringify(mockEvent),
        'sig_test_123',
      );

      expect(transactionService.getTransactionById).not.toHaveBeenCalled();
    });

    it('should skip enrollment if user already has progress', async () => {
      const session: Stripe.Checkout.Session = {
        id: 'cs_test_123',
        payment_intent: 'pi_test_123',
        metadata: { transactionId: 'txn_123' },
      } as Stripe.Checkout.Session;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: session },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      transactionService.getTransactionById.mockResolvedValue(mockTransaction as any);
      transactionService.updateTransaction.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      } as any);
      prismaService.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaService.userProgress.findFirst.mockResolvedValue({
        id: 'progress_123',
      } as any);

      await service.processWebhookEvent(
        JSON.stringify(mockEvent),
        'sig_test_123',
      );

      expect(prismaService.userProgress.create).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentIntentSucceeded', () => {
    it('should update transaction to COMPLETED', async () => {
      const paymentIntent: Stripe.PaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
      } as Stripe.PaymentIntent;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: { object: paymentIntent },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      transactionService.getTransactionByStripePaymentIntentId.mockResolvedValue(
        mockTransaction as any,
      );
      transactionService.updateTransaction.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      } as any);
      prismaService.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaService.userProgress.findFirst.mockResolvedValue(null);
      prismaService.userProgress.create.mockResolvedValue({} as any);
      prismaService.behaviorLog.create.mockResolvedValue({} as any);

      await service.processWebhookEvent(
        JSON.stringify(mockEvent),
        'sig_test_123',
      );

      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        'txn_123',
        { status: TransactionStatus.COMPLETED },
      );
    });

    it('should handle payment intent without transaction gracefully', async () => {
      const paymentIntent: Stripe.PaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
      } as Stripe.PaymentIntent;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: { object: paymentIntent },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      transactionService.getTransactionByStripePaymentIntentId.mockRejectedValue(
        new Error('Not found'),
      );

      // Should not throw
      await expect(
        service.processWebhookEvent(JSON.stringify(mockEvent), 'sig_test_123'),
      ).resolves.toEqual({ received: true });
    });
  });

  describe('handlePaymentIntentFailed', () => {
    it('should update transaction to FAILED with error details', async () => {
      const paymentIntent: Stripe.PaymentIntent = {
        id: 'pi_test_123',
        status: 'failed',
        last_payment_error: {
          message: 'Card declined',
          code: 'card_declined',
        },
      } as Stripe.PaymentIntent;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'payment_intent.payment_failed',
        data: { object: paymentIntent },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      transactionService.getTransactionByStripePaymentIntentId.mockResolvedValue(
        mockTransaction as any,
      );
      transactionService.updateTransaction.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.FAILED,
      } as any);

      await service.processWebhookEvent(
        JSON.stringify(mockEvent),
        'sig_test_123',
      );

      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        'txn_123',
        {
          status: TransactionStatus.FAILED,
          metadata: {
            stripeError: 'Card declined',
            stripeErrorCode: 'card_declined',
          },
        },
      );
    });

    it('should skip if transaction already marked as failed', async () => {
      const paymentIntent: Stripe.PaymentIntent = {
        id: 'pi_test_123',
        status: 'failed',
      } as Stripe.PaymentIntent;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'payment_intent.payment_failed',
        data: { object: paymentIntent },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      transactionService.getTransactionByStripePaymentIntentId.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.FAILED,
      } as any);

      await service.processWebhookEvent(
        JSON.stringify(mockEvent),
        'sig_test_123',
      );

      expect(transactionService.updateTransaction).not.toHaveBeenCalled();
    });
  });

  describe('handleChargeRefunded', () => {
    it('should update transaction to REFUNDED', async () => {
      const charge: Stripe.Charge = {
        id: 'ch_test_123',
        payment_intent: 'pi_test_123',
        amount_refunded: 500000,
        refunds: {
          data: [{ reason: 'requested_by_customer' }],
        } as any,
      } as Stripe.Charge;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'charge.refunded',
        data: { object: charge },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      transactionService.getTransactionByStripePaymentIntentId.mockResolvedValue(
        mockTransaction as any,
      );
      transactionService.updateTransaction.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.REFUNDED,
      } as any);

      await service.processWebhookEvent(
        JSON.stringify(mockEvent),
        'sig_test_123',
      );

      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        'txn_123',
        {
          status: TransactionStatus.REFUNDED,
          metadata: {
            refundAmount: 500000,
            refundReason: 'requested_by_customer',
          },
        },
      );
    });

    it('should skip if no payment_intent in charge', async () => {
      const charge: Stripe.Charge = {
        id: 'ch_test_123',
        payment_intent: null,
      } as Stripe.Charge;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'charge.refunded',
        data: { object: charge },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      await service.processWebhookEvent(
        JSON.stringify(mockEvent),
        'sig_test_123',
      );

      expect(transactionService.getTransactionByStripePaymentIntentId).not.toHaveBeenCalled();
    });
  });

  describe('createCourseEnrollment', () => {
    it('should create enrollment with first lesson progress', async () => {
      const session: Stripe.Checkout.Session = {
        id: 'cs_test_123',
        payment_intent: 'pi_test_123',
        metadata: { transactionId: 'txn_123' },
      } as Stripe.Checkout.Session;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: session },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      transactionService.getTransactionById.mockResolvedValue(mockTransaction as any);
      transactionService.updateTransaction.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      } as any);
      prismaService.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaService.userProgress.findFirst.mockResolvedValue(null);
      prismaService.userProgress.create.mockResolvedValue({
        id: 'progress_123',
      } as any);
      prismaService.behaviorLog.create.mockResolvedValue({} as any);

      await service.processWebhookEvent(
        JSON.stringify(mockEvent),
        'sig_test_123',
      );

      expect(prismaService.userProgress.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          lessonId: 'lesson_123',
          status: 'STARTED',
          durationSpent: 0,
        },
      });
      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'COURSE_ENROLLED',
          }),
        }),
      );
    });

    it('should handle course without lessons gracefully', async () => {
      const session: Stripe.Checkout.Session = {
        id: 'cs_test_123',
        payment_intent: 'pi_test_123',
        metadata: { transactionId: 'txn_123' },
      } as Stripe.Checkout.Session;

      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: session },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      transactionService.getTransactionById.mockResolvedValue(mockTransaction as any);
      transactionService.updateTransaction.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      } as any);
      prismaService.course.findUnique.mockResolvedValue({
        ...mockCourse,
        chapters: [],
      } as any);
      prismaService.behaviorLog.create.mockResolvedValue({} as any);

      await service.processWebhookEvent(
        JSON.stringify(mockEvent),
        'sig_test_123',
      );

      expect(prismaService.userProgress.create).not.toHaveBeenCalled();
      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'COURSE_ENROLLED',
          }),
        }),
      );
    });
  });
});
