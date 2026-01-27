import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SimulationService } from './simulation.service';

describe('SimulationService (Pure Unit Test)', () => {
  let service: SimulationService;
  let mockPrisma: any;
  let mockAi: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      virtualPortfolio: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      simulationScenario: {
        create: vi.fn(),
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
        return cb;
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
    const mockValidation = {
      validate: vi.fn((type, data) => data),
    };
    service = new SimulationService(
      mockPrisma,
      mockAi,
      mockEventEmitter,
      mockValidation as any,
    );
  });

  describe('Virtual Portfolio', () => {
    it('should create portfolio if not exists', async () => {
      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue(null);
      mockPrisma.virtualPortfolio.create.mockResolvedValue({ balance: 100000 });

      const p = await service.getPortfolio('u1');
      expect(p.balance).toBe(100000);
      expect(mockPrisma.virtualPortfolio.create).toHaveBeenCalled();
    });

    it('should process trade BUY correctly', async () => {
      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
        balance: 100000,
        assets: {},
      });
      mockPrisma.virtualPortfolio.update.mockResolvedValue({
        balance: 90000,
        assets: { BTC: 1 },
      });

      const result = await service.trade('u1', 'BTC', 1, 'BUY', 10000);

      expect(mockPrisma.virtualPortfolio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            balance: { decrement: 10000 },
            assets: { BTC: 1 },
          }),
        }),
      );
    });

    it('should throw error for insufficient balance', async () => {
      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
        balance: 50,
        assets: {},
      });
      await expect(service.trade('u1', 'BTC', 1, 'BUY', 10000)).rejects.toThrow(
        'Insufficient virtual balance',
      );
    });
  });

  describe('Budget Decision', () => {
    it('should provide feedback for 50/30/20 rule', async () => {
      const result = await service.processBudgetDecision('u1', {
        needs: 50,
        wants: 30,
        savings: 20,
      });
      expect(result.success).toBe(true);
      expect(result.feedback).toContain('Excellent');
    });

    it('should warn for high wants', async () => {
      const result = await service.processBudgetDecision('u1', {
        needs: 40,
        wants: 50,
        savings: 10,
      });
      expect(result.feedback).toContain('Warning');
    });
  });

  describe('Stress Test', () => {
    it('should calculate survival months and emit nudge', async () => {
      const result = await service.runStressTest('u1', {
        monthlyIncome: 100,
        monthlyExpenses: 50,
        emergencyFund: 300,
      });
      expect(result.survivalMonths).toBe('6.0');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'nudge.request',
        expect.any(Object),
      );
    });
  });

  describe('Commitment Devices', () => {
    it('should create a commitment and lock funds', async () => {
      mockPrisma.virtualPortfolio.findUnique.mockResolvedValue({
        balance: 10000,
      });
      mockPrisma.simulationCommitment.create.mockResolvedValue({ id: 'c1' });

      const result = await service.createCommitment('u1', {
        goalName: 'New Car',
        targetAmount: 50000,
        lockedAmount: 1000,
        months: 6,
      });

      expect(mockPrisma.virtualPortfolio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { balance: { decrement: 1000 } },
        }),
      );
      expect(mockPrisma.simulationCommitment.create).toHaveBeenCalled();
      expect(result.id).toBe('c1');
    });

    it('should penalize early withdrawal', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue({
        id: 'c1',
        userId: 'u1',
        lockedAmount: 1000,
        penaltyRate: 0.1,
        unlockDate: futureDate,
      });

      const result = await service.withdrawCommitment('u1', 'c1');

      expect(result.withdrawnAmount).toBe(900);
      expect(result.early).toBe(true);
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalled();
      expect(mockPrisma.virtualPortfolio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { balance: { increment: 900 } },
        }),
      );
    });

    it('should return full amount for on-time withdrawal', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue({
        id: 'c1',
        userId: 'u1',
        lockedAmount: 1000,
        penaltyRate: 0.1,
        unlockDate: pastDate,
      });

      const result = await service.withdrawCommitment('u1', 'c1');

      expect(result.withdrawnAmount).toBe(1000);
      expect(result.early).toBe(false);
      expect(mockPrisma.virtualPortfolio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { balance: { increment: 1000 } },
        }),
      );
    });
  });

  describe('Long Term Impact', () => {
    it('should calculate future value and emit nudge', async () => {
      const result = await service.calculateLongTermImpact('u1', 1000, 10);

      expect(result.futureValue).toBeGreaterThan(1000);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('nudge.request', {
        userId: 'u1',
        context: 'BUDGETING',
        data: { amount: 1000 },
      });
    });
  });
});
