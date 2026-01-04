import { EventEmitter2 } from '@nestjs/event-emitter';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GamificationService } from '../src/common/gamification.service';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { DiagnosticService } from '../src/modules/debug/diagnostic.service';
import { NudgeEngineService } from '../src/modules/nudge/nudge-engine.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe.skip('Multi-Market Market Stress Test (VI/EN/ZH Localized Content) [REQUIRES_DB]', () => {
  let gamificationService: GamificationService;
  let prismaService: PrismaService;
  let diagnosticService: DiagnosticService;

  const LOCALES = ['vi', 'en', 'zh'];
  const USERS_PER_LOCALE = 20;
  const ACTIONS_PER_USER = 50;
  const TOTAL_ACTIONS = LOCALES.length * USERS_PER_LOCALE * ACTIONS_PER_USER;

  const USER_IDS = LOCALES.flatMap((locale) =>
    Array.from({ length: USERS_PER_LOCALE }).map(
      (_, i) => `market-user-${locale}-${i.toString().padStart(3, '0')}`,
    ),
  );

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

    console.log(
      `👥 Setting up ${USER_IDS.length} users across ${LOCALES.join(', ')}...`,
    );
    for (const id of USER_IDS) {
      const locale = id.split('-')[2];
      await prismaService.user.upsert({
        where: { id },
        update: { points: 1000 },
        create: {
          id,
          email: `${id}@market-test.com`,
          passwordHash: 'hash',
          points: 1000,
          metadata: { locale, persona: 'MULTI_MARKET_TESTER' },
          role: 'STUDENT',
        },
      });
    }

    // Setup localized content in DB
    await prismaService.course.upsert({
      where: { slug: 'multi-market-course' },
      update: {},
      create: {
        title: {
          vi: 'Khóa học Đa Thị Trường',
          en: 'Multi-Market Course',
          zh: '多市场课程',
        },
        slug: 'multi-market-course',
        description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
        price: 0,
        thumbnailKey: 'test-thumbnail',
      },
    });
  });

  it(`Nên xử lý ${TOTAL_ACTIONS} hành vi với localized content sharding`, async () => {
    console.log(
      `🚀 Bắt đầu Multi-Market Stress Test: ${TOTAL_ACTIONS} actions...`,
    );
    const startTime = Date.now();

    const simulateLocalizedActions = async (userId: string) => {
      const locale = userId.split('-')[2];
      for (let i = 0; i < ACTIONS_PER_USER; i++) {
        await gamificationService.logEvent(
          userId,
          `ACTION_${locale.toUpperCase()}`,
          1,
          {
            isSimulation: true,
            market: locale,
            contentKey: `course.title.${locale}`,
            payload: { actionIndex: i, timestamp: new Date().toISOString() },
          },
        );
      }
    };

    // Run simulations in parallel
    await Promise.all(USER_IDS.map((id) => simulateLocalizedActions(id)));

    const duration = Date.now() - startTime;
    const eps = (TOTAL_ACTIONS / (duration / 1000)).toFixed(2);

    console.log('--- Multi-Market Stress Test Results ---');
    console.log(`⏱️ Total Duration: ${duration}ms`);
    console.log(`📊 Events Per Second (EPS): ${eps}`);
    console.log(`✅ Total Actions: ${TOTAL_ACTIONS}`);

    expect(duration).toBeLessThan(60000);

    // Verify DB Sharding Integrity (JSONB Locale fields)
    const logs = await prismaService.behaviorLog.findMany({
      where: { userId: { in: USER_IDS } },
      take: 100,
    });

    for (const log of logs) {
      const locale = log.userId.split('-')[2];
      expect(log.payload.market).toBe(locale);
    }
  }, 60000);

  afterAll(async () => {
    await prismaService.behaviorLog.deleteMany({
      where: { userId: { in: USER_IDS } },
    });
    await prismaService.user.deleteMany({ where: { id: { in: USER_IDS } } });
    await prismaService.course.deleteMany({
      where: { slug: 'multi-market-course' },
    });
  });
});
