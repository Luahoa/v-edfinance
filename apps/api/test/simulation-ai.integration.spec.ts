import type { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AiModule } from '../src/ai/ai.module';
import { AiService } from '../src/ai/ai.service';
import { AuthModule } from '../src/auth/auth.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { CommonModule } from '../src/common/common.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { SimulationModule } from '../src/modules/simulation/simulation.module';
import { Role } from '@prisma/client';

describe('Financial Simulation AI Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userId = 'test-sim-user';
  const accessToken = 'mock-token';

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
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        EventEmitterModule.forRoot(),
        PrismaModule,
        CommonModule,
        AuthModule,
        AiModule,
        SimulationModule,
      ],
    })
      .overrideProvider('CACHE_MANAGER')
      .useValue({
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        reset: vi.fn(),
      })
      .overrideProvider(AiService)
      .useValue({
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
      })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          upsert: vi.fn().mockResolvedValue({ id: userId }),
          delete: vi.fn().mockResolvedValue({ id: userId }),
        },
        simulationScenario: {
          create: vi.fn().mockResolvedValue(mockScenario),
          findUnique: vi.fn().mockResolvedValue(mockScenario),
          update: vi.fn().mockResolvedValue({
            ...mockScenario,
            decisions: [...mockScenario.decisions, mockScenario.decisions[0]],
          }),
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        virtualPortfolio: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ userId, balance: 100000, assets: {} }),
          update: vi.fn().mockResolvedValue({
            userId,
            balance: 95000,
            assets: { BTC: 0.1 },
          }),
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        simulationCommitment: {
          create: vi.fn().mockResolvedValue({ id: 'commit-id' }),
          findUnique: vi.fn().mockResolvedValue({
            id: 'commit-id',
            userId,
            lockedAmount: 5000,
            penaltyRate: 0.1,
            unlockDate: new Date(Date.now() + 100000),
          }),
          delete: vi.fn().mockResolvedValue({ id: 'commit-id' }),
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        behaviorLog: {
          create: vi.fn().mockResolvedValue({ id: 'log-id' }),
          findMany: vi.fn().mockResolvedValue([{ payload: { penalty: 500 } }]),
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        $transaction: vi.fn((tasks) => Promise.all(tasks)),
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: vi.fn((key: string) => {
          if (key === 'JWT_SECRET') return 'test_secret';
          if (key === 'GEMINI_API_KEY') return 'test_key';
          return null;
        }),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: userId,
            email: 'sim@example.com',
            role: Role.STUDENT,
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: 'sim@example.com',
        name: 'Sim User',
        password: 'hashed_password',
        role: Role.STUDENT,
      },
    });
  });

  afterAll(async () => {
    if (app) {
      await prisma.simulationScenario.deleteMany({ where: { userId } });
      await prisma.virtualPortfolio.deleteMany({ where: { userId } });
      await prisma.simulationCommitment.deleteMany({ where: { userId } });
      await prisma.behaviorLog.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
      await app.close();
    }
  });

  describe('Full Simulation Flow', () => {
    let scenarioId: string;

    it('should start simulation and generate AI scenario', async () => {
      const res = await request(app.getHttpServer())
        .post('/simulation/life/start')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.type).toBe('LIFE');
      expect(res.body.decisions[0]).toHaveProperty('eventTitle');
      scenarioId = res.body.id;
    });

    it('should continue simulation, make decision and calculate impact', async () => {
      const scenario = await prisma.simulationScenario.findUnique({
        where: { id: scenarioId },
      });
      const firstEvent = (scenario.decisions as any)[0];
      const choiceId = firstEvent.options[0].id;

      const res = await request(app.getHttpServer())
        .post('/simulation/life/continue')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ scenarioId, choiceId })
        .expect(201);

      expect(res.body.decisions.length).toBe(2);
      expect(res.body.currentStatus.savings).toBeDefined();
    });

    it('should verify market simulation trade updates portfolio', async () => {
      // Get initial portfolio
      await request(app.getHttpServer())
        .get('/simulation/portfolio')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Execute trade
      const tradeRes = await request(app.getHttpServer())
        .post('/simulation/trade')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          asset: 'BTC',
          amount: 0.1,
          type: 'BUY',
          price: 50000,
        })
        .expect(201);

      expect(tradeRes.body.assets.BTC).toBe(0.1);
      expect(tradeRes.body.balance).toBeLessThan(100000);
    });

    it('should validate simulation history logs via behavior tracking', async () => {
      // Create commitment to trigger a log later if withdrawn early
      const commitRes = await request(app.getHttpServer())
        .post('/simulation/commitment/create')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          goalName: 'Emergency Fund',
          targetAmount: 20000,
          lockedAmount: 5000,
          months: 6,
        })
        .expect(201);

      const commitId = commitRes.body.id;

      // Withdraw early to trigger behavior log
      await request(app.getHttpServer())
        .post('/simulation/commitment/withdraw')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ id: commitId })
        .expect(201);

      const logs = await prisma.behaviorLog.findMany({
        where: { userId, eventType: 'EARLY_WITHDRAWAL_PENALTY' },
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].payload).toHaveProperty('penalty');
    });
  });
});
