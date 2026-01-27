import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface FunnelStage {
  stage: string;
  count: number;
  dropOffRate: number;
  avgTimeToNext?: number;
}

export interface ConversionFunnel {
  stages: FunnelStage[];
  overallConversionRate: number;
  totalUsers: number;
}

export interface CohortData {
  cohortId: string;
  startDate: Date;
  userCount: number;
  retentionByStage: Record<string, number>;
  avgCompletionTime: number;
}

export interface DropOffPoint {
  stage: string;
  dropOffRate: number;
  userCount: number;
  reasons: string[];
}

@Injectable()
export class FunnelAnalysisService {
  private readonly logger = new Logger(FunnelAnalysisService.name);

  constructor(private prisma: PrismaService) {}

  async getConversionFunnel(
    stages: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ConversionFunnel> {
    this.logger.log(`Analyzing funnel for stages: ${stages.join(' → ')}`);

    const stageCounts = await Promise.all(
      stages.map(async (stage, index) => {
        const count = await this.prisma.behaviorLog.count({
          where: {
            eventType: stage,
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        let avgTimeToNext: number | undefined;
        if (index < stages.length - 1) {
          const nextStage = stages[index + 1];
          avgTimeToNext = await this.calculateAvgTimeToNextStage(
            stage,
            nextStage,
            startDate,
            endDate,
          );
        }

        return { stage, count, avgTimeToNext };
      }),
    );

    const totalUsers = stageCounts[0]?.count || 0;
    const stagesWithDropOff: FunnelStage[] = stageCounts.map(
      (stageData, index) => {
        const previousCount =
          index > 0 ? stageCounts[index - 1].count : totalUsers;
        const dropOffRate =
          previousCount > 0
            ? ((previousCount - stageData.count) / previousCount) * 100
            : 0;

        return {
          stage: stageData.stage,
          count: stageData.count,
          dropOffRate: Number(dropOffRate.toFixed(2)),
          avgTimeToNext: stageData.avgTimeToNext,
        };
      },
    );

    const finalStageCount = stageCounts[stageCounts.length - 1]?.count || 0;
    const overallConversionRate =
      totalUsers > 0 ? (finalStageCount / totalUsers) * 100 : 0;

    return {
      stages: stagesWithDropOff,
      overallConversionRate: Number(overallConversionRate.toFixed(2)),
      totalUsers,
    };
  }

  async detectDropOffPoints(
    stages: string[],
    startDate: Date,
    endDate: Date,
    threshold = 30,
  ): Promise<DropOffPoint[]> {
    const funnel = await this.getConversionFunnel(stages, startDate, endDate);

    const dropOffPoints: DropOffPoint[] = funnel.stages
      .filter((stage) => stage.dropOffRate >= threshold)
      .map((stage) => ({
        stage: stage.stage,
        dropOffRate: stage.dropOffRate,
        userCount: stage.count,
        reasons: this.inferDropOffReasons(stage.dropOffRate),
      }));

    this.logger.log(
      `Detected ${dropOffPoints.length} critical drop-off points`,
    );
    return dropOffPoints;
  }

  async analyzeCohort(
    cohortStartDate: Date,
    cohortEndDate: Date,
    stages: string[],
  ): Promise<CohortData> {
    const userIds = await this.getUsersInCohort(cohortStartDate, cohortEndDate);

    const retentionByStage: Record<string, number> = {};
    let totalCompletionTime = 0;
    let completedUsers = 0;

    for (const stage of stages) {
      const usersAtStage = await this.prisma.behaviorLog.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          eventType: stage,
        },
      });

      const retentionRate =
        userIds.length > 0 ? (usersAtStage.length / userIds.length) * 100 : 0;
      retentionByStage[stage] = Number(retentionRate.toFixed(2));
    }

    for (const userId of userIds) {
      const completionTime = await this.getUserJourneyTime(userId, stages);
      if (completionTime > 0) {
        totalCompletionTime += completionTime;
        completedUsers++;
      }
    }

    const avgCompletionTime =
      completedUsers > 0 ? totalCompletionTime / completedUsers : 0;

    return {
      cohortId: `cohort-${cohortStartDate.toISOString().split('T')[0]}`,
      startDate: cohortStartDate,
      userCount: userIds.length,
      retentionByStage,
      avgCompletionTime: Number(avgCompletionTime.toFixed(2)),
    };
  }

  async trackUserJourney(userId: string): Promise<{
    stages: string[];
    timestamps: Date[];
    duration: number;
    completed: boolean;
  }> {
    const logs = await this.prisma.behaviorLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
      select: {
        eventType: true,
        timestamp: true,
      },
    });

    if (logs.length === 0) {
      return {
        stages: [],
        timestamps: [],
        duration: 0,
        completed: false,
      };
    }

    const stages = logs.map((log) => log.eventType);
    const timestamps = logs.map((log) => log.timestamp);
    const firstTimestamp = new Date(timestamps[0]);
    const lastTimestamp = new Date(timestamps[timestamps.length - 1]);
    const duration =
      (lastTimestamp.getTime() - firstTimestamp.getTime()) / 1000;

    const completed = this.isJourneyCompleted(stages);

    return {
      stages,
      timestamps,
      duration,
      completed,
    };
  }

  private async calculateAvgTimeToNextStage(
    currentStage: string,
    nextStage: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const sessions = await this.prisma.behaviorLog.findMany({
      where: {
        eventType: { in: [currentStage, nextStage] },
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const sessionMap = new Map<string, { current?: Date; next?: Date }>();

    for (const log of sessions) {
      const sessionId = log.sessionId || log.userId || 'anonymous';
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {});
      }

      const session = sessionMap.get(sessionId)!;
      if (log.eventType === currentStage && !session.current) {
        session.current = log.timestamp;
      } else if (log.eventType === nextStage && !session.next) {
        session.next = log.timestamp;
      }
    }

    let totalTime = 0;
    let count = 0;

    for (const session of sessionMap.values()) {
      if (session.current && session.next) {
        const timeDiff =
          (new Date(session.next).getTime() -
            new Date(session.current).getTime()) /
          1000;
        totalTime += timeDiff;
        count++;
      }
    }

    return count > 0 ? Number((totalTime / count).toFixed(2)) : 0;
  }

  private async getUsersInCohort(
    startDate: Date,
    endDate: Date,
  ): Promise<string[]> {
    const users = await this.prisma.behaviorLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        userId: { not: null },
      },
    });

    return users.map((u) => u.userId).filter((id): id is string => id !== null);
  }

  private async getUserJourneyTime(
    userId: string,
    stages: string[],
  ): Promise<number> {
    const logs = await this.prisma.behaviorLog.findMany({
      where: {
        userId,
        eventType: { in: stages },
      },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true },
    });

    if (logs.length < 2) return 0;

    const firstLog = new Date(logs[0].timestamp);
    const lastLog = new Date(logs[logs.length - 1].timestamp);

    return (lastLog.getTime() - firstLog.getTime()) / 1000;
  }

  private inferDropOffReasons(dropOffRate: number): string[] {
    const reasons: string[] = [];

    if (dropOffRate >= 50) {
      reasons.push('CRITICAL_UX_ISSUE', 'CONTENT_TOO_DIFFICULT');
    } else if (dropOffRate >= 30) {
      reasons.push('LOW_ENGAGEMENT', 'MISSING_INCENTIVE');
    }

    return reasons;
  }

  private isJourneyCompleted(stages: string[]): boolean {
    const completionEvents = [
      'LESSON_COMPLETED',
      'QUIZ_PASSED',
      'COURSE_COMPLETED',
      'ACHIEVEMENT_UNLOCKED',
    ];

    return stages.some((stage) => completionEvents.includes(stage));
  }
}
