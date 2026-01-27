import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { TransactionService } from './transaction.service';
import { TransactionStatus, TransactionType } from '../dto/payment.dto';
import Stripe from 'stripe';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Process Stripe webhook event
   */
  async processWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripeService.constructWebhookEvent(payload, signature);
      this.logger.log(`Webhook received: ${event.type} (ID: ${event.id})`);
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      // Route event to appropriate handler
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(
            event.data.object as Stripe.Charge,
          );
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing webhook event ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Handle checkout.session.completed event
   * This is triggered when customer completes Stripe Checkout
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    this.logger.log(`Processing checkout.session.completed: ${session.id}`);

    const metadata = session.metadata;
    if (!metadata?.transactionId) {
      this.logger.warn(
        `No transactionId in session metadata: ${session.id}`,
      );
      return;
    }

    const transactionId = metadata.transactionId;

    try {
      // Get transaction
      const transaction = await this.transactionService.getTransactionById(
        transactionId,
      );

      if (transaction.status === TransactionStatus.COMPLETED) {
        this.logger.log(
          `Transaction ${transactionId} already completed, skipping`,
        );
        return;
      }

      // Update transaction to COMPLETED
      await this.transactionService.updateTransaction(transactionId, {
        status: TransactionStatus.COMPLETED,
        stripePaymentIntentId: session.payment_intent as string,
      });

      this.logger.log(
        `Transaction ${transactionId} marked as COMPLETED via checkout.session.completed`,
      );

      // Create course enrollment if this is a course purchase
      if (
        transaction.courseId &&
        transaction.type === TransactionType.COURSE_PURCHASE
      ) {
        await this.createCourseEnrollment(
          transaction.userId,
          transaction.courseId,
          transactionId,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing checkout.session.completed for transaction ${transactionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Handle payment_intent.succeeded event
   * This is triggered when payment is successfully processed
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Processing payment_intent.succeeded: ${paymentIntent.id}`);

    try {
      // Try to find transaction by payment intent ID
      const transaction = await this.transactionService.getTransactionByStripePaymentIntentId(
        paymentIntent.id,
      );

      if (transaction.status === TransactionStatus.COMPLETED) {
        this.logger.log(
          `Transaction ${transaction.id} already completed, skipping`,
        );
        return;
      }

      // Update transaction to COMPLETED
      await this.transactionService.updateTransaction(transaction.id, {
        status: TransactionStatus.COMPLETED,
      });

      this.logger.log(
        `Transaction ${transaction.id} marked as COMPLETED via payment_intent.succeeded`,
      );

      // Create course enrollment if this is a course purchase
      if (
        transaction.courseId &&
        transaction.type === TransactionType.COURSE_PURCHASE
      ) {
        await this.createCourseEnrollment(
          transaction.userId,
          transaction.courseId,
          transaction.id,
        );
      }
    } catch (error) {
      // Payment intent might not have a transaction yet (direct payment flow)
      this.logger.warn(
        `No transaction found for payment_intent ${paymentIntent.id}, skipping`,
      );
    }
  }

  /**
   * Handle payment_intent.payment_failed event
   * This is triggered when payment fails
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Processing payment_intent.payment_failed: ${paymentIntent.id}`);

    try {
      // Try to find transaction by payment intent ID
      const transaction = await this.transactionService.getTransactionByStripePaymentIntentId(
        paymentIntent.id,
      );

      if (transaction.status === TransactionStatus.FAILED) {
        this.logger.log(
          `Transaction ${transaction.id} already marked as failed, skipping`,
        );
        return;
      }

      // Update transaction to FAILED
      await this.transactionService.updateTransaction(transaction.id, {
        status: TransactionStatus.FAILED,
        metadata: {
          ...(transaction.metadata as any),
          stripeError: paymentIntent.last_payment_error?.message || 'Payment failed',
          stripeErrorCode: paymentIntent.last_payment_error?.code,
        },
      });

      this.logger.log(
        `Transaction ${transaction.id} marked as FAILED via payment_intent.payment_failed`,
      );
    } catch (error) {
      this.logger.warn(
        `No transaction found for payment_intent ${paymentIntent.id}, skipping`,
      );
    }
  }

  /**
   * Handle charge.refunded event
   * This is triggered when a charge is refunded
   */
  private async handleChargeRefunded(
    charge: Stripe.Charge,
  ): Promise<void> {
    this.logger.log(`Processing charge.refunded: ${charge.id}`);

    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      this.logger.warn(`No payment_intent in charge ${charge.id}`);
      return;
    }

    try {
      // Find transaction by payment intent ID
      const transaction = await this.transactionService.getTransactionByStripePaymentIntentId(
        paymentIntentId,
      );

      if (transaction.status === TransactionStatus.REFUNDED) {
        this.logger.log(
          `Transaction ${transaction.id} already marked as refunded, skipping`,
        );
        return;
      }

      // Update transaction to REFUNDED
      await this.transactionService.updateTransaction(transaction.id, {
        status: TransactionStatus.REFUNDED,
        metadata: {
          ...(transaction.metadata as any),
          refundAmount: charge.amount_refunded,
          refundReason: charge.refunds?.data[0]?.reason || 'Unknown',
        },
      });

      this.logger.log(
        `Transaction ${transaction.id} marked as REFUNDED via charge.refunded`,
      );

      // TODO: Handle course access revocation on refund (ved-0jl6)
      // For now, we just mark the transaction as refunded
    } catch (error) {
      this.logger.warn(
        `No transaction found for payment_intent ${paymentIntentId}, skipping`,
      );
    }
  }

  /**
   * Create course enrollment (UserProgress) for purchased course
   * This creates the initial progress record which signals enrollment
   */
  private async createCourseEnrollment(
    userId: string,
    courseId: string,
    transactionId: string,
  ): Promise<void> {
    this.logger.log(
      `Creating course enrollment: userId=${userId}, courseId=${courseId}, transactionId=${transactionId}`,
    );

    try {
      // Get course with first lesson (schema has lessons directly under course, no chapters)
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            take: 1,
            select: { id: true },
          },
        },
      });

      if (!course) {
        this.logger.error(`Course ${courseId} not found for enrollment`);
        return;
      }

      // Get first lesson
      const firstLesson = course.lessons[0];

      if (!firstLesson) {
        this.logger.warn(
          `No lessons found in course ${courseId}, creating enrollment without progress`,
        );
        // We'll create a BehaviorLog entry to track enrollment even without lessons
        await this.prisma.behaviorLog.create({
          data: {
            userId,
            sessionId: 'webhook',
            path: `/courses/${courseId}`,
            eventType: 'COURSE_ENROLLED',
            actionCategory: 'ENROLLMENT',
            duration: 0,
            deviceInfo: {},
            payload: {
              courseId,
              transactionId,
              enrolledAt: new Date().toISOString(),
            },
          },
        });
        return;
      }

      // Check if user already has progress for this course
      const existingProgress = await this.prisma.userProgress.findFirst({
        where: {
          userId,
          lesson: {
            courseId,
          },
        },
      });

      if (existingProgress) {
        this.logger.log(
          `User ${userId} already has progress for course ${courseId}, skipping enrollment creation`,
        );
        return;
      }

      // Create initial progress record for first lesson (indicates enrollment)
      await this.prisma.userProgress.create({
        data: {
          userId,
          lessonId: firstLesson.id,
          status: 'STARTED',
          durationSpent: 0,
        },
      });

      // Log enrollment event
      await this.prisma.behaviorLog.create({
        data: {
          userId,
          sessionId: 'webhook',
          path: `/courses/${courseId}`,
          eventType: 'COURSE_ENROLLED',
          actionCategory: 'ENROLLMENT',
          duration: 0,
          deviceInfo: {},
          payload: {
            courseId,
            transactionId,
            firstLessonId: firstLesson.id,
            enrolledAt: new Date().toISOString(),
          },
        },
      });

      this.logger.log(
        `Successfully enrolled user ${userId} in course ${courseId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error creating enrollment for user ${userId} in course ${courseId}:`,
        error,
      );
      // Don't throw - enrollment failure shouldn't fail the webhook
      // The transaction is already marked as COMPLETED
    }
  }
}
