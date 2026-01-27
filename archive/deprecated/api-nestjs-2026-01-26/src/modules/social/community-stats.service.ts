import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SocialGateway } from './social.gateway';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CommunityStatsService {
  constructor(
    private prisma: PrismaService,
    private socialGateway: SocialGateway,
  ) {}

  async getCommunityImpact() {
    const [totalUsers, totalPoints, totalPosts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.aggregate({ _sum: { points: true } }),
      this.prisma.socialPost.count(),
    ]);

    return {
      totalUsers,
      totalImpactPoints: totalPoints._sum.points || 0,
      totalContributions: totalPosts,
      timestamp: new Date(),
    };
  }

  async getUsersOnline() {
    // In a real app, this might come from Redis or the Gateway's connected clients
    // For now, we'll estimate based on recent behavior logs
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeSessions = await this.prisma.behaviorLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: tenMinutesAgo },
      },
    });

    return {
      count: activeSessions.length,
      timestamp: new Date(),
    };
  }

  async getRecentGlobalAchievements(limit = 5) {
    return this.prisma.socialPost.findMany({
      where: {
        type: 'ACHIEVEMENT',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async triggerRealtimeUpdate() {
    const stats = await this.getCommunityImpact();
    const online = await this.getUsersOnline();

    const update = {
      ...stats,
      onlineUsers: online.count,
    };

    this.socialGateway.server.emit('community_stats_update', update);
    return update;
  }
}
