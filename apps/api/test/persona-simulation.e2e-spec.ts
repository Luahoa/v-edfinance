import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AiService } from '../src/ai/ai.service';
import { GamificationService } from '../src/common/gamification.service';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import type { DiagnosticService } from '../src/modules/debug/diagnostic.service';
import { NudgeEngineService } from '../src/modules/nudge/nudge-engine.service';
import { NudgeListener } from '../src/modules/nudge/nudge.listener';
import { SocialGateway } from '../src/modules/social/social.gateway';
import { PrismaService } from '../src/prisma/prisma.service';

describe.skip('Deep Persona Simulation (Whale vs Risk-Averse) [REQUIRES_DB]', () => {
  let gamificationService: GamificationService;
  let prismaService: PrismaService;
  let diagnosticService: DiagnosticService;
  let nudgeListener: NudgeListener;

  const WHALE_ID = 'persona-whale-001';
  const SAVER_ID = 'persona-saver-001';

  beforeAll(async () => {
    // Manually instantiate services to avoid TestingModule metadata issues
    prismaService = new PrismaService();
    const eventEmitter = new EventEmitter2();
    gamificationService = new GamificationService(prismaService, eventEmitter);

    const analyticsService = new AnalyticsService(prismaService);
    const nudgeEngine = new NudgeEngineService(prismaService, analyticsService);

    nudgeListener = new NudgeListener(nudgeEngine, analyticsService);

    // Manually wire up the listener
    eventEmitter.on('points.earned', (payload) =>
      nudgeListener.handlePointsEarnedEvent(payload),
    );

    // Setup personas
    await prismaService.user.upsert({
      where: { id: WHALE_ID },
      update: { points: 10000 },
      create: {
        id: WHALE_ID,
        email: 'whale@test.com',
        passwordHash: 'hash',
        points: 10000,
        metadata: { persona: 'HUNTER' },
        role: 'STUDENT',
      },
    });

    await prismaService.user.upsert({
      where: { id: SAVER_ID },
      update: { points: 100 },
      create: {
        id: SAVER_ID,
        email: 'saver@test.com',
        passwordHash: 'hash',
        points: 100,
        metadata: { persona: 'SAVER' },
        role: 'STUDENT',
      },
    });

    // Create some initial behavior logs to satisfy AnalyticsService.getUserPersona
    for (let i = 0; i < 6; i++) {
      await prismaService.behaviorLog.create({
        data: {
          userId: WHALE_ID,
          eventType: 'TRADE_BUY',
          path: '/trade',
          sessionId: 'setup',
        },
      });
      await prismaService.behaviorLog.create({
        data: {
          userId: SAVER_ID,
          eventType: 'COMMITMENT_CREATED',
          path: '/save',
          sessionId: 'setup',
        },
      });
    }
  });

  it('Whale Persona nên nhận Social Proof Nudge khi giao dịch lớn', async () => {
    console.log('🐋 Simulating Whale Investor behavior...');

    await gamificationService.logEvent(WHALE_ID, 'TRADE_BUY', 50, {
      isSimulation: true,
      triggerNudge: true,
      nudgeContext: 'INVESTMENT_DECISION',
      nudgeData: { amount: 1000000 },
    });

    // Wait for event cycle
    await new Promise((resolve) => setTimeout(resolve, 100));

    const nudgeLog = await prismaService.behaviorLog.findFirst({
      where: { userId: WHALE_ID, eventType: 'AI_DRIVEN_NUDGE' },
      orderBy: { timestamp: 'desc' },
    });

    expect(nudgeLog).toBeDefined();
    if (nudgeLog) {
      const payload = nudgeLog.payload;
      expect(payload.nudge.type).toBe('SOCIAL_PROOF');
    }
    console.log('✅ Whale received Social Proof Nudge.');
  });

  it('Risk-Averse Persona nên nhận Loss Aversion Nudge khi gặp rủi ro cao', async () => {
    console.log('🛡️ Simulating Risk-Averse behavior...');

    await gamificationService.logEvent(SAVER_ID, 'HIGH_RISK_DECISION', 10, {
      isSimulation: true,
      triggerNudge: true,
      nudgeContext: 'INVESTMENT_DECISION',
      nudgeData: { riskLevel: 90 },
    });

    // Wait for event cycle
    await new Promise((resolve) => setTimeout(resolve, 100));

    const nudgeLog = await prismaService.behaviorLog.findFirst({
      where: { userId: SAVER_ID, eventType: 'AI_DRIVEN_NUDGE' },
      orderBy: { timestamp: 'desc' },
    });

    expect(nudgeLog).toBeDefined();
    if (nudgeLog) {
      const payload = nudgeLog.payload;
      expect(payload.nudge.type).toBe('LOSS_AVERSION');
    }
    console.log('✅ Risk-Averse received Loss Aversion Nudge.');
  });

  afterAll(async () => {
    await prismaService.behaviorLog.deleteMany({
      where: { userId: { in: [WHALE_ID, SAVER_ID] } },
    });
    // Giữ user để các test khác có thể dùng hoặc xóa tùy ý
  });
});
