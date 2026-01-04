import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { SharingService } from './sharing.service';
import {
  createMockPrismaService,
  createMockAchievement,
} from '../../test-utils/prisma-mock.helper';

describe('SharingService', () => {
  let service: SharingService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAchievementShareLink', () => {
    it('should generate a base64 encoded share link and track the event', async () => {
      const userId = 'user-123';
      const achievementId = 'ach-456';

      const link = await service.generateAchievementShareLink(
        userId,
        achievementId,
      );

      expect(link).toContain('https://v-edfinance.pages.dev/share/');
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            eventType: 'SHARE_LINK_GENERATED',
            payload: expect.objectContaining({ achievementId }),
          }),
        }),
      );
    });
  });

  describe('getSocialMetaTags', () => {
    it('should generate localized meta tags for an achievement', async () => {
      const mockAchievement = createMockAchievement({
        id: 'ach-456',
        name: {
          vi: 'Nhà đầu tư thông thái',
          en: 'Wise Investor',
          zh: '明智的投资者',
        },
        iconKey: 'https://cdn.v-edfinance.com/icons/wise.png',
      });

      mockPrisma.achievement.findUnique.mockResolvedValue(mockAchievement);

      const tags = await service.getSocialMetaTags('ach-456', 'en');

      expect(tags.title).toBe('Wise Investor - V-EdFinance');
      expect(tags.description).toContain(
        'I just earned the Wise Investor achievement!',
      );
      expect(tags.image).toBe(mockAchievement.iconKey);
      expect(tags['og:type']).toBe('website');
    });

    it('should return default tags if achievement is not found', async () => {
      mockPrisma.achievement.findUnique.mockResolvedValue(null);

      const tags = await service.getSocialMetaTags('invalid-id');

      expect(tags.title).toBe('V-EdFinance Achievement');
      expect(mockPrisma.achievement.findUnique).toHaveBeenCalled();
    });
  });

  describe('trackViralLoop', () => {
    it('should log a visit event for the viral loop', async () => {
      const shareId = 'share-xyz';
      const visitorId = 'visitor-789';
      const referrerId = 'referrer-123';

      await service.trackViralLoop(shareId, visitorId, referrerId);

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: {
          userId: visitorId,
          sessionId: 'viral-loop',
          path: `/share/${shareId}`,
          eventType: 'SHARE_LINK_VISITED',
          payload: { shareId, referrerId },
        },
      });
    });
  });
});
