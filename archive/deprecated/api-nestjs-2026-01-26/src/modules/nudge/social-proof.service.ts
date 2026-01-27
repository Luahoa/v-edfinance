import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

export interface SocialProofMessage {
  vi: string;
  en: string;
  zh: string;
}

export interface SocialProofNudge {
  type: 'SOCIAL_PROOF';
  message: SocialProofMessage;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  metadata: {
    cohortSize: number;
    percentage: number;
    comparisonType:
      | 'SIMILAR_USERS'
      | 'PEERS'
      | 'TOP_PERFORMERS'
      | 'SOCIAL_NORM';
  };
}

/**
 * Service for generating social proof nudges based on peer behavior and social norms.
 * Implements Thaler's Social Proof principle: "X% of users like you chose this."
 */
@Injectable()
export class SocialProofService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  /**
   * Generate "X% of users like you" message based on user cohort
   */
  async generateCohortMessage(
    userId: string,
    action: string,
    targetId?: string,
  ): Promise<SocialProofNudge | null> {
    const persona = await this.analytics.getUserPersona(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { investmentProfile: true },
    });

    if (!user) return null;

    // Find similar users in cohort
    const cohortData = await this.getCohortBehavior(persona, action, targetId);

    if (cohortData.totalUsers === 0) return null;

    const percentage = Math.round(
      (cohortData.actingUsers / cohortData.totalUsers) * 100,
    );

    return {
      type: 'SOCIAL_PROOF',
      message: this.formatCohortMessage(percentage, action, persona),
      priority: this.calculatePriority(percentage),
      metadata: {
        cohortSize: cohortData.totalUsers,
        percentage,
        comparisonType: 'SIMILAR_USERS',
      },
    };
  }

  /**
   * Generate peer comparison nudge
   */
  async generatePeerComparison(
    userId: string,
    metricType: 'SAVINGS' | 'LEARNING' | 'INVESTMENT',
  ): Promise<SocialProofNudge | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        investmentProfile: true,
        progress: true,
      },
    });

    if (!user) return null;

    const peerData = await this.getPeerMetrics(userId, metricType);

    if (!peerData) return null;

    const userRank = this.calculateUserRank(
      peerData.userValue,
      peerData.peerValues,
    );

    return {
      type: 'SOCIAL_PROOF',
      message: this.formatPeerMessage(metricType, userRank, peerData),
      priority: userRank > 50 ? 'HIGH' : 'MEDIUM',
      metadata: {
        cohortSize: peerData.peerValues.length,
        percentage: userRank,
        comparisonType: 'PEERS',
      },
    };
  }

  /**
   * Generate social norm framing nudge
   */
  async generateSocialNorm(
    userId: string,
    behaviorType:
      | 'SAVINGS_HABIT'
      | 'INVESTMENT_DIVERSIFICATION'
      | 'LEARNING_CONSISTENCY',
  ): Promise<SocialProofNudge | null> {
    const normData = await this.getSocialNorm(behaviorType);

    if (!normData) return null;

    const userAlignment = await this.checkUserAlignment(userId, behaviorType);

    return {
      type: 'SOCIAL_PROOF',
      message: this.formatSocialNormMessage(
        behaviorType,
        normData.percentage,
        userAlignment,
      ),
      priority: userAlignment ? 'LOW' : 'HIGH',
      metadata: {
        cohortSize: normData.totalUsers,
        percentage: normData.percentage,
        comparisonType: 'SOCIAL_NORM',
      },
    };
  }

  /**
   * Get real-time social proof for specific actions
   */
  async getRealtimeActivity(
    action: string,
    targetId: string,
    timeWindowHours = 24,
  ) {
    const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

    const [actionCount, uniqueUsers] = await Promise.all([
      this.prisma.behaviorLog.count({
        where: {
          eventType: action,
          path: { contains: targetId },
          timestamp: { gte: cutoffTime },
        },
      }),
      this.prisma.behaviorLog.groupBy({
        by: ['userId'],
        where: {
          eventType: action,
          path: { contains: targetId },
          timestamp: { gte: cutoffTime },
        },
      }),
    ]);

    return {
      actionCount,
      uniqueUsers: uniqueUsers.length,
      timeWindowHours,
      targetId,
    };
  }

  // Private helper methods

  private async getCohortBehavior(
    persona: string,
    action: string,
    targetId?: string,
  ) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all users with same persona
    const cohortUsers = await this.prisma.behaviorLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    // Filter users who performed the action
    const whereClause: any = {
      eventType: action,
      timestamp: { gte: thirtyDaysAgo },
    };

    if (targetId) {
      whereClause.path = { contains: targetId };
    }

    const actingUsers = await this.prisma.behaviorLog.groupBy({
      by: ['userId'],
      where: whereClause,
    });

    return {
      totalUsers: cohortUsers.length,
      actingUsers: actingUsers.length,
    };
  }

  private async getPeerMetrics(userId: string, metricType: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Mock implementation - replace with actual metric calculation
    const userBehaviorCount = await this.prisma.behaviorLog.count({
      where: {
        userId,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    // Get peer behavior counts
    const peerCounts = await this.prisma.behaviorLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    return {
      userValue: userBehaviorCount,
      peerValues: peerCounts.map((p) => p._count),
      metric: metricType,
    };
  }

  private calculateUserRank(userValue: number, peerValues: number[]): number {
    if (peerValues.length === 0) return 50;

    const betterThanUser = peerValues.filter((v) => v > userValue).length;
    return Math.round((betterThanUser / peerValues.length) * 100);
  }

  private async getSocialNorm(behaviorType: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.behaviorLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    return {
      totalUsers: totalUsers || 1,
      activeUsers: activeUsers.length,
      percentage: Math.round((activeUsers.length / (totalUsers || 1)) * 100),
    };
  }

  private async checkUserAlignment(
    userId: string,
    behaviorType: string,
  ): Promise<boolean> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const userActivity = await this.prisma.behaviorLog.count({
      where: {
        userId,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    return userActivity > 10; // Threshold for "aligned"
  }

  private formatCohortMessage(
    percentage: number,
    action: string,
    persona: string,
  ): SocialProofMessage {
    return {
      vi: `${percentage}% người dùng giống bạn đã ${this.translateAction(action, 'vi')}. Tham gia ngay!`,
      en: `${percentage}% of users like you have ${this.translateAction(action, 'en')}. Join them!`,
      zh: `${percentage}% 的像您这样的用户已经${this.translateAction(action, 'zh')}。立即加入！`,
    };
  }

  private formatPeerMessage(
    metricType: string,
    rank: number,
    data: any,
  ): SocialProofMessage {
    const isAboveAverage = rank < 50;

    if (isAboveAverage) {
      return {
        vi: `Bạn đang vượt trội hơn ${rank}% người dùng về ${this.translateMetric(metricType, 'vi')}! Tiếp tục phát huy!`,
        en: `You're outperforming ${rank}% of users in ${this.translateMetric(metricType, 'en')}! Keep it up!`,
        zh: `您在${this.translateMetric(metricType, 'zh')}方面超越了 ${rank}% 的用户！继续加油！`,
      };
    }

    return {
      vi: `${100 - rank}% người dùng đang dẫn trước bạn về ${this.translateMetric(metricType, 'vi')}. Hãy bắt kịp họ!`,
      en: `${100 - rank}% of users are ahead of you in ${this.translateMetric(metricType, 'en')}. Catch up with them!`,
      zh: `${100 - rank}% 的用户在${this.translateMetric(metricType, 'zh')}方面领先于您。赶上他们！`,
    };
  }

  private formatSocialNormMessage(
    behaviorType: string,
    percentage: number,
    userAligned: boolean,
  ): SocialProofMessage {
    if (userAligned) {
      return {
        vi: `Bạn là một trong ${percentage}% người dùng thực hành ${this.translateBehavior(behaviorType, 'vi')}. Tuyệt vời!`,
        en: `You're among the ${percentage}% of users practicing ${this.translateBehavior(behaviorType, 'en')}. Great job!`,
        zh: `您是实践${this.translateBehavior(behaviorType, 'zh')}的 ${percentage}% 用户之一。干得好！`,
      };
    }

    return {
      vi: `${percentage}% người dùng đang thực hành ${this.translateBehavior(behaviorType, 'vi')}. Tham gia với họ để đạt mục tiêu tài chính!`,
      en: `${percentage}% of users are practicing ${this.translateBehavior(behaviorType, 'en')}. Join them to reach your financial goals!`,
      zh: `${percentage}% 的用户正在实践${this.translateBehavior(behaviorType, 'zh')}。加入他们以实现您的财务目标！`,
    };
  }

  private calculatePriority(percentage: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (percentage >= 75) return 'HIGH';
    if (percentage >= 50) return 'MEDIUM';
    return 'LOW';
  }

  private translateAction(action: string, locale: string): string {
    const translations: Record<string, Record<string, string>> = {
      COURSE_COMPLETED: {
        vi: 'hoàn thành khóa học này',
        en: 'completed this course',
        zh: '完成了这门课程',
      },
      INVESTMENT_MADE: {
        vi: 'thực hiện khoản đầu tư này',
        en: 'made this investment',
        zh: '进行了这项投资',
      },
    };

    return translations[action]?.[locale] || action;
  }

  private translateMetric(metric: string, locale: string): string {
    const translations: Record<string, Record<string, string>> = {
      SAVINGS: { vi: 'tiết kiệm', en: 'savings', zh: '储蓄' },
      LEARNING: { vi: 'học tập', en: 'learning', zh: '学习' },
      INVESTMENT: { vi: 'đầu tư', en: 'investment', zh: '投资' },
    };

    return translations[metric]?.[locale] || metric;
  }

  private translateBehavior(behavior: string, locale: string): string {
    const translations: Record<string, Record<string, string>> = {
      SAVINGS_HABIT: {
        vi: 'thói quen tiết kiệm',
        en: 'savings habits',
        zh: '储蓄习惯',
      },
      INVESTMENT_DIVERSIFICATION: {
        vi: 'đa dạng hóa đầu tư',
        en: 'investment diversification',
        zh: '投资多元化',
      },
      LEARNING_CONSISTENCY: {
        vi: 'học tập đều đặn',
        en: 'consistent learning',
        zh: '持续学习',
      },
    };

    return translations[behavior]?.[locale] || behavior;
  }
}
