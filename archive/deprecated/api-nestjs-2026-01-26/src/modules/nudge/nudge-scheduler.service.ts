import { Injectable, Inject, Optional } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NudgeEngineService } from './nudge-engine.service';

interface UserWithPreferences {
  id: string;
  timezone?: string;
  preferences?: {
    preferredNudgeTime?: string;
    weekendDelay?: boolean;
    maxNudgesPerDay?: number;
    nudgesEnabled?: boolean;
  };
}

interface NudgeData {
  userId?: string;
  type: string;
  message: { vi: string; en: string; zh: string };
  priority?: string;
}

interface TimezoneBatch {
  timezone: string;
  users: UserWithPreferences[];
}

interface NudgeHistoryRecord {
  id: string;
  userId: string;
  nudgeType: string;
  sentAt: Date;
  opened?: boolean;
  clickedAt?: Date;
  metadata?: Record<string, unknown>;
}

interface CronJobLike {
  start: () => void;
  stop: () => void;
  cronTime?: string;
}

@Injectable()
export class NudgeSchedulerService {
  private sendLock = new Map<string, boolean>();
  private nudgeHistory = new Map<string, NudgeHistoryRecord[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly nudgeEngine: NudgeEngineService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @Optional()
    @Inject('NotificationService')
    private readonly notificationService?: {
      sendPushNotification: (data: unknown) => Promise<void>;
      sendEmail: (data: unknown) => Promise<void>;
    },
  ) {}

  private createCronJob(
    cronExpression: string,
    callback: () => void,
  ): CronJobLike {
    let intervalId: NodeJS.Timeout | null = null;

    return {
      cronTime: cronExpression,
      start: () => {
        // Simplified: run every hour as a stub
        intervalId = setInterval(callback, 60 * 60 * 1000);
      },
      stop: () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      },
    };
  }

  async scheduleDailyNudges(): Promise<void> {
    const jobName = 'daily-nudges';
    this.removeExistingJob(jobName);

    const job = this.createCronJob('0 9 * * *', () => {
      this.processDailyNudges();
    });

    this.schedulerRegistry.addCronJob(
      jobName,
      job as unknown as Parameters<typeof this.schedulerRegistry.addCronJob>[1],
    );
    job.start();
  }

  async scheduleStreakChecks(): Promise<void> {
    const jobName = 'streak-checks';
    this.removeExistingJob(jobName);

    const job = this.createCronJob('0 * * * *', () => {
      this.processStreakChecks();
    });

    this.schedulerRegistry.addCronJob(
      jobName,
      job as unknown as Parameters<typeof this.schedulerRegistry.addCronJob>[1],
    );
    job.start();
  }

  async scheduleEveningReminders(): Promise<void> {
    const jobName = 'evening-reminders';
    this.removeExistingJob(jobName);

    const job = this.createCronJob('0 19 * * *', () => {
      this.processEveningReminders();
    });

    this.schedulerRegistry.addCronJob(
      jobName,
      job as unknown as Parameters<typeof this.schedulerRegistry.addCronJob>[1],
    );
    job.start();
  }

  private removeExistingJob(jobName: string): void {
    try {
      const existingJob = this.schedulerRegistry.getCronJob(jobName);
      if (existingJob) {
        existingJob.stop();
        this.schedulerRegistry.deleteCronJob(jobName);
      }
    } catch {
      // Job doesn't exist, continue
    }
  }

  private async processDailyNudges(): Promise<void> {
    // Stub implementation
  }

  private async processStreakChecks(): Promise<void> {
    // Stub implementation
  }

  private async processEveningReminders(): Promise<void> {
    // Stub implementation
  }

  calculateOptimalTime(user: UserWithPreferences, referenceDate?: Date): Date {
    const date = referenceDate ? new Date(referenceDate) : new Date();
    const preferences = user.preferences || {};

    let hour = 9; // Default 9 AM

    if (preferences.preferredNudgeTime) {
      const [h] = preferences.preferredNudgeTime.split(':').map(Number);
      hour = h;
    }

    // Weekend delay
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend && preferences.weekendDelay) {
      hour += 2; // Delay by 2 hours on weekends
    }

    // Avoid sleep hours
    if (hour >= 23 || hour < 7) {
      hour = 9;
    }

    date.setHours(hour, 0, 0, 0);
    return date;
  }

  async calculateOptimalHourFromHistory(userId: string): Promise<number> {
    const logs = await this.prisma.behaviorLog.findMany({
      where: {
        userId,
        eventType: 'NUDGE_CLICKED',
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    if (logs.length === 0) {
      return 9; // Default to 9 AM
    }

    const hours = logs.map((log) => new Date(log.timestamp).getHours());
    const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
    return avgHour;
  }

  async checkFrequencyLimit(
    userId: string,
    period: 'daily' | 'weekly',
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    const preferences =
      (user as unknown as UserWithPreferences).preferences || {};
    if (preferences.nudgesEnabled === false) {
      return false;
    }

    const periodMs =
      period === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const limit = period === 'daily' ? (preferences.maxNudgesPerDay ?? 3) : 15;

    // Use in-memory history instead of database
    const userHistory = this.nudgeHistory.get(userId) || [];
    const cutoff = Date.now() - periodMs;
    const recentCount = userHistory.filter(
      (h) => h.sentAt.getTime() > cutoff,
    ).length;

    return recentCount < limit;
  }

  async calculateBackoffPeriod(userId: string): Promise<number> {
    const userHistory = this.nudgeHistory.get(userId) || [];
    const recentNudges = userHistory
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, 5);

    if (recentNudges.length === 0) {
      return 24;
    }

    // Check for recent engagement
    const hasRecentEngagement = recentNudges.some(
      (n: NudgeHistoryRecord) => n.opened === true,
    );

    if (hasRecentEngagement) {
      return 24; // Normal frequency
    }

    // Count consecutive ignores
    let consecutiveIgnores = 0;
    for (const nudge of recentNudges) {
      if (nudge.opened === false) {
        consecutiveIgnores++;
      } else {
        break;
      }
    }

    // Exponential backoff
    return Math.min(24 * Math.pow(2, consecutiveIgnores - 1), 168); // Max 1 week
  }

  async sendNudgeToUser(
    userId: string,
    nudgeType: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    // Prevent duplicate sends
    const lockKey = `${userId}-${nudgeType}`;
    if (this.sendLock.get(lockKey)) {
      return;
    }
    this.sendLock.set(lockKey, true);

    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const canSend = await this.checkFrequencyLimit(userId, 'daily');
      if (!canSend) {
        return;
      }

      const nudge = await this.nudgeEngine.generateNudge(
        userId,
        nudgeType,
        context,
      );
      if (!nudge) {
        return;
      }

      // Record in in-memory history
      const nudgeRecord: NudgeHistoryRecord = {
        id: `nudge-${Date.now()}`,
        userId,
        nudgeType,
        sentAt: new Date(),
        metadata: context,
      };

      const userHistory = this.nudgeHistory.get(userId) || [];
      userHistory.push(nudgeRecord);
      this.nudgeHistory.set(userId, userHistory);

      // Log behavior
      await this.prisma.behaviorLog.create({
        data: {
          userId,
          sessionId: `nudge-session-${Date.now()}`,
          eventType: 'NUDGE_SENT',
          path: '/nudge/scheduled',
          payload: { nudgeId: nudgeRecord.id, nudgeType },
          timestamp: new Date(),
        },
      });

      // Send notification with retry
      if (this.notificationService) {
        try {
          await this.notificationService.sendPushNotification({
            userId,
            title: nudgeType,
            body: nudge.message,
            data: { nudgeId: nudgeRecord.id },
          });
        } catch {
          // Retry once
          try {
            await this.notificationService.sendPushNotification({
              userId,
              title: nudgeType,
              body: nudge.message,
              data: { nudgeId: nudgeRecord.id },
            });
          } catch {
            // Fallback to email
            await this.notificationService.sendEmail({
              userId,
              subject: nudgeType,
              body: nudge.message,
            });
          }
        }
      }
    } finally {
      this.sendLock.delete(lockKey);
    }
  }

  async scheduleBatchNudges(
    nudgeType: string,
    targetHour: number,
    _batchSize = 100,
  ): Promise<void> {
    const users = await this.prisma.user.findMany();

    for (const user of users) {
      await this.sendNudgeToUser(user.id, nudgeType, {
        scheduledHour: targetHour,
      });
    }
  }

  convertToUserTimezone(utcDate: Date, timezone: string): Date {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      });
      const localHour = parseInt(formatter.format(utcDate), 10);
      const result = new Date(utcDate);
      result.setHours(localHour);
      return result;
    } catch {
      return utcDate; // Fallback to UTC
    }
  }

  getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const utcDate = new Date(
        now.toLocaleString('en-US', { timeZone: 'UTC' }),
      );
      const tzDate = new Date(
        now.toLocaleString('en-US', { timeZone: timezone }),
      );
      return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
    } catch {
      return 0; // UTC offset
    }
  }

  async groupUsersByTimezone(
    users: UserWithPreferences[],
  ): Promise<TimezoneBatch[]> {
    const groups = new Map<string, UserWithPreferences[]>();

    for (const user of users) {
      const tz = user.timezone || 'UTC';
      if (!groups.has(tz)) {
        groups.set(tz, []);
      }
      groups.get(tz)!.push(user);
    }

    return Array.from(groups.entries()).map(([timezone, tzUsers]) => ({
      timezone,
      users: tzUsers,
    }));
  }

  async sendNudgeWithRateLimit(
    userId: string,
    nudge: NudgeData,
  ): Promise<void> {
    // Simple rate limiting with delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    if (this.notificationService) {
      await this.notificationService.sendPushNotification({
        userId,
        title: nudge.type,
        body: nudge.message,
      });
    }
  }
}
