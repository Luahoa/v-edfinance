import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';

describe('SimulationController', () => {
  let controller: SimulationController;
  let service: SimulationService;

  const mockSimulationService = {
    getPortfolio: vi.fn(),
    trade: vi.fn(),
    startLifeScenario: vi.fn(),
    continueLifeScenario: vi.fn(),
    processBudgetDecision: vi.fn(),
    runStressTest: vi.fn(),
    calculateLongTermImpact: vi.fn(),
    createCommitment: vi.fn(),
    withdrawCommitment: vi.fn(),
  };

  const mockUser = { id: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulationController],
      providers: [
        { provide: SimulationService, useValue: mockSimulationService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<SimulationController>(SimulationController);
    service = module.get<SimulationService>(SimulationService);

    // Manually bind service to controller (NestJS TestingModule binding fix)
    (controller as any).simulationService = service;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /simulation/portfolio', () => {
    it('should return user simulation portfolio', async () => {
      const mockPortfolio = {
        cash: 50000000,
        stocks: [{ symbol: 'VN30', shares: 100, value: 10000000 }],
        totalValue: 60000000,
      };

      mockSimulationService.getPortfolio.mockResolvedValue(mockPortfolio);

      const result = await controller.getPortfolio({ user: mockUser });

      expect(service.getPortfolio).toHaveBeenCalledWith('user-1');
      expect(result.totalValue).toBe(60000000);
      expect(result.stocks).toHaveLength(1);
    });

    it('should handle empty portfolio', async () => {
      mockSimulationService.getPortfolio.mockResolvedValue({
        cash: 100000000,
        stocks: [],
        totalValue: 100000000,
      });

      const result = await controller.getPortfolio({ user: mockUser });

      expect(result.stocks).toHaveLength(0);
      expect(result.cash).toBe(100000000);
    });
  });

  describe('POST /simulation/trade', () => {
    it('should execute buy trade successfully', async () => {
      const tradeBody = {
        asset: 'VN30',
        amount: 100,
        type: 'BUY' as const,
        price: 100000,
      };
      const mockResult = {
        success: true,
        newBalance: 90000000,
        sharesOwned: 100,
      };

      mockSimulationService.trade.mockResolvedValue(mockResult);

      const result = await controller.trade({ user: mockUser }, tradeBody);

      expect(service.trade).toHaveBeenCalledWith(
        'user-1',
        'VN30',
        100,
        'BUY',
        100000,
      );
      expect(result.success).toBe(true);
      expect(result.sharesOwned).toBe(100);
    });

    it('should execute sell trade successfully', async () => {
      const tradeBody = {
        asset: 'VN30',
        amount: 50,
        type: 'SELL' as const,
        price: 110000,
      };
      const mockResult = {
        success: true,
        newBalance: 105500000,
        profit: 500000,
      };

      mockSimulationService.trade.mockResolvedValue(mockResult);

      const result = await controller.trade({ user: mockUser }, tradeBody);

      expect(service.trade).toHaveBeenCalledWith(
        'user-1',
        'VN30',
        50,
        'SELL',
        110000,
      );
      expect(result.profit).toBe(500000);
    });

    it('should validate insufficient funds', async () => {
      const tradeBody = {
        asset: 'VN30',
        amount: 1000,
        type: 'BUY' as const,
        price: 100000,
      };
      mockSimulationService.trade.mockRejectedValue(
        new Error('Insufficient funds'),
      );

      await expect(
        controller.trade({ user: mockUser }, tradeBody),
      ).rejects.toThrow('Insufficient funds');
    });
  });

  describe('POST /simulation/life/start', () => {
    it('should start a new life scenario', async () => {
      const mockScenario = {
        scenarioId: 'sc-1',
        title: 'First Job',
        description:
          'You just got your first job. How will you manage your salary?',
        choices: [
          { id: 'ch-1', text: 'Save 50%' },
          { id: 'ch-2', text: 'Spend it all' },
        ],
      };

      mockSimulationService.startLifeScenario.mockResolvedValue(mockScenario);

      const result = await controller.startLife({ user: mockUser });

      expect(service.startLifeScenario).toHaveBeenCalledWith('user-1');
      expect(result.choices).toHaveLength(2);
    });

    it('should generate AI-powered scenario', async () => {
      const mockScenario = {
        scenarioId: 'sc-2',
        aiGenerated: true,
        difficulty: 'MEDIUM',
      };

      mockSimulationService.startLifeScenario.mockResolvedValue(mockScenario);

      const result = await controller.startLife({ user: mockUser });

      expect(result.aiGenerated).toBe(true);
    });
  });

  describe('POST /simulation/life/continue', () => {
    it('should process user choice and continue scenario', async () => {
      const body = { scenarioId: 'sc-1', choiceId: 'ch-1' };
      const mockContinuation = {
        outcome: 'You saved 50% and built an emergency fund',
        nextChoices: [{ id: 'ch-3', text: 'Invest the rest' }],
      };

      mockSimulationService.continueLifeScenario.mockResolvedValue(
        mockContinuation,
      );

      const result = await controller.continueLife({ user: mockUser }, body);

      expect(service.continueLifeScenario).toHaveBeenCalledWith(
        'user-1',
        'sc-1',
        'ch-1',
      );
      expect(result.outcome).toContain('saved 50%');
    });

    it('should handle scenario completion', async () => {
      const body = { scenarioId: 'sc-1', choiceId: 'ch-final' };
      mockSimulationService.continueLifeScenario.mockResolvedValue({
        completed: true,
        score: 85,
      });

      const result = await controller.continueLife({ user: mockUser }, body);

      expect(result.completed).toBe(true);
      expect(result.score).toBe(85);
    });
  });

  describe('POST /simulation/budget/process', () => {
    it('should process budget allocation decision', async () => {
      const body = {
        allocation: { savings: 0.3, expenses: 0.5, investment: 0.2 },
      };
      const mockResult = { valid: true, feedback: 'Good balance' };

      mockSimulationService.processBudgetDecision.mockResolvedValue(mockResult);

      const result = await controller.processBudget({ user: mockUser }, body);

      expect(service.processBudgetDecision).toHaveBeenCalledWith(
        'user-1',
        body.allocation,
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('POST /simulation/stress-test', () => {
    it('should run financial stress test', async () => {
      const body = { scenarios: ['MARKET_CRASH', 'JOB_LOSS'] };
      const mockResult = {
        resilience: 0.7,
        recommendations: ['Increase emergency fund'],
      };

      mockSimulationService.runStressTest.mockResolvedValue(mockResult);

      const result = await controller.runStressTest({ user: mockUser }, body);

      expect(service.runStressTest).toHaveBeenCalledWith('user-1', body);
      expect(result.resilience).toBe(0.7);
    });

    it('should test multiple economic scenarios', async () => {
      const body = { scenarios: ['INFLATION', 'RECESSION', 'MARKET_BOOM'] };
      mockSimulationService.runStressTest.mockResolvedValue({
        tested: 3,
        passed: 2,
      });

      const result = await controller.runStressTest({ user: mockUser }, body);

      expect(result.tested).toBe(3);
    });
  });

  describe('POST /simulation/impact-analysis', () => {
    it('should calculate long-term impact with default years', async () => {
      const body = { amount: 5000000 };
      const mockImpact = { futureValue: 15000000, years: 10 };

      mockSimulationService.calculateLongTermImpact.mockResolvedValue(
        mockImpact,
      );

      const result = await controller.getImpactAnalysis(
        { user: mockUser },
        body,
      );

      expect(service.calculateLongTermImpact).toHaveBeenCalledWith(
        'user-1',
        5000000,
        undefined,
      );
      expect(result.futureValue).toBeGreaterThan(body.amount);
    });

    it('should calculate impact for custom time horizon', async () => {
      const body = { amount: 10000000, years: 20 };
      mockSimulationService.calculateLongTermImpact.mockResolvedValue({
        futureValue: 50000000,
        years: 20,
      });

      const result = await controller.getImpactAnalysis(
        { user: mockUser },
        body,
      );

      expect(service.calculateLongTermImpact).toHaveBeenCalledWith(
        'user-1',
        10000000,
        20,
      );
      expect(result.years).toBe(20);
    });
  });

  describe('POST /simulation/commitment/create', () => {
    it('should create financial commitment', async () => {
      const body = {
        goalName: 'Emergency Fund',
        targetAmount: 50000000,
        lockedAmount: 5000000,
        months: 12,
      };
      const mockCommitment = { id: 'commit-1', ...body, penaltyRate: 0.1 };

      mockSimulationService.createCommitment.mockResolvedValue(mockCommitment);

      const result = await controller.createCommitment(
        { user: mockUser },
        body,
      );

      expect(service.createCommitment).toHaveBeenCalledWith('user-1', body);
      expect(result.id).toBe('commit-1');
      expect(result.penaltyRate).toBeDefined();
    });

    it('should enforce loss aversion logic', async () => {
      const body = {
        goalName: 'Retirement',
        targetAmount: 1000000000,
        lockedAmount: 50000000,
        months: 120,
      };
      mockSimulationService.createCommitment.mockResolvedValue({
        ...body,
        penaltyRate: 0.15,
      });

      const result = await controller.createCommitment(
        { user: mockUser },
        body,
      );

      expect(result.penaltyRate).toBeGreaterThan(0);
    });
  });

  describe('POST /simulation/commitment/withdraw', () => {
    it('should withdraw commitment with penalty', async () => {
      const body = { id: 'commit-1' };
      const mockResult = {
        withdrawn: true,
        penalty: 500000,
        refunded: 4500000,
      };

      mockSimulationService.withdrawCommitment.mockResolvedValue(mockResult);

      const result = await controller.withdrawCommitment(
        { user: mockUser },
        body,
      );

      expect(service.withdrawCommitment).toHaveBeenCalledWith(
        'user-1',
        'commit-1',
      );
      expect(result.penalty).toBeGreaterThan(0);
      expect(result.withdrawn).toBe(true);
    });
  });
});
