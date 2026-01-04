import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '../dto/payment.dto';

describe('TransactionService', () => {
  let service: TransactionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    course: {
      findUnique: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockCourse = { id: 'course-1', published: true, price: 500000 };
      const mockTransaction = {
        id: 'txn-1',
        userId: 'user-1',
        courseId: 'course-1',
        amount: 500000,
        currency: 'vnd',
        status: TransactionStatus.PENDING,
        type: TransactionType.COURSE_PURCHASE,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);
      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.createTransaction({
        userId: 'user-1',
        courseId: 'course-1',
        amount: 500000,
        currency: 'vnd',
      });

      expect(result).toEqual(mockTransaction);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockPrismaService.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'course-1' },
      });
      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createTransaction({
          userId: 'non-existent-user',
          courseId: 'course-1',
          amount: 500000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if course not found', async () => {
      const mockUser = { id: 'user-1' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(
        service.createTransaction({
          userId: 'user-1',
          courseId: 'non-existent-course',
          amount: 500000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if course not published', async () => {
      const mockUser = { id: 'user-1' };
      const mockCourse = { id: 'course-1', published: false };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.createTransaction({
          userId: 'user-1',
          courseId: 'course-1',
          amount: 500000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already purchased course', async () => {
      const mockUser = { id: 'user-1' };
      const mockCourse = { id: 'course-1', published: true };
      const mockExistingTransaction = {
        id: 'txn-1',
        status: TransactionStatus.COMPLETED,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockExistingTransaction);

      await expect(
        service.createTransaction({
          userId: 'user-1',
          courseId: 'course-1',
          amount: 500000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction status to COMPLETED', async () => {
      const mockTransaction = {
        id: 'txn-1',
        status: TransactionStatus.PROCESSING,
        completedAt: null,
      };

      const mockUpdatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
        completedAt: new Date(),
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.update.mockResolvedValue(mockUpdatedTransaction);

      const result = await service.updateTransaction('txn-1', {
        status: TransactionStatus.COMPLETED,
      });

      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTransaction('non-existent-txn', {
          status: TransactionStatus.COMPLETED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction with relations', async () => {
      const mockTransaction = {
        id: 'txn-1',
        userId: 'user-1',
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        course: { id: 'course-1', title: 'Test Course' },
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await service.getTransactionById('txn-1');

      expect(result).toEqual(mockTransaction);
      expect(result.user).toBeDefined();
      expect(result.course).toBeDefined();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(
        service.getTransactionById('non-existent-txn'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('hasUserPurchasedCourse', () => {
    it('should return true if user purchased course', async () => {
      const mockTransaction = {
        id: 'txn-1',
        status: TransactionStatus.COMPLETED,
      };

      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);

      const result = await service.hasUserPurchasedCourse('user-1', 'course-1');

      expect(result).toBe(true);
    });

    it('should return false if user has not purchased course', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);

      const result = await service.hasUserPurchasedCourse('user-1', 'course-1');

      expect(result).toBe(false);
    });
  });

  describe('getUserTransactionStats', () => {
    it('should return correct transaction statistics', async () => {
      const mockTransactions = [
        { id: 'txn-1', status: TransactionStatus.COMPLETED, amount: 500000 },
        { id: 'txn-2', status: TransactionStatus.COMPLETED, amount: 300000 },
        { id: 'txn-3', status: TransactionStatus.PENDING, amount: 200000 },
        { id: 'txn-4', status: TransactionStatus.FAILED, amount: 100000 },
        { id: 'txn-5', status: TransactionStatus.REFUNDED, amount: 500000 },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getUserTransactionStats('user-1');

      expect(result.total).toBe(5);
      expect(result.completed).toBe(2);
      expect(result.pending).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.refunded).toBe(1);
      expect(result.totalAmount).toBe(800000); // 500000 + 300000
    });
  });
});
