import { Injectable, Logger } from '@nestjs/common';
import { GamificationService } from '../common/gamification.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StreakService {
  private readonly logger = new Logger(StreakService.name);

  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async updateStreak(userId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const streak = await this.prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      // Initialize streak
      return this.prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
        },
      });
    }

    const lastActivity = new Date(streak.lastActivityDate);
    const lastActivityDateOnly = new Date(
      lastActivity.getFullYear(),
      lastActivity.getMonth(),
      lastActivity.getDate(),
    );

    const diffInDays = Math.floor(
      (today.getTime() - lastActivityDateOnly.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) {
      // Already active today, do nothing
      return streak;
    }

    if (diffInDays === 1) {
      // Incremented streak
      const newCurrentStreak = streak.currentStreak + 1;
      const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);

      const updated = await this.prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastActivityDate: today,
          streakFrozen: false, // Activity unfreezes
        },
      });

      // Reward points for streak
      if (newCurrentStreak % 7 === 0) {
        await this.gamification.logEvent(userId, 'STREAK_MILESTONE', 100, {
          days: newCurrentStreak,
        });
      }

      return updated;
    }

    // Broken streak - check for freeze
    if (streak.freezesRemaining > 0) {
      return this.prisma.userStreak.update({
        where: { userId },
        data: {
          freezesRemaining: streak.freezesRemaining - 1,
          streakFrozen: true,
          lastActivityDate: today, // Update last activity so they don't lose it immediately tomorrow
        },
      });
    }

    // Reset streak
    return this.prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        lastActivityDate: today,
      },
    });
  }

  async getStreak(userId: string) {
    return this.prisma.userStreak.findUnique({
      where: { userId },
    });
  }
}
