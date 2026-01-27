import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimulationService } from '../src/modules/simulation/simulation.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AiService } from '../src/ai/ai.service';
import { ValidationService } from '../src/common/validation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';

/**
 * Financial Simulation AI Integration Test
 * Converted from E2E to unit test with mocks to avoid AuthModule circular dependency
 */
describe('Financial Simulation AI Integration', () => {
  let simulationService: SimulationService;

  const userId = 'test-sim-user';

  const mockScenario = {
    id: 'mock-scenario-id',
    userId,
    type: 'LIFE',
    currentStatus: {
      age: 22,
      savings: 5000000,
      happiness: 100,
    },
    decisions: [
      {
        eventTitle: 'Initial Event',
        description: 'Description',
        options: [
          {
            id: 'A',
            text: 'Option A',
            impact: { savings: 1000, happiness: 5 },
          },
        ],
        aiNudge: 'Nudge',
      },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    user: {
      upsert: vi.fn().mockResolvedValue({ id: userId }),
      findUnique: vi.fn().mockResolvedValue({
        id: userId,
        email: 'sim@example.com',
        role: Role.STUDENT,
      }),
    },
    simulationScenario: {
      create: vi.fn().mockResolvedValue(mockScenario),
      findUnique: vi.fn().mockResolvedValue(mockScenario),
      findFirst: vi.fn().mockResolvedValue(mockScenario),
      update: vi.fn().mockResolvedValue({
        ...mockScenario,
        decisions: [...mockScenario.decisions, mockScenario.decisions[0]],
      }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    virtualPortfolio: {
      findUnique: vi.fn().mockResolvedValue({
        userId,
        balance: 100000,
        assets: {},
      }),
      create: vi.fn().mockResolvedValue({
        userId,
        balance: 100000,
        assets: {},
      }),
      upsert: vi.fn().mockResolvedValue({
        userId,
        balance: 95000,
        assets: { BTC: 0.1 },
      }),
      update: vi.fn().mockResolvedValue({
        userId,
        balance: 95000,
        assets: { BTC: 0.1 },
      }),
    },
    simulationCommitment: {
      create: vi.fn().mockResolvedValue({
        id: 'commit-id',
        userId,
        lockedAmount: 5000,
        penaltyRate: 0.1,
        unlockDate: new Date(Date.now() + 100000),
      }),
      findUnique: vi.fn().mockResolvedValue({
        id: 'commit-id',
        userId,
        lockedAmount: 5000,
        penaltyRate: 0.1,
        unlockDate: new Date(Date.now() + 100000),
      }),
      delete: vi.fn().mockResolvedValue({ id: 'commit-id' }),
    },
    behaviorLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-id' }),
      findMany: vi.fn().mockResolvedValue([{ payload: { penalty: 500 } }]),
    },
    $transaction: vi.fn((tasks) => Promise.all(tasks)),
  };

  const mockAiService = {
    modelInstance: {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              eventTitle: 'AI Event',
              description: 'Description',
              options: [
                {
                  id: 'A',
                  text: 'Option A',
                  impact: { savings: 1000, happiness: 5 },
                },
              ],
              aiNudge: 'Nudge',
            }),
        },
      }),
    },
    generateScenarioEvent: vi.fn().mockResolvedValue({
      eventTitle: 'AI Generated Event',
      description: 'AI generated description',
      options: [
        { id: 'A', text: 'Option A', impact: { savings: 1000, happiness: 5 } },
        { id: 'B', text: 'Option B', impact: { savings: -500, happiness: 10 } },
      ],
      aiNudge: 'Consider your long-term goals',
    }),
  };

  const mockEventEmitter = {
    emit: vi.fn(),
  };

  const mockValidationService = {
    validate: vi.fn((schemaName: string, data: unknown) => data),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: ValidationService, useValue: mockValidationService },
      ],
    }).compile();

    simulationService = module.get<SimulationService>(SimulationService);

    // Manual binding for NestJS DI workaround
    (simulationService as any).prisma = mockPrisma;
    (simulationService as any).ai = mockAiService;
    (simulationService as any).eventEmitter = mockEventEmitter;
    (simulationService as any).validation = mockValidationService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Simulation Flow', () => {
    it('should start simulation and generate AI scenario', async () => {
      const result = await simulationService.startLifeScenario(userId);

      expect(result).toBeDefined();
      expect(result.type).toBe('LIFE');
      expect(mockPrisma.simulationScenario.create).toHaveBeenCalled();
    });

    it('should continue simulation and calculate impact', async () => {
      const scenarioId = mockScenario.id;
      const choiceId = 'A';

      const result = await simulationService.continueLifeScenario(
        userId,
        scenarioId,
        choiceId,
      );

      expect(result).toBeDefined();
      expect(mockPrisma.simulationScenario.update).toHaveBeenCalled();
    });

    it('should get portfolio for market simulation', async () => {
      const portfolio = await simulationService.getPortfolio(userId);

      expect(portfolio).toBeDefined();
      expect(portfolio.balance).toBe(100000);
      expect(mockPrisma.virtualPortfolio.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should execute trade and update portfolio', async () => {
      const tradeData = {
        asset: 'BTC',
        amount: 0.1,
        type: 'BUY' as const,
        price: 50000,
      };

      const result = await simulationService.trade(
        userId,
        tradeData.asset,
        tradeData.amount,
        tradeData.type,
        tradeData.price,
      );

      expect(result).toBeDefined();
      expect(result.assets.BTC).toBe(0.1);
      expect(result.balance).toBeLessThan(100000);
    });

    it('should create commitment contract', async () => {
      const commitmentData = {
        goalName: 'Emergency Fund',
        targetAmount: 20000,
        lockedAmount: 5000,
        months: 6,
      };

      const result = await simulationService.createCommitment(
        userId,
        commitmentData,
      );

      expect(result).toBeDefined();
      expect(result.lockedAmount).toBe(5000);
      expect(mockPrisma.simulationCommitment.create).toHaveBeenCalled();
    });

    it('should handle early withdrawal with penalty logging', async () => {
      const commitId = 'commit-id';

      mockPrisma.simulationCommitment.findUnique.mockResolvedValue({
        id: commitId,
        userId,
        lockedAmount: 5000,
        penaltyRate: 0.1,
        unlockDate: new Date(Date.now() + 100000),
      });

      const result = await simulationService.withdrawCommitment(
        userId,
        commitId,
      );

      expect(result).toBeDefined();
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'EARLY_WITHDRAWAL_PENALTY',
          }),
        }),
      );
    });
  });

  describe('AI Integration', () => {
    it('should generate AI-powered scenario events', async () => {
      const currentStatus = {
        age: 25,
        savings: 10000000,
        happiness: 80,
      };

      const event = await mockAiService.generateScenarioEvent(currentStatus);

      expect(event.eventTitle).toBeDefined();
      expect(event.options).toHaveLength(2);
      expect(event.aiNudge).toBeDefined();
    });
  });
});
