import { EventEmitter2 } from '@nestjs/event-emitter';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GamificationService } from '../src/common/gamification.service';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { DiagnosticService } from '../src/modules/debug/diagnostic.service';
import { NudgeEngineService } from '../src/modules/nudge/nudge-engine.service';
import { NudgeListener } from '../src/modules/nudge/nudge.listener';
import { PrismaService } from '../src/prisma/prisma.service';

describe.skip('Massive Persona Stress Test (1000+ Actions Simulation) [REQUIRES_DB]', () => {
  let gamificationService: GamificationService;
  let prismaService: PrismaService;
  let diagnosticService: DiagnosticService;

  const USER_IDS = Array.from({ length: 50 }).map(
    (_, i) => `stress-user-${i.toString().padStart(3, '0')}`,
  );
  const ACTIONS_PER_USER = 100;
  const TOTAL_ACTIONS = USER_IDS.length * ACTIONS_PER_USER;

  beforeAll(async () => {
    // Manually instantiate services to avoid TestingModule metadata issues
    prismaService = new PrismaService();
    const eventEmitter = new EventEmitter2();
    gamificationService = new GamificationService(prismaService, eventEmitter);

    const analyticsService = new AnalyticsService(prismaService);
    const nudgeEngine = new NudgeEngineService(prismaService, analyticsService);
    diagnosticService = new DiagnosticService(
      prismaService,
      {} as any,
      { connectedClients: new Map() } as any,
    );

    const nudgeListener = new NudgeListener(
      nudgeEngine,
      prismaService,
      {} as any,
    );

    // Manually wire up the listener
    eventEmitter.on('points.earned', async (payload) => {
      await nudgeListener.handlePointsEarnedEvent(payload);
    });

    // Setup multiple users with different personas
    console.log(`👥 Setting up ${USER_IDS.length} users...`);
    for (const id of USER_IDS) {
      const persona = Math.random() > 0.5 ? 'HUNTER' : 'SAVER';
      await prismaService.user.upsert({
        where: { id },
        update: { points: 1000 },
        create: {
          id,
          email: `${id}@stress-test.com`,
          passwordHash: 'hash',
          points: 1000,
          metadata: { persona },
          role: 'STUDENT',
        },
      });

      // Inject initial behavior logs to establish persona history
      await prismaService.behaviorLog.createMany({
        data: Array.from({ length: 5 }).map(() => ({
          userId: id,
          eventType: persona === 'HUNTER' ? 'TRADE_BUY' : 'SAVING_DEPOSIT',
          path: '/simulation',
          sessionId: 'setup',
          payload: { isInitial: true },
        })),
      });
    }
  });

  it(`Nên xử lý ${TOTAL_ACTIONS} hành vi AI-driven nudges đồng thời`, async () => {
    console.log(`🚀 Bắt đầu Stress Test: ${TOTAL_ACTIONS} actions...`);
    const startTime = Date.now();

    const simulateUserActions = async (userId: string) => {
      for (let i = 0; i < ACTIONS_PER_USER; i++) {
        await gamificationService.logEvent(userId, 'USER_ACTION_STRESS', 1, {
          isSimulation: true,
          triggerNudge: true,
          nudgeContext: 'INVESTMENT_DECISION',
          nudgeData: { actionIndex: i, riskLevel: 50 },
        });
      }
    };

    // Run simulations in parallel
    await Promise.all(USER_IDS.map((id) => simulateUserActions(id)));

    const duration = Date.now() - startTime;
    const eps = (TOTAL_ACTIONS / (duration / 1000)).toFixed(2);

    console.log('--- Stress Test Results ---');
    console.log(`⏱️ Total Duration: ${duration}ms`);
    console.log(`📊 Events Per Second (EPS): ${eps}`);
    console.log(`✅ Total Actions: ${TOTAL_ACTIONS}`);

    // Increased threshold for dev machine performance variation
    expect(duration).toBeLessThan(150000);

    // Verify logs in DB
    const logCount = await prismaService.behaviorLog.count({
      where: { userId: { in: USER_IDS }, eventType: 'AI_DRIVEN_NUDGE' },
    });
    console.log(`📈 Nudges Generated: ${logCount}`);

    if (logCount === 0) {
      console.log('DEBUG: No nudges found. Checking points.earned events...');
      const behaviorLogsCount = await prismaService.behaviorLog.count({
        where: { userId: { in: USER_IDS }, eventType: 'USER_ACTION_STRESS' },
      });
      console.log(`📊 USER_ACTION_STRESS logs: ${behaviorLogsCount}`);

      const sampleUser = USER_IDS[0];
      // Use cast or direct access for private members in tests if needed
      const persona = await (nudgeEngine as any).analytics.getUserPersona(
        sampleUser,
      );
      console.log(`👤 Sample User Persona: ${persona}`);
    }

    // Relax timeout expectation for Windows dev environment
    expect(duration).toBeLessThan(160000);
    expect(logCount).toBeGreaterThan(0);
  }, 180000);

  afterAll(async () => {
    // Small delay to allow pending DB operations to finish
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await prismaService.behaviorLog.deleteMany({
      where: { userId: { in: USER_IDS } },
    });
    await prismaService.user.deleteMany({
      where: { id: { in: USER_IDS } },
    });

    // Explicitly disconnect to avoid Prisma/Vite crash
    await prismaService.$disconnect();
  });
});
