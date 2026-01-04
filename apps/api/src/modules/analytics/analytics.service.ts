import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSystemHealthCheck() {
    this.logger.log('Running system health hub check...');

    const [dbStatus, userCount] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.catch(() => 'DOWN'),
      this.prisma.user.count(),
    ]);

    // Track abnormal error rates in the last hour
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);

    const errorLogs = await this.prisma.behaviorLog.count({
      where: {
        eventType: 'SYSTEM_ERROR',
        timestamp: { gte: lastHour },
      },
    });

    if (errorLogs > 50) {
      this.logger.warn(
        `CRITICAL: High error rate detected! ${errorLogs} errors in the last hour.`,
      );
      // Nudge admin or trigger notification logic here
    }

    await this.prisma.behaviorLog.create({
      data: {
        sessionId: 'health-hub',
        path: 'system/health',
        eventType: 'HEALTH_CHECK',
        payload: {
          dbStatus: dbStatus === 'DOWN' ? 'DOWN' : 'OK',
          userCount,
          errorRateLastHour: errorLogs,
          timestamp: new Date(),
        },
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleLogAggregation() {
    this.logger.log('Starting BehaviorLog aggregation and archiving...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // 1. Fetch logs from yesterday
      const logs = await this.prisma.behaviorLog.findMany({
        where: {
          timestamp: {
            gte: yesterday,
            lt: today,
          },
        },
      });

      if (logs.length === 0) {
        this.logger.log('No logs to aggregate for yesterday.');
        return;
      }

      // 2. Aggregate by User & EventType
      const aggregationMap = new Map<string, any>();

      for (const log of logs) {
        const key = `${log.userId || 'anonymous'}-${log.eventType}`;
        if (!aggregationMap.has(key)) {
          aggregationMap.set(key, {
            userId: log.userId,
            eventType: log.eventType,
            count: 0,
            date: yesterday,
          });
        }
        aggregationMap.get(key).count++;
      }

      // 3. Store in SystemSettings or a dedicated Summary table (if exists)
      // For now, let's log the stats and consider moving to a new table in Phase 8
      this.logger.log(
        `Aggregated ${logs.length} logs into ${aggregationMap.size} unique summaries.`,
      );

      // 4. Archive logic: Delete logs older than 30 days
      const archiveThreshold = new Date();
      archiveThreshold.setDate(archiveThreshold.getDate() - 30);

      const deleted = await this.prisma.behaviorLog.deleteMany({
        where: {
          timestamp: {
            lt: archiveThreshold,
          },
        },
      });

      this.logger.log(`Archived ${deleted.count} old behavior logs.`);
    } catch (error) {
      this.logger.error('Log aggregation failed', error.stack);
    }
  }

  async getUserLearningHabits(userId: string) {
    const logs = await this.prisma.behaviorLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    if (logs.length === 0) return null;

    // Phân tích giờ học tập phổ biến
    const hours = logs.map((log) => new Date(log.timestamp).getHours());
    const hourCounts = hours.reduce((acc: any, hr) => {
      acc[hr] = (acc[hr] || 0) + 1;
      return acc;
    }, {});

    const peakHour = Object.keys(hourCounts).reduce((a, b) =>
      hourCounts[a] > hourCounts[b] ? a : b,
    );

    // Phân tích loại sự kiện phổ biến nhất
    const eventTypes = logs.map((log) => log.eventType);
    const eventCounts = eventTypes.reduce((acc: any, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      peakLearningHour: Number.parseInt(peakHour),
      topActivities: Object.entries(eventCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 3)
        .map(([type]) => type),
      totalLogsAnalyzed: logs.length,
    };
  }

  async getGlobalSystemStats() {
    const [userCount, lessonCompletions, totalPoints] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.userProgress.count({ where: { status: 'COMPLETED' } }),
      this.prisma.user.aggregate({ _sum: { points: true } }),
    ]);

    return {
      totalUsers: userCount,
      completedLessons: lessonCompletions,
      distributedPoints: totalPoints._sum.points || 0,
    };
  }

  async getUserPersona(
    userId: string,
  ): Promise<'SAVER' | 'HUNTER' | 'OBSERVER'> {
    const logs = await this.prisma.behaviorLog.findMany({
      where: { userId },
      take: 50,
    });

    const eventTypes = logs.map((l) => l.eventType);

    // Logic phân loại đơn giản dựa trên hành vi
    const riskTakingEvents = eventTypes.filter(
      (t) => t === 'TRADE_BUY' || t === 'HIGH_RISK_DECISION',
    ).length;
    const savingEvents = eventTypes.filter(
      (t) => t === 'COMMITMENT_CREATED' || t === 'POINTS_DEDUCTED',
    ).length;

    if (riskTakingEvents > savingEvents && riskTakingEvents > 5)
      return 'HUNTER';
    if (savingEvents > riskTakingEvents && savingEvents > 5) return 'SAVER';
    return 'OBSERVER';
  }
}
