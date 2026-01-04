import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

export const BEHAVIOR_EVENTS = {
  RECOMMENDATION_REFRESH: 'behavior.recommendation.refresh',
  SIGNIFICANT_ACTION: 'behavior.significant.action',
} as const;

export interface BehaviorEventData {
  userId: string;
  eventType: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface BehaviorSummary {
  userId: string;
  totalEvents: number;
  recentEvents: Array<{
    eventType: string;
    timestamp: Date;
    path: string;
  }>;
  eventBreakdown: Record<string, number>;
  lastActivity: Date | null;
}

@Injectable()
export class BehaviorAnalyticsService {
  private readonly logger = new Logger(BehaviorAnalyticsService.name);

  private readonly REFRESH_TRIGGER_EVENTS = [
    'LESSON_COMPLETED',
    'COURSE_COMPLETED',
    'QUIZ_PASSED',
    'ACHIEVEMENT_UNLOCKED',
    'PROFILE_UPDATED',
    'PREFERENCE_CHANGED',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async trackEvent(
    userId: string,
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<{ id: string; tracked: boolean }> {
    const sessionId = (data.sessionId as string) || `session-${Date.now()}`;
    const path = (data.path as string) || '/';

    try {
      const log = await this.prisma.behaviorLog.create({
        data: {
          userId,
          sessionId,
          path,
          eventType,
          actionCategory: (data.actionCategory as string) || 'GENERAL',
          duration: (data.duration as number) || 0,
          deviceInfo: data.deviceInfo as object,
          payload: data as object,
        },
      });

      this.logger.debug(`Tracked event ${eventType} for user ${userId}`);

      if (this.shouldTriggerRefresh(eventType)) {
        await this.triggerRecommendationRefresh(userId, eventType);
      }

      return { id: log.id, tracked: true };
    } catch (error) {
      this.logger.error(`Failed to track event: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserBehaviorSummary(userId: string): Promise<BehaviorSummary> {
    const logs = await this.prisma.behaviorLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const eventBreakdown = logs.reduce(
      (acc, log) => {
        acc[log.eventType] = (acc[log.eventType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      userId,
      totalEvents: logs.length,
      recentEvents: logs.slice(0, 10).map((log) => ({
        eventType: log.eventType,
        timestamp: log.timestamp,
        path: log.path,
      })),
      eventBreakdown,
      lastActivity: logs.length > 0 ? logs[0].timestamp : null,
    };
  }

  async triggerRecommendationRefresh(
    userId: string,
    triggerEvent?: string,
  ): Promise<void> {
    const eventData: BehaviorEventData = {
      userId,
      eventType: triggerEvent || 'MANUAL_REFRESH',
      data: { triggeredAt: new Date() },
      timestamp: new Date(),
    };

    this.eventEmitter.emit(BEHAVIOR_EVENTS.RECOMMENDATION_REFRESH, eventData);
    this.logger.log(
      `Emitted recommendation refresh for user ${userId} (trigger: ${triggerEvent || 'manual'})`,
    );
  }

  private shouldTriggerRefresh(eventType: string): boolean {
    return this.REFRESH_TRIGGER_EVENTS.includes(eventType);
  }
}
