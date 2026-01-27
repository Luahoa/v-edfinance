import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

export interface LossAversionNudge {
  type: 'STREAK_LOSS' | 'ABOUT_TO_LOSE' | 'COMMITMENT_CONTRACT' | 'FRAMING';
  message: { vi: string; en: string; zh: string };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>;
}

@Injectable()
export class LossAversionService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  async generateStreakLossWarning(
    userId: string,
  ): Promise<LossAversionNudge | null> {
    const streak = await this.prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!streak || streak.currentStreak === 0) {
      return null;
    }

    const hoursSinceActivity = this.getHoursSince(streak.lastActivityDate);

    if (hoursSinceActivity >= 20 && hoursSinceActivity < 24) {
      const streakValue = streak.currentStreak;
      const isHighValue = streakValue >= 7;

      return {
        type: 'STREAK_LOSS',
        message: {
          vi: `⚠️ Chuỗi ${streakValue} ngày của bạn sẽ mất trong ${24 - hoursSinceActivity} giờ nữa! Đừng để công sức của bạn tan biến.`,
          en: `⚠️ Your ${streakValue}-day streak will be lost in ${24 - hoursSinceActivity} hours! Don't let your hard work vanish.`,
          zh: `⚠️ 您的 ${streakValue} 天连续记录将在 ${24 - hoursSinceActivity} 小时内丢失！不要让您的努力白费。`,
        },
        priority: isHighValue ? 'CRITICAL' : 'HIGH',
        metadata: {
          currentStreak: streakValue,
          hoursRemaining: 24 - hoursSinceActivity,
          lastActivity: streak.lastActivityDate,
        },
      };
    }

    return null;
  }

  async generateAboutToLoseNudge(
    userId: string,
    progressPercentage: number,
    goalName: string,
  ): Promise<LossAversionNudge | null> {
    if (progressPercentage < 70 || progressPercentage >= 100) {
      return null;
    }

    const remaining = 100 - progressPercentage;

    return {
      type: 'ABOUT_TO_LOSE',
      message: {
        vi: `🎯 Bạn đã đạt ${progressPercentage}% mục tiêu "${goalName}". Chỉ còn ${remaining}% nữa - đừng để công sức của bạn đổ sông đổ bể!`,
        en: `🎯 You've reached ${progressPercentage}% of "${goalName}". Only ${remaining}% left - don't let your effort go to waste!`,
        zh: `🎯 您已完成"${goalName}"的 ${progressPercentage}%。只剩 ${remaining}% - 不要让您的努力白费！`,
      },
      priority: progressPercentage >= 90 ? 'CRITICAL' : 'HIGH',
      metadata: {
        goalName,
        progressPercentage,
        remaining,
      },
    };
  }

  async generateCommitmentContract(
    userId: string,
    amount: number,
    duration: number,
  ): Promise<LossAversionNudge | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const formattedAmount = this.formatCurrency(amount);

    return {
      type: 'COMMITMENT_CONTRACT',
      message: {
        vi: `💰 Cam kết khóa ${formattedAmount} trong ${duration} ngày. Nếu rút sớm, bạn sẽ mất 10% phí. Bạn có chắc chắn muốn tiếp tục?`,
        en: `💰 Lock ${formattedAmount} for ${duration} days. Early withdrawal incurs a 10% penalty. Are you sure you want to continue?`,
        zh: `💰 锁定 ${formattedAmount} ${duration} 天。提前取款将产生 10% 的罚款。您确定要继续吗？`,
      },
      priority: 'HIGH',
      metadata: {
        amount,
        duration,
        penaltyRate: 0.1,
      },
    };
  }

  async generateFramingNudge(
    userId: string,
    scenario: 'GAIN' | 'LOSS',
    amount: number,
  ): Promise<LossAversionNudge | null> {
    const formattedAmount = this.formatCurrency(amount);

    if (scenario === 'LOSS') {
      return {
        type: 'FRAMING',
        message: {
          vi: `❌ Nếu không hành động ngay, bạn có thể mất ${formattedAmount} trong tương lai do lạm phát.`,
          en: `❌ Without action now, you could lose ${formattedAmount} in the future due to inflation.`,
          zh: `❌ 如果现在不采取行动，由于通货膨胀，您将来可能会损失 ${formattedAmount}。`,
        },
        priority: 'HIGH',
        metadata: {
          scenario,
          amount,
          framing: 'loss',
        },
      };
    }

    return {
      type: 'FRAMING',
      message: {
        vi: `✅ Hành động ngay để bảo vệ ${formattedAmount} trước lạm phát.`,
        en: `✅ Act now to protect ${formattedAmount} from inflation.`,
        zh: `✅ 立即采取行动以保护 ${formattedAmount} 免受通货膨胀影响。`,
      },
      priority: 'MEDIUM',
      metadata: {
        scenario,
        amount,
        framing: 'gain',
      },
    };
  }

  async checkMultipleUsers(
    userIds: string[],
  ): Promise<Map<string, LossAversionNudge[]>> {
    const results = new Map<string, LossAversionNudge[]>();

    for (const userId of userIds) {
      const nudges: LossAversionNudge[] = [];
      const streakWarning = await this.generateStreakLossWarning(userId);

      if (streakWarning) {
        nudges.push(streakWarning);
      }

      results.set(userId, nudges);
    }

    return results;
  }

  private getHoursSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }
}
