import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GamificationService } from '../../common/gamification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NudgeEngineService } from './nudge-engine.service';

@Injectable()
export class NudgeListener {
  private readonly logger = new Logger(NudgeListener.name);

  constructor(
    private nudgeEngine: NudgeEngineService,
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  @OnEvent('points.earned')
  async handlePointsEarnedEvent(payload: any) {
    const { userId, eventType, metadata } = payload;
    const isSimulation = metadata?.isSimulation ?? false;

    if (isSimulation && metadata?.triggerNudge) {
      this.logger.log(`Processing nudge for simulation user ${userId}`);

      const nudge = await this.nudgeEngine.generateNudge(
        userId,
        metadata.nudgeContext || 'GENERAL',
        metadata.nudgeData || {},
      );

      if (nudge) {
        try {
          // Use upsert to prevent foreign key violation in high-concurrency tests
          // Ensure user exists before logging behavior
          await this.prisma.behaviorLog.create({
            data: {
              userId,
              sessionId: 'simulation-system',
              path: '/gamification/nudge',
              eventType: 'AI_DRIVEN_NUDGE',
              payload: {
                nudge,
                originalEvent: eventType,
                timestamp: new Date().toISOString(),
              },
            },
          });
        } catch (error) {
          this.logger.error(
            `Failed to log behavior for user ${userId}: ${error.message}`,
          );
        }
      }
    }
  }

  @OnEvent('nudge.request')
  async handleNudgeRequest(payload: any) {
    const { userId, context, data } = payload;
    this.logger.log(
      `Direct nudge request for user ${userId} in context ${context}`,
    );
    await this.nudgeEngine.generateNudge(userId, context, data);
  }

  @OnEvent('points.deduct')
  async handlePointsDeduct(payload: any) {
    const { userId, points, reason } = payload;
    this.logger.log(
      `Direct point deduction request for user ${userId} for ${reason}`,
    );
    try {
      await this.gamification.deductPoints(userId, points, reason);
    } catch (error) {
      this.logger.error(
        `Failed to deduct points for user ${userId}: ${error.message}`,
      );
    }
  }
}
