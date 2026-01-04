import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getTopUsers(limit = 10) {
    const users = await this.prisma.user.findMany({
      take: limit,
      orderBy: {
        points: 'desc',
      },
      select: {
        id: true,
        email: true,
        points: true,
        metadata: true,
        streaks: {
          select: {
            currentStreak: true,
            longestStreak: true,
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      displayName:
        (user.metadata as any)?.displayName || user.email.split('@')[0],
      avatar: (user.metadata as any)?.avatar || null,
      points: user.points,
      currentStreak: user.streaks?.currentStreak || 0,
      longestStreak: user.streaks?.longestStreak || 0,
    }));
  }

  async getGlobalRanking(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) throw new Error('User not found');

    const [rank, totalUsers] = await Promise.all([
      this.prisma.user.count({
        where: { points: { gt: user.points } },
      }),
      this.prisma.user.count(),
    ]);

    const percentile = totalUsers > 0 ? (1 - rank / totalUsers) * 100 : 0;

    return {
      rank: rank + 1,
      totalUsers,
      percentile: Number(percentile.toFixed(2)),
      points: user.points,
    };
  }

  async getPeriodicLeaderboard(
    period: 'daily' | 'weekly' | 'monthly',
    limit = 10,
  ) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const logs = await this.prisma.behaviorLog.groupBy({
      by: ['userId'],
      where: {
        eventType: 'POINTS_EARNED',
        timestamp: { gte: startDate },
      },
      _sum: {
        duration: true, // Assuming points earned are stored in duration field for simplicity in this schema or adjust accordingly
      },
      orderBy: {
        _sum: {
          duration: 'desc',
        },
      },
      take: limit,
    });

    const userIds = logs
      .map((l) => l.userId)
      .filter((id): id is string => !!id);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        metadata: true,
      },
    });

    return logs.map((log) => {
      const user = users.find((u) => u.id === log.userId);
      return {
        userId: log.userId,
        points: log._sum.duration || 0,
        displayName:
          (user?.metadata as any)?.displayName ||
          user?.email.split('@')[0] ||
          'Unknown',
      };
    });
  }
  async getStreakLeaderboard(limit = 10) {
    const streaks = await this.prisma.userStreak.findMany({
      take: limit,
      orderBy: {
        currentStreak: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            metadata: true,
          },
        },
      },
    });

    return streaks.map((streak) => ({
      userId: streak.userId,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      displayName:
        (streak.user.metadata as any)?.displayName ||
        streak.user.email.split('@')[0],
      avatar: (streak.user.metadata as any)?.avatar || null,
    }));
  }
}
