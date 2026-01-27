import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NudgeService {
  private readonly logger = new Logger(NudgeService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleStreakNudges() {
    this.logger.log('Checking for users who need a streak nudge...');

    const now = new Date();
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const usersToNudge = await this.prisma.userStreak.findMany({
      where: {
        lastActivityDate: {
          lt: twentyHoursAgo,
          gt: twentyFourHoursAgo,
        },
        currentStreak: {
          gt: 0,
        },
        streakFrozen: false,
      },
      include: {
        user: true,
      },
    });

    let nudgesSent = 0;
    for (const streak of usersToNudge) {
      const canSend = await this.canSendNudge(streak);
      if (canSend) {
        await this.sendNudge(streak);
        nudgesSent++;
      }
    }

    this.logger.log(`Sent nudges to ${nudgesSent} users.`);
  }

  private async canSendNudge(streak: any): Promise<boolean> {
    const userId = streak.userId;
    const user = streak.user;

    if (user?.nudgePreferences?.streakNudges === false) {
      this.logger.log(`User ${userId} has opted out of streak nudges`);
      return false;
    }

    if (this.isQuietHours(user?.nudgePreferences)) {
      this.logger.log(`User ${userId} is in quiet hours`);
      return false;
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentNudges = await this.prisma.behaviorLog.findMany({
      where: {
        userId,
        eventType: 'STREAK_NUDGE_SENT',
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (recentNudges.length >= 3) {
      this.logger.log(`User ${userId} has reached max nudges (3) for today`);
      return false;
    }

    if (recentNudges.length > 0) {
      this.logger.log(`User ${userId} received a nudge within last 24 hours`);
      return false;
    }

    return true;
  }

  private isQuietHours(preferences: any): boolean {
    if (!preferences?.quietHoursStart && !preferences?.quietHoursEnd) {
      return false;
    }

    const currentHour = new Date().getHours();
    const start = preferences.quietHoursStart ?? 22;
    const end = preferences.quietHoursEnd ?? 8;

    if (start > end) {
      return currentHour >= start || currentHour < end;
    }
    return currentHour >= start && currentHour < end;
  }

  private async sendNudge(streak: any) {
    const userId = streak.userId;
    const currentStreak = streak.currentStreak;

    this.logger.log(
      `Nudging user ${userId} to maintain their ${currentStreak}-day streak!`,
    );

    await this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: 'nudge-system',
        path: '/nudge/streak-warning',
        eventType: 'STREAK_NUDGE_SENT',
        payload: {
          currentStreak,
          lastActivity: streak.lastActivityDate,
          message: `Your ${currentStreak}-day streak is about to expire! Do a lesson now to keep it alive.`,
        },
      },
    });
  }
}
