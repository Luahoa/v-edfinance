import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SimulationService } from '../simulation/simulation.service';

describe('CommitmentService (via SimulationService)', () => {
  let service: SimulationService;
  let mockPrisma: any;
  let mockAi: any;
  let mockEventEmitter: any;
  let mockValidation: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      virtualPortfolio: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      simulationCommitment: {
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      behaviorLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        if (typeof cb === 'function') {
          return cb(mockPrisma);
        }
        return Array.isArray(cb) ? Promise.all(cb) : cb;
      }),
    };

    mockAi = {
      model: {
        generateContent: vi.fn(),
      },
    };

    mockEventEmitter = {
      emit: vi.fn(),
    };

    mockValidation = {
      validate: vi.fn((type, data) => data),
    };

    service = new SimulationService(
      mockPrisma,
      mockAi,
      mockEventEmitter,
      mockValidation,
    );
  });

  describe('Contract Creation', () => {
    it('should create a commitment contract with valid data', async () => {
      const userId = 'user-123';
      const commitmentData = {
        goalName: 'Emergency Fund',
        targetAmount: 100000,
        lockedAmount: 50000,
        months: 6,
      };

      const mockPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 100000,
      };

      const mockCommitment = {
        id: 'commitment-1',
        userId,
        goalName: commitmentData.goalName,
        targetAmount: commitmentData.targetAmount,
        lockedAmount: commitmentData.lockedAmount,
        unlockDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
        penaltyRate: 0.1,
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(mockPortfolio);
      mockPrisma.virtualPortfolio.update.mockResolvedValue({
        ...mockPortfolio,
        balance: 50000,
      });
      mockPrisma.simulationCommitment.create.mockResolvedValue(mockCommitment);

      const result = await service.createCommitment(userId, commitmentData);

      expect(result).toBeDefined();
      expect(result.goalName).toBe(commitmentData.goalName);
      expect(result.lockedAmount).toBe(commitmentData.lockedAmount);
      expect(mockPrisma.virtualPortfolio.update).toHaveBeenCalledWith({
        where: { userId },
        data: { balance: { decrement: commitmentData.lockedAmount } },
      });
      expect(mockPrisma.simulationCommitment.create).toHaveBeenCalled();
    });

    it('should reject contract creation with insufficient balance', async () => {
      const userId = 'user-123';
      const commitmentData = {
        goalName: 'Vacation Fund',
        targetAmount: 200000,
        lockedAmount: 150000,
        months: 12,
      };

      const mockPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 50000, // Insufficient
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(mockPortfolio);

      await expect(
        service.createCommitment(userId, commitmentData),
      ).rejects.toThrow('Insufficient virtual balance to lock');

      expect(mockPrisma.simulationCommitment.create).not.toHaveBeenCalled();
    });

    it('should calculate correct unlock date based on months', async () => {
      const userId = 'user-123';
      const commitmentData = {
        goalName: 'Retirement',
        targetAmount: 1000000,
        lockedAmount: 100000,
        months: 24,
      };

      const mockPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 200000,
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(mockPortfolio);
      mockPrisma.virtualPortfolio.update.mockResolvedValue({
        ...mockPortfolio,
        balance: 100000,
      });

      let capturedUnlockDate: Date | null = null;
      mockPrisma.simulationCommitment.create.mockImplementation((args) => {
        capturedUnlockDate = args.data.unlockDate;
        return Promise.resolve({
          id: 'commitment-1',
          ...args.data,
          penaltyRate: 0.1,
        });
      });

      await service.createCommitment(userId, commitmentData);

      expect(capturedUnlockDate).toBeDefined();
      const now = new Date();
      const expectedDate = new Date();
      expectedDate.setMonth(expectedDate.getMonth() + 24);

      const timeDiff = Math.abs(
        capturedUnlockDate!.getTime() - expectedDate.getTime(),
      );
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should create multiple contracts for different goals', async () => {
      const userId = 'user-123';
      const mockPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 500000,
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(mockPortfolio);

      const contracts = [
        {
          goalName: 'Emergency Fund',
          targetAmount: 100000,
          lockedAmount: 50000,
          months: 6,
        },
        {
          goalName: 'Vacation',
          targetAmount: 50000,
          lockedAmount: 25000,
          months: 3,
        },
      ];

      for (const [index, contract] of contracts.entries()) {
        mockPrisma.virtualPortfolio.update.mockResolvedValue({
          ...mockPortfolio,
          balance: mockPortfolio.balance - contract.lockedAmount,
        });

        mockPrisma.simulationCommitment.create.mockResolvedValue({
          id: `commitment-${index + 1}`,
          userId,
          ...contract,
          unlockDate: new Date(),
          penaltyRate: 0.1,
        });

        const result = await service.createCommitment(userId, contract);
        expect(result.goalName).toBe(contract.goalName);
      }

      expect(mockPrisma.simulationCommitment.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Stake Locking', () => {
    it('should lock funds by decrementing portfolio balance', async () => {
      const userId = 'user-123';
      const commitmentData = {
        goalName: 'Investment Fund',
        targetAmount: 200000,
        lockedAmount: 100000,
        months: 12,
      };

      const mockPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 300000,
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(mockPortfolio);
      mockPrisma.virtualPortfolio.update.mockResolvedValue({
        ...mockPortfolio,
        balance: 200000,
      });
      mockPrisma.simulationCommitment.create.mockResolvedValue({
        id: 'commitment-1',
        userId,
        ...commitmentData,
        unlockDate: new Date(),
        penaltyRate: 0.1,
      });

      await service.createCommitment(userId, commitmentData);

      expect(mockPrisma.virtualPortfolio.update).toHaveBeenCalledWith({
        where: { userId },
        data: { balance: { decrement: 100000 } },
      });
    });

    it('should verify locked amount matches commitment record', async () => {
      const userId = 'user-123';
      const lockedAmount = 75000;

      const mockPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 150000,
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(mockPortfolio);
      mockPrisma.virtualPortfolio.update.mockResolvedValue({
        ...mockPortfolio,
        balance: 75000,
      });

      let capturedLockedAmount: number | null = null;
      mockPrisma.simulationCommitment.create.mockImplementation((args) => {
        capturedLockedAmount = args.data.lockedAmount;
        return Promise.resolve({
          id: 'commitment-1',
          ...args.data,
          penaltyRate: 0.1,
        });
      });

      await service.createCommitment(userId, {
        goalName: 'Test',
        targetAmount: 100000,
        lockedAmount,
        months: 6,
      });

      expect(capturedLockedAmount).toBe(lockedAmount);
    });

    it('should prevent negative balance after locking', async () => {
      const userId = 'user-123';
      const commitmentData = {
        goalName: 'Over-ambitious Goal',
        targetAmount: 500000,
        lockedAmount: 300000,
        months: 12,
      };

      const mockPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 250000,
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(mockPortfolio);

      await expect(
        service.createCommitment(userId, commitmentData),
      ).rejects.toThrow('Insufficient virtual balance to lock');
    });
  });

  describe('Completion Verification', () => {
    it('should successfully withdraw on-time commitment without penalty', async () => {
      const userId = 'user-123';
      const commitmentId = 'commitment-1';

      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const mockCommitment = {
        id: commitmentId,
        userId,
        goalName: 'Completed Goal',
        targetAmount: 100000,
        lockedAmount: 50000,
        unlockDate: pastDate,
        penaltyRate: 0.1,
      };

      const mockPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 100000,
      };

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue(
        mockCommitment,
      );
      mockPrisma.$transaction.mockImplementation((operations) =>
        Promise.all(operations),
      );
      mockPrisma.virtualPortfolio.update.mockResolvedValue({
        ...mockPortfolio,
        balance: 150000,
      });
      mockPrisma.simulationCommitment.delete.mockResolvedValue(mockCommitment);

      const result = await service.withdrawCommitment(userId, commitmentId);

      expect(result.withdrawnAmount).toBe(50000);
      expect(result.early).toBe(false);
      expect(mockPrisma.behaviorLog.create).not.toHaveBeenCalled();
    });

    it('should apply penalty for early withdrawal', async () => {
      const userId = 'user-123';
      const commitmentId = 'commitment-1';

      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
      const mockCommitment = {
        id: commitmentId,
        userId,
        goalName: 'Early Withdrawal',
        targetAmount: 100000,
        lockedAmount: 50000,
        unlockDate: futureDate,
        penaltyRate: 0.1,
      };

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue(
        mockCommitment,
      );
      mockPrisma.$transaction.mockImplementation((operations) =>
        Promise.all(operations),
      );
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const result = await service.withdrawCommitment(userId, commitmentId);

      const expectedPenalty = 50000 * 0.1;
      const expectedReturn = 50000 - expectedPenalty;

      expect(result.withdrawnAmount).toBe(expectedReturn);
      expect(result.early).toBe(true);
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          eventType: 'EARLY_WITHDRAWAL_PENALTY',
          payload: expect.objectContaining({
            commitmentId,
            penalty: expectedPenalty,
            originalAmount: 50000,
          }),
        }),
      });
    });

    it('should reject withdrawal for non-existent commitment', async () => {
      const userId = 'user-123';
      const commitmentId = 'non-existent';

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue(null);

      await expect(
        service.withdrawCommitment(userId, commitmentId),
      ).rejects.toThrow('Commitment not found');
    });

    it('should reject withdrawal by unauthorized user', async () => {
      const userId = 'user-123';
      const otherUserId = 'user-456';
      const commitmentId = 'commitment-1';

      const mockCommitment = {
        id: commitmentId,
        userId: otherUserId, // Different user
        goalName: 'Other User Goal',
        targetAmount: 100000,
        lockedAmount: 50000,
        unlockDate: new Date(),
        penaltyRate: 0.1,
      };

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue(
        mockCommitment,
      );

      await expect(
        service.withdrawCommitment(userId, commitmentId),
      ).rejects.toThrow('Commitment not found');
    });
  });

  describe('Mock Financial Data', () => {
    it('should simulate portfolio with realistic balance', async () => {
      const userId = 'user-123';

      const realisticPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 250000, // 250k VND
        totalInvested: 500000,
        currentValue: 550000,
        returns: 50000,
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(
        realisticPortfolio,
      );

      const commitmentData = {
        goalName: 'House Down Payment',
        targetAmount: 1000000,
        lockedAmount: 200000,
        months: 36,
      };

      mockPrisma.virtualPortfolio.update.mockResolvedValue({
        ...realisticPortfolio,
        balance: 50000,
      });
      mockPrisma.simulationCommitment.create.mockResolvedValue({
        id: 'commitment-1',
        userId,
        ...commitmentData,
        unlockDate: new Date(),
        penaltyRate: 0.1,
      });

      const result = await service.createCommitment(userId, commitmentData);

      expect(result).toBeDefined();
      expect(mockPrisma.virtualPortfolio.update).toHaveBeenCalledWith({
        where: { userId },
        data: { balance: { decrement: 200000 } },
      });
    });

    it('should handle zero balance portfolio gracefully', async () => {
      const userId = 'user-123';

      const emptyPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 0,
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(emptyPortfolio);

      await expect(
        service.createCommitment(userId, {
          goalName: 'Impossible Goal',
          targetAmount: 100000,
          lockedAmount: 10000,
          months: 6,
        }),
      ).rejects.toThrow('Insufficient virtual balance to lock');
    });

    it('should support large commitment amounts', async () => {
      const userId = 'user-123';

      const wealthyPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 10000000, // 10M VND
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(
        wealthyPortfolio,
      );
      mockPrisma.virtualPortfolio.update.mockResolvedValue({
        ...wealthyPortfolio,
        balance: 5000000,
      });

      const largeCommitment = {
        goalName: 'Business Investment',
        targetAmount: 20000000,
        lockedAmount: 5000000,
        months: 60,
      };

      mockPrisma.simulationCommitment.create.mockResolvedValue({
        id: 'commitment-1',
        userId,
        ...largeCommitment,
        unlockDate: new Date(),
        penaltyRate: 0.1,
      });

      const result = await service.createCommitment(userId, largeCommitment);

      expect(result.lockedAmount).toBe(5000000);
    });
  });

  describe('Penalty Calculation', () => {
    it('should calculate 10% penalty for early withdrawal', async () => {
      const userId = 'user-123';
      const commitmentId = 'commitment-1';
      const lockedAmount = 100000;
      const penaltyRate = 0.1;

      const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const mockCommitment = {
        id: commitmentId,
        userId,
        goalName: 'Test',
        targetAmount: 200000,
        lockedAmount,
        unlockDate: futureDate,
        penaltyRate,
      };

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue(
        mockCommitment,
      );
      mockPrisma.$transaction.mockImplementation((operations) =>
        Promise.all(operations),
      );
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const result = await service.withdrawCommitment(userId, commitmentId);

      expect(result.withdrawnAmount).toBe(90000); // 100000 - 10000 penalty
      expect(result.early).toBe(true);
    });

    it('should calculate penalty with different rates', async () => {
      const userId = 'user-123';
      const commitmentId = 'commitment-1';
      const lockedAmount = 50000;
      const customPenaltyRate = 0.15; // 15%

      const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const mockCommitment = {
        id: commitmentId,
        userId,
        goalName: 'High Penalty Goal',
        targetAmount: 100000,
        lockedAmount,
        unlockDate: futureDate,
        penaltyRate: customPenaltyRate,
      };

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue(
        mockCommitment,
      );
      mockPrisma.$transaction.mockImplementation((operations) =>
        Promise.all(operations),
      );
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const result = await service.withdrawCommitment(userId, commitmentId);

      expect(result.withdrawnAmount).toBe(42500); // 50000 - 7500 penalty
      expect(result.early).toBe(true);
    });

    it('should return full amount when unlockDate is exactly now', async () => {
      const userId = 'user-123';
      const commitmentId = 'commitment-1';
      const lockedAmount = 80000;

      const now = new Date();
      const mockCommitment = {
        id: commitmentId,
        userId,
        goalName: 'Just In Time',
        targetAmount: 100000,
        lockedAmount,
        unlockDate: now,
        penaltyRate: 0.1,
      };

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue(
        mockCommitment,
      );
      mockPrisma.$transaction.mockImplementation((operations) =>
        Promise.all(operations),
      );

      const result = await service.withdrawCommitment(userId, commitmentId);

      expect(result.withdrawnAmount).toBe(80000);
      expect(result.early).toBe(false);
    });

    it('should log penalty event with correct metadata', async () => {
      const userId = 'user-123';
      const commitmentId = 'commitment-1';
      const lockedAmount = 60000;

      const futureDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
      const mockCommitment = {
        id: commitmentId,
        userId,
        goalName: 'Penalty Tracking',
        targetAmount: 100000,
        lockedAmount,
        unlockDate: futureDate,
        penaltyRate: 0.1,
      };

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue(
        mockCommitment,
      );
      mockPrisma.$transaction.mockImplementation((operations) =>
        Promise.all(operations),
      );
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      await service.withdrawCommitment(userId, commitmentId);

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          sessionId: 'simulation-engine',
          path: '/simulation/commitment/withdraw-early',
          eventType: 'EARLY_WITHDRAWAL_PENALTY',
          payload: {
            commitmentId,
            penalty: 6000,
            originalAmount: 60000,
          },
        },
      });
    });

    it('should handle edge case: zero penalty rate', async () => {
      const userId = 'user-123';
      const commitmentId = 'commitment-1';
      const lockedAmount = 50000;

      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const mockCommitment = {
        id: commitmentId,
        userId,
        goalName: 'No Penalty',
        targetAmount: 100000,
        lockedAmount,
        unlockDate: futureDate,
        penaltyRate: 0,
      };

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue(
        mockCommitment,
      );
      mockPrisma.$transaction.mockImplementation((operations) =>
        Promise.all(operations),
      );
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const result = await service.withdrawCommitment(userId, commitmentId);

      expect(result.withdrawnAmount).toBe(50000);
      expect(result.early).toBe(true); // Still early, just no penalty
    });
  });

  describe('Integration: Full Lifecycle', () => {
    it('should complete full commitment lifecycle: create → withdraw early → log penalty', async () => {
      const userId = 'user-123';

      // Step 1: Create commitment
      const mockPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 200000,
      };

      const commitmentData = {
        goalName: 'Savings Challenge',
        targetAmount: 150000,
        lockedAmount: 100000,
        months: 12,
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(mockPortfolio);
      mockPrisma.virtualPortfolio.update.mockResolvedValue({
        ...mockPortfolio,
        balance: 100000,
      });

      const futureDate = new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000);
      const mockCommitment = {
        id: 'commitment-1',
        userId,
        ...commitmentData,
        unlockDate: futureDate,
        penaltyRate: 0.1,
      };

      mockPrisma.simulationCommitment.create.mockResolvedValue(mockCommitment);

      const created = await service.createCommitment(userId, commitmentData);
      expect(created.id).toBe('commitment-1');

      // Step 2: Early withdrawal
      mockPrisma.simulationCommitment.findUnique.mockResolvedValue(
        mockCommitment,
      );
      mockPrisma.$transaction.mockImplementation((operations) =>
        Promise.all(operations),
      );
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const withdrawal = await service.withdrawCommitment(userId, created.id);

      expect(withdrawal.withdrawnAmount).toBe(90000); // 100000 - 10000 penalty
      expect(withdrawal.early).toBe(true);
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'EARLY_WITHDRAWAL_PENALTY',
        }),
      });
    });

    it('should handle complete lifecycle: create → wait → withdraw without penalty', async () => {
      const userId = 'user-123';

      const mockPortfolio = {
        id: 'portfolio-1',
        userId,
        balance: 300000,
      };

      const commitmentData = {
        goalName: 'Patient Goal',
        targetAmount: 200000,
        lockedAmount: 150000,
        months: 6,
      };

      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(mockPortfolio);
      mockPrisma.virtualPortfolio.update.mockResolvedValue({
        ...mockPortfolio,
        balance: 150000,
      });

      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const mockCommitment = {
        id: 'commitment-2',
        userId,
        ...commitmentData,
        unlockDate: pastDate,
        penaltyRate: 0.1,
      };

      mockPrisma.simulationCommitment.create.mockResolvedValue(mockCommitment);

      const created = await service.createCommitment(userId, commitmentData);

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue(
        mockCommitment,
      );
      mockPrisma.$transaction.mockImplementation((operations) =>
        Promise.all(operations),
      );

      const withdrawal = await service.withdrawCommitment(userId, created.id);

      expect(withdrawal.withdrawnAmount).toBe(150000);
      expect(withdrawal.early).toBe(false);
      expect(mockPrisma.behaviorLog.create).not.toHaveBeenCalled();
    });
  });
});
