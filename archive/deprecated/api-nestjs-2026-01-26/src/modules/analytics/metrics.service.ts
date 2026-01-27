import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TimeSeriesDataPoint {
  date: Date;
  value: number;
}

export interface RetentionCohort {
  cohortDate: Date;
  totalUsers: number;
  retainedUsers: Record<number, number>; // day -> count
}

export interface EngagementMetrics {
  avgSessionDuration: number;
  avgSessionsPerUser: number;
  avgEventsPerSession: number;
  bounceRate: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate Daily Active Users (DAU) for a date range
   */
  async calculateDAU(
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesDataPoint[]> {
    const logs = await this.prisma.behaviorLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
        userId: { not: null },
      },
      select: {
        timestamp: true,
        userId: true,
      },
    });

    const dailyUsers = new Map<string, Set<string>>();

    for (const log of logs) {
      const dateKey = log.timestamp.toISOString().split('T')[0];
      if (!dailyUsers.has(dateKey)) {
        dailyUsers.set(dateKey, new Set());
      }
      if (log.userId) {
        dailyUsers.get(dateKey)!.add(log.userId);
      }
    }

    return Array.from(dailyUsers.entries())
      .map(([date, users]) => ({
        date: new Date(date),
        value: users.size,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Calculate Weekly Active Users (WAU)
   */
  async calculateWAU(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.prisma.behaviorLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return result.length;
  }

  /**
   * Calculate Monthly Active Users (MAU)
   */
  async calculateMAU(year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await this.prisma.behaviorLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return result.length;
  }

  /**
   * Calculate cohort-based retention rates
   */
  async calculateRetention(
    cohortStartDate: Date,
    days: number,
  ): Promise<RetentionCohort> {
    const cohortEndDate = new Date(cohortStartDate);
    cohortEndDate.setDate(cohortEndDate.getDate() + 1);

    // Get users who signed up in the cohort period
    const cohortUsers = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: cohortStartDate, lt: cohortEndDate },
      },
      select: { id: true, createdAt: true },
    });

    const totalUsers = cohortUsers.length;
    const retainedUsers: Record<number, number> = {};

    // Early return if no users in cohort
    if (totalUsers === 0) {
      return {
        cohortDate: cohortStartDate,
        totalUsers: 0,
        retainedUsers: {},
      };
    }

    // Calculate retention for each day
    for (let day = 1; day <= days; day++) {
      const checkDate = new Date(cohortStartDate);
      checkDate.setDate(checkDate.getDate() + day);

      const endCheckDate = new Date(checkDate);
      endCheckDate.setDate(endCheckDate.getDate() + 1);

      const activeUserIds = await this.prisma.behaviorLog.findMany({
        where: {
          userId: { in: cohortUsers.map((u) => u.id) },
          timestamp: { gte: checkDate, lt: endCheckDate },
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      retainedUsers[day] = activeUserIds.length;
    }

    return {
      cohortDate: cohortStartDate,
      totalUsers,
      retainedUsers,
    };
  }

  /**
   * Calculate engagement metrics
   */
  async calculateEngagement(
    startDate: Date,
    endDate: Date,
  ): Promise<EngagementMetrics> {
    const logs = await this.prisma.behaviorLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
      },
      select: {
        sessionId: true,
        userId: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    if (logs.length === 0) {
      return {
        avgSessionDuration: 0,
        avgSessionsPerUser: 0,
        avgEventsPerSession: 0,
        bounceRate: 0,
      };
    }

    // Group by session
    const sessions = new Map<
      string,
      { start: Date; end: Date; events: number; userId: string | null }
    >();

    for (const log of logs) {
      if (!sessions.has(log.sessionId)) {
        sessions.set(log.sessionId, {
          start: log.timestamp,
          end: log.timestamp,
          events: 0,
          userId: log.userId,
        });
      }
      const session = sessions.get(log.sessionId)!;
      session.end = log.timestamp;
      session.events++;
    }

    // Calculate metrics
    const sessionArray = Array.from(sessions.values());
    const totalSessions = sessionArray.length;

    const totalDuration = sessionArray.reduce((sum, s) => {
      return sum + (s.end.getTime() - s.start.getTime()) / 1000; // in seconds
    }, 0);

    const singleEventSessions = sessionArray.filter(
      (s) => s.events === 1,
    ).length;

    const userSessions = new Map<string, number>();
    for (const session of sessionArray) {
      if (session.userId) {
        userSessions.set(
          session.userId,
          (userSessions.get(session.userId) || 0) + 1,
        );
      }
    }

    const totalEvents = sessionArray.reduce((sum, s) => sum + s.events, 0);

    return {
      avgSessionDuration: totalDuration / totalSessions,
      avgSessionsPerUser:
        userSessions.size > 0 ? totalSessions / userSessions.size : 0,
      avgEventsPerSession: totalEvents / totalSessions,
      bounceRate: singleEventSessions / totalSessions,
    };
  }

  /**
   * Calculate percentile for a given metric
   */
  calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    if (percentile < 0 || percentile > 100) {
      throw new Error('Percentile must be between 0 and 100');
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Get user points distribution by percentiles
   */
  async getUserPointsPercentiles(
    percentiles: number[],
  ): Promise<Record<number, number>> {
    const users = await this.prisma.user.findMany({
      select: { points: true },
    });

    const points = users.map((u) => u.points);
    const result: Record<number, number> = {};

    for (const p of percentiles) {
      result[p] = this.calculatePercentile(points, p);
    }

    return result;
  }

  /**
   * Calculate time-series aggregation with custom interval
   */
  async aggregateTimeSeries(
    startDate: Date,
    endDate: Date,
    metric: 'events' | 'users' | 'sessions',
    interval: 'hour' | 'day' | 'week',
  ): Promise<TimeSeriesDataPoint[]> {
    const logs = await this.prisma.behaviorLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
      },
      select: {
        timestamp: true,
        userId: true,
        sessionId: true,
      },
    });

    const dataMap = new Map<string, Set<string> | number>();

    for (const log of logs) {
      const key = this.getIntervalKey(log.timestamp, interval);

      if (metric === 'events') {
        dataMap.set(key, ((dataMap.get(key) as number) || 0) + 1);
      } else if (metric === 'users' && log.userId) {
        if (!dataMap.has(key)) dataMap.set(key, new Set<string>());
        (dataMap.get(key) as Set<string>).add(log.userId);
      } else if (metric === 'sessions') {
        if (!dataMap.has(key)) dataMap.set(key, new Set<string>());
        (dataMap.get(key) as Set<string>).add(log.sessionId);
      }
    }

    return Array.from(dataMap.entries())
      .map(([dateStr, value]) => ({
        date: new Date(dateStr),
        value: typeof value === 'number' ? value : value.size,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Helper: Get interval key for time-series grouping
   */
  private getIntervalKey(
    date: Date,
    interval: 'hour' | 'day' | 'week',
  ): string {
    if (interval === 'hour') {
      return date.toISOString().substring(0, 13) + ':00:00.000Z';
    }
    if (interval === 'day') {
      return date.toISOString().split('T')[0];
    }
    // week: ISO week starting Monday
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }
}
