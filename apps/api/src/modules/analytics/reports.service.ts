import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { I18nService } from '../../common/i18n.service';

export interface ReportOptions {
  userId?: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate?: Date;
  endDate?: Date;
  locale?: 'vi' | 'en' | 'zh';
}

export interface ReportData {
  period: string;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    completedLessons: number;
    averageProgress: number;
    totalPoints: number;
  };
  activities: Array<{
    eventType: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: string;
    points: number;
    completedLessons: number;
  }>;
}

export interface ExportFormat {
  type: 'csv' | 'pdf';
  data: ReportData;
  locale: 'vi' | 'en' | 'zh';
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private prisma: PrismaService,
    private i18n: I18nService,
  ) {}

  async generateReport(options: ReportOptions): Promise<ReportData> {
    const { period, startDate, endDate, userId, locale = 'vi' } = options;

    const { start, end } = this.calculateDateRange(period, startDate, endDate);

    this.logger.log(`Generating ${period} report from ${start} to ${end}`);

    const [metrics, activities, topUsers] = await Promise.all([
      this.getMetrics(start, end, userId),
      this.getActivities(start, end, userId),
      userId ? Promise.resolve([]) : this.getTopUsers(start, end),
    ]);

    return {
      period: this.i18n.t(`reports.period.${period}`, locale),
      metrics,
      activities,
      topUsers,
    };
  }

  async exportToCSV(
    data: ReportData,
    locale: 'vi' | 'en' | 'zh' = 'vi',
  ): Promise<string> {
    const headers = [
      this.i18n.t('reports.headers.metric', locale),
      this.i18n.t('reports.headers.value', locale),
    ].join(',');

    const rows = [
      headers,
      `${this.i18n.t('reports.metrics.totalUsers', locale)},${data.metrics.totalUsers}`,
      `${this.i18n.t('reports.metrics.activeUsers', locale)},${data.metrics.activeUsers}`,
      `${this.i18n.t('reports.metrics.completedLessons', locale)},${data.metrics.completedLessons}`,
      `${this.i18n.t('reports.metrics.averageProgress', locale)},${data.metrics.averageProgress.toFixed(2)}%`,
      `${this.i18n.t('reports.metrics.totalPoints', locale)},${data.metrics.totalPoints}`,
      '',
      this.i18n.t('reports.sections.activities', locale),
      `${this.i18n.t('reports.headers.eventType', locale)},${this.i18n.t('reports.headers.count', locale)}`,
      ...data.activities.map((a) => `${a.eventType},${a.count}`),
    ];

    if (data.topUsers.length > 0) {
      rows.push(
        '',
        this.i18n.t('reports.sections.topUsers', locale),
        `${this.i18n.t('reports.headers.userId', locale)},${this.i18n.t('reports.headers.points', locale)},${this.i18n.t('reports.headers.lessons', locale)}`,
        ...data.topUsers.map(
          (u) => `${u.userId},${u.points},${u.completedLessons}`,
        ),
      );
    }

    return rows.join('\n');
  }

  async exportToPDF(
    data: ReportData,
    locale: 'vi' | 'en' | 'zh' = 'vi',
  ): Promise<string> {
    // Simplified PDF generation - returns markdown-like format
    // In production, use libraries like pdfkit or puppeteer
    const lines = [
      `# ${this.i18n.t('reports.title', locale)} - ${data.period}`,
      '',
      `## ${this.i18n.t('reports.sections.metrics', locale)}`,
      `- ${this.i18n.t('reports.metrics.totalUsers', locale)}: ${data.metrics.totalUsers}`,
      `- ${this.i18n.t('reports.metrics.activeUsers', locale)}: ${data.metrics.activeUsers}`,
      `- ${this.i18n.t('reports.metrics.completedLessons', locale)}: ${data.metrics.completedLessons}`,
      `- ${this.i18n.t('reports.metrics.averageProgress', locale)}: ${data.metrics.averageProgress.toFixed(2)}%`,
      `- ${this.i18n.t('reports.metrics.totalPoints', locale)}: ${data.metrics.totalPoints}`,
      '',
      `## ${this.i18n.t('reports.sections.activities', locale)}`,
      ...data.activities.map((a) => `- ${a.eventType}: ${a.count}`),
    ];

    if (data.topUsers.length > 0) {
      lines.push(
        '',
        `## ${this.i18n.t('reports.sections.topUsers', locale)}`,
        ...data.topUsers.map(
          (u, i) =>
            `${i + 1}. User ${u.userId}: ${u.points} ${this.i18n.t('reports.units.points', locale)} - ${u.completedLessons} ${this.i18n.t('reports.units.lessons', locale)}`,
        ),
      );
    }

    return lines.join('\n');
  }

  prepareVisualizationData(data: ReportData) {
    return {
      charts: {
        metricsOverview: {
          type: 'bar',
          data: [
            { label: 'Total Users', value: data.metrics.totalUsers },
            { label: 'Active Users', value: data.metrics.activeUsers },
            {
              label: 'Completed Lessons',
              value: data.metrics.completedLessons,
            },
          ],
        },
        activityDistribution: {
          type: 'pie',
          data: data.activities.map((a) => ({
            label: a.eventType,
            value: a.count,
          })),
        },
        topUsersChart: {
          type: 'horizontal-bar',
          data: data.topUsers.map((u) => ({
            label: u.userId,
            value: u.points,
          })),
        },
        progressGauge: {
          type: 'gauge',
          value: data.metrics.averageProgress,
          max: 100,
        },
      },
    };
  }

  private calculateDateRange(
    period: 'daily' | 'weekly' | 'monthly',
    startDate?: Date,
    endDate?: Date,
  ) {
    const end = endDate || new Date();
    let start: Date;

    if (startDate) {
      start = startDate;
    } else {
      start = new Date(end);
      switch (period) {
        case 'daily':
          start.setDate(start.getDate() - 1);
          break;
        case 'weekly':
          start.setDate(start.getDate() - 7);
          break;
        case 'monthly':
          start.setMonth(start.getMonth() - 1);
          break;
      }
    }

    return { start, end };
  }

  private async getMetrics(start: Date, end: Date, userId?: string) {
    const whereClause = userId ? { id: userId } : {};
    const logWhereClause = {
      timestamp: { gte: start, lte: end },
      ...(userId ? { userId } : {}),
    };

    const [
      totalUsers,
      activeUsers,
      completedLessons,
      avgProgress,
      totalPoints,
    ] = await Promise.all([
      this.prisma.user.count({ where: whereClause }),
      this.prisma.behaviorLog
        .findMany({
          where: logWhereClause,
          select: { userId: true },
          distinct: ['userId'],
        })
        .then((users) => users.length),
      this.prisma.userProgress.count({
        where: {
          status: 'COMPLETED',
          ...(userId ? { userId } : {}),
        },
      }),
      this.prisma.userProgress
        .aggregate({
          _avg: { progressPercentage: true },
          where: userId ? { userId } : {},
        })
        .then((r) => r._avg.progressPercentage || 0),
      this.prisma.user
        .aggregate({
          _sum: { points: true },
          where: whereClause,
        })
        .then((r) => r._sum.points || 0),
    ]);

    return {
      totalUsers,
      activeUsers,
      completedLessons,
      averageProgress: avgProgress,
      totalPoints,
    };
  }

  private async getActivities(start: Date, end: Date, userId?: string) {
    const logs = await this.prisma.behaviorLog.findMany({
      where: {
        timestamp: { gte: start, lte: end },
        ...(userId ? { userId } : {}),
      },
      select: { eventType: true },
    });

    const counts = logs.reduce(
      (acc, log) => {
        acc[log.eventType] = (acc[log.eventType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(counts)
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async getTopUsers(start: Date, end: Date) {
    const users = await this.prisma.user.findMany({
      take: 10,
      orderBy: { points: 'desc' },
      select: {
        id: true,
        points: true,
        progress: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
      },
    });

    return users.map((u) => ({
      userId: u.id,
      points: u.points,
      completedLessons: u.progress.length,
    }));
  }
}
