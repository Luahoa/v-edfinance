import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { LocalizedContent } from './social.service';

@Injectable()
export class SharingService {
  constructor(private prisma: PrismaService) {}

  async generateAchievementShareLink(
    userId: string,
    achievementId: string,
  ): Promise<string> {
    const shareId = Buffer.from(
      `${userId}:${achievementId}:${Date.now()}`,
    ).toString('base64url');

    await this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: 'sharing',
        path: '/share/achievement',
        eventType: 'SHARE_LINK_GENERATED',
        payload: { achievementId, shareId },
      },
    });

    const baseUrl = process.env.WEB_BASE_URL || 'https://v-edfinance.pages.dev';
    return `${baseUrl}/share/${shareId}`;
  }

  async getSocialMetaTags(
    achievementId: string,
    locale: 'vi' | 'en' | 'zh' = 'vi',
  ) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      return {
        title: 'V-EdFinance Achievement',
        description: 'Check out my financial learning progress!',
        image: 'https://v-edfinance.pages.dev/og-image.png',
      };
    }

    const title = (achievement.name as unknown as LocalizedContent)[locale];
    const description = (
      achievement.description as unknown as LocalizedContent
    )[locale];

    return {
      title: `${title} - V-EdFinance`,
      description: `I just earned the ${title} achievement! ${description}`,
      image:
        achievement.iconKey || 'https://v-edfinance.pages.dev/og-image.png',
      'og:type': 'website',
      'twitter:card': 'summary_large_image',
    };
  }

  async trackViralLoop(
    shareId: string,
    visitorId: string,
    referrerId?: string,
  ) {
    return this.prisma.behaviorLog.create({
      data: {
        userId: visitorId,
        sessionId: 'viral-loop',
        path: `/share/${shareId}`,
        eventType: 'SHARE_LINK_VISITED',
        payload: { shareId, referrerId },
      },
    });
  }
}
