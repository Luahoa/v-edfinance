import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionResponseDto, TransactionStatus, TransactionType } from '../dto/payment.dto';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new transaction
   */
  async createTransaction(dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    this.logger.log(`Creating transaction for user ${dto.userId}, course ${dto.courseId}, amount ${dto.amount}`);

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    // Validate course exists if courseId provided
    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${dto.courseId} not found`);
      }

      if (!course.published) {
        throw new BadRequestException(`Course ${dto.courseId} is not published`);
      }

      // Check if user already has a completed transaction for this course
      const existingTransaction = await this.prisma.transaction.findFirst({
        where: {
          userId: dto.userId,
          courseId: dto.courseId,
          status: TransactionStatus.COMPLETED,
        },
      });

      if (existingTransaction) {
        throw new BadRequestException(`User already purchased this course (Transaction ID: ${existingTransaction.id})`);
      }
    }

    // Create transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        userId: dto.userId,
        courseId: dto.courseId,
        amount: dto.amount,
        currency: dto.currency || 'vnd',
        type: dto.type || TransactionType.COURSE_PURCHASE,
        status: TransactionStatus.PENDING,
        metadata: dto.metadata,
      },
    });

    this.logger.log(`Transaction created: ${transaction.id}`);
    return transaction as TransactionResponseDto;
  }

  /**
   * Update a transaction
   */
  async updateTransaction(id: string, dto: UpdateTransactionDto): Promise<TransactionResponseDto> {
    this.logger.log(`Updating transaction ${id}`);

    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Build update data with timestamps
    const updateData: any = {
      ...dto,
    };

    // Set lifecycle timestamps based on status
    if (dto.status) {
      if (dto.status === TransactionStatus.COMPLETED && !transaction.completedAt) {
        updateData.completedAt = new Date();
      } else if (dto.status === TransactionStatus.FAILED && !transaction.failedAt) {
        updateData.failedAt = new Date();
      } else if (dto.status === TransactionStatus.REFUNDED && !transaction.refundedAt) {
        updateData.refundedAt = new Date();
      }
    }

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Transaction updated: ${id}, status: ${updated.status}`);
    return updated as TransactionResponseDto;
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction as any;
  }

  /**
   * Get transaction by Stripe Session ID
   */
  async getTransactionByStripeSessionId(sessionId: string): Promise<TransactionResponseDto> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { stripeSessionId: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with Stripe Session ID ${sessionId} not found`);
    }

    return transaction as any;
  }

  /**
   * Get transaction by Stripe Payment Intent ID
   */
  async getTransactionByStripePaymentIntentId(paymentIntentId: string): Promise<TransactionResponseDto> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with Stripe Payment Intent ID ${paymentIntentId} not found`);
    }

    return transaction as any;
  }

  /**
   * Get all transactions for a user
   */
  async getUserTransactions(userId: string): Promise<TransactionResponseDto[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return transactions as any[];
  }

  /**
   * Get all transactions for a course
   */
  async getCourseTransactions(courseId: string): Promise<TransactionResponseDto[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return transactions as any[];
  }

  /**
   * Check if user has already purchased a course
   */
  async hasUserPurchasedCourse(userId: string, courseId: string): Promise<boolean> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        userId,
        courseId,
        status: TransactionStatus.COMPLETED,
      },
    });

    return !!transaction;
  }

  /**
   * Get transaction statistics for a user
   */
  async getUserTransactionStats(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
    });

    const stats = {
      total: transactions.length,
      completed: transactions.filter(t => t.status === TransactionStatus.COMPLETED).length,
      pending: transactions.filter(t => t.status === TransactionStatus.PENDING).length,
      failed: transactions.filter(t => t.status === TransactionStatus.FAILED).length,
      refunded: transactions.filter(t => t.status === TransactionStatus.REFUNDED).length,
      totalAmount: transactions
        .filter(t => t.status === TransactionStatus.COMPLETED)
        .reduce((sum, t) => sum + t.amount, 0),
    };

    return stats;
  }

  /**
   * Get transaction statistics for a course
   */
  async getCourseTransactionStats(courseId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { courseId },
    });

    const stats = {
      total: transactions.length,
      completed: transactions.filter(t => t.status === TransactionStatus.COMPLETED).length,
      pending: transactions.filter(t => t.status === TransactionStatus.PENDING).length,
      failed: transactions.filter(t => t.status === TransactionStatus.FAILED).length,
      refunded: transactions.filter(t => t.status === TransactionStatus.REFUNDED).length,
      totalRevenue: transactions
        .filter(t => t.status === TransactionStatus.COMPLETED)
        .reduce((sum, t) => sum + t.amount, 0),
      refundedAmount: transactions
        .filter(t => t.status === TransactionStatus.REFUNDED)
        .reduce((sum, t) => sum + t.amount, 0),
    };

    return stats;
  }
}
