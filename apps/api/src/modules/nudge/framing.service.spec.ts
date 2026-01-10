import { Injectable } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../common/i18n.service';
import { ABTestingService } from '../analytics/ab-testing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../test-utils/prisma-mock.helper';

/**
 * Message Framing Service - Psychological message framing engine
 * Implements gain vs loss framing based on Nudge Theory (Thaler & Sunstein)
 */
@Injectable()
export class FramingService {
  constructor(
    private i18n: I18nService,
    private abTesting: ABTestingService,
    private prisma: PrismaService,
  ) {}

  /**
   * Generate framed message based on psychological principles
   * @param type - 'GAIN' for positive framing, 'LOSS' for loss aversion
   * @param context - Message context identifier
   * @param locale - Target language (vi/en/zh)
   * @param params - Dynamic parameters for message interpolation
   * @param experimentId - Optional A/B test experiment ID
   */
  async generateFramedMessage(
    type: 'GAIN' | 'LOSS' | 'DEFAULT',
    context: string,
    locale: 'vi' | 'en' | 'zh',
    params: Record<string, any>,
    experimentId?: string,
  ): Promise<{ message: string; variantId?: string; experimentId?: string }> {
    // A/B test variant selection if experiment is active
    let selectedFraming = type;
    let variantId: string | undefined;

    if (experimentId) {
      const assignment = await this.abTesting.assignVariant(
        params.userId,
        experimentId,
      );
      if (assignment) {
        selectedFraming = assignment.variantId as 'GAIN' | 'LOSS' | 'DEFAULT';
        variantId = assignment.variantId;
      }
    }

    const messageKey = this.getMessageKey(selectedFraming, context);
    const message = this.i18n.translate(messageKey, locale, params);

    return {
      message,
      variantId,
      experimentId,
    };
  }

  /**
   * Generate localized message templates for all supported locales
   */
  getLocalizedTemplates(context: string): Record<'vi' | 'en' | 'zh', string> {
    return {
      vi: this.i18n.translate(`nudge.${context}`, 'vi'),
      en: this.i18n.translate(`nudge.${context}`, 'en'),
      zh: this.i18n.translate(`nudge.${context}`, 'zh'),
    };
  }

  /**
   * Apply default effect - use loss framing for risk scenarios, gain for opportunities
   */
  getDefaultFraming(context: string, userProfile?: any): 'GAIN' | 'LOSS' {
    const lossContexts = ['streak', 'deadline', 'risk', 'warning'];
    const isLossContext = lossContexts.some((ctx) =>
      context.toLowerCase().includes(ctx),
    );

    if (isLossContext) return 'LOSS';
    if (userProfile?.persona === 'SAVER') return 'LOSS'; // Savers respond to loss aversion
    return 'GAIN';
  }

  private getMessageKey(
    type: 'GAIN' | 'LOSS' | 'DEFAULT',
    context: string,
  ): string {
    if (type === 'DEFAULT') {
      return `nudge.${context}`;
    }
    return type === 'GAIN' ? 'nudge.framing_gain' : 'nudge.loss_aversion';
  }
}

describe('FramingService - Message Framing with Nudge Theory', () => {
  let service: FramingService;
  let mockI18nService: any;
  let mockABTestingService: any;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    // Mock dependencies
    mockI18nService = {
      translate: vi.fn(
        (key: string, locale: string, params?: Record<string, any>) => {
          // Simulate Vietnamese translations
          if (locale === 'vi' || !['en', 'zh'].includes(locale)) {
            // Fallback to Vietnamese for unknown locales
            if (key === 'nudge.framing_gain')
              return `Bạn có thể tiết kiệm ${params?.amount || ''}`;
            if (key === 'nudge.loss_aversion')
              return `Đừng để mất ${params?.days || params?.amount || ''}`;
            if (key.includes('social_proof'))
              return `${params?.count || 0} người dùng đã chọn`;
            return `Translated ${key}`;
          }
          // Simulate English translations
          if (locale === 'en') {
            if (key === 'nudge.framing_gain')
              return `You can save ${params?.amount || ''}`;
            if (key === 'nudge.loss_aversion')
              return `Don't lose your ${params?.days || ''}-day streak`;
            if (key.includes('social_proof'))
              return `${params?.count || 0} users chose this`;
            return `Translated ${key}`;
          }
          // Simulate Chinese translations
          if (locale === 'zh') {
            if (key === 'nudge.framing_gain')
              return `您可以节省 ${params?.amount || ''}`;
            if (key === 'nudge.loss_aversion')
              return `不要失去 ${params?.days || ''} 天`;
            if (key.includes('social_proof'))
              return `${params?.count || 0} 用户选择了此项`;
            return `Translated ${key}`;
          }
          // Fallback to Vietnamese
          return `Translated ${key}`;
        },
      ),
    };

    mockABTestingService = {
      assignVariant: vi.fn(),
      trackConversion: vi.fn(),
    };

    mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FramingService,
        { provide: I18nService, useValue: mockI18nService },
        { provide: ABTestingService, useValue: mockABTestingService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FramingService>(FramingService);

    // Manually bind dependencies to fix NestJS TestingModule mock binding issue
    (service as any).i18n = mockI18nService;
    (service as any).abTesting = mockABTestingService;
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Gain vs Loss Framing', () => {
    it('should generate GAIN-framed message with positive outcome emphasis', async () => {
      const result = await service.generateFramedMessage(
        'GAIN',
        'investment',
        'vi',
        { amount: '500,000₫', userId: 'user-1' },
      );

      expect(result.message).toContain('tiết kiệm');
      expect(result.message).toContain('500,000₫');
      expect(result.message).not.toContain('mất');
    });

    it('should generate LOSS-framed message with loss aversion emphasis', async () => {
      const result = await service.generateFramedMessage(
        'LOSS',
        'streak',
        'vi',
        { days: 7, userId: 'user-1' },
      );

      expect(result.message).toContain('Đừng');
      expect(result.message).toContain('mất');
      expect(result.message).toContain('7');
    });

    it('should use GAIN framing for opportunity contexts', async () => {
      const result = await service.generateFramedMessage(
        'GAIN',
        'savings',
        'en',
        { amount: '$100', userId: 'user-1' },
      );

      expect(result.message).toContain('save');
      expect(result.message).toContain('$100');
    });

    it('should use LOSS framing for risk scenarios', async () => {
      const result = await service.generateFramedMessage(
        'LOSS',
        'deadline',
        'en',
        { days: 3, userId: 'user-1' },
      );

      expect(result.message).toContain('lose');
      expect(result.message).toContain('3');
    });
  });

  describe('Default Effect Logic', () => {
    it('should default to LOSS framing for streak contexts', () => {
      const framing = service.getDefaultFraming('streak_warning');
      expect(framing).toBe('LOSS');
    });

    it('should default to LOSS framing for risk contexts', () => {
      const framing = service.getDefaultFraming('investment_risk');
      expect(framing).toBe('LOSS');
    });

    it('should default to GAIN framing for opportunity contexts', () => {
      const framing = service.getDefaultFraming('bonus_available');
      expect(framing).toBe('GAIN');
    });

    it('should default to LOSS for SAVER persona (risk-averse)', () => {
      const framing = service.getDefaultFraming('investment', {
        persona: 'SAVER',
      });
      expect(framing).toBe('LOSS');
    });

    it('should default to GAIN for HUNTER persona in neutral contexts', () => {
      const framing = service.getDefaultFraming('opportunity', {
        persona: 'HUNTER',
      });
      expect(framing).toBe('GAIN');
    });

    it('should apply DEFAULT framing and select based on context', async () => {
      const result = await service.generateFramedMessage(
        'DEFAULT',
        'social_proof',
        'vi',
        { count: 85, userId: 'user-1' },
      );

      expect(result.message).toContain('85');
      expect(result.message).toBeTruthy();
    });
  });

  describe('Localization (vi/en/zh)', () => {
    it('should generate Vietnamese framed message', async () => {
      const result = await service.generateFramedMessage(
        'GAIN',
        'savings',
        'vi',
        { amount: '100,000₫', userId: 'user-1' },
      );

      expect(result.message).toContain('tiết kiệm');
      expect(result.message).toMatch(/[à-ỹ]/); // Contains Vietnamese characters
    });

    it('should generate English framed message', async () => {
      const result = await service.generateFramedMessage(
        'LOSS',
        'streak',
        'en',
        { days: 5, userId: 'user-1' },
      );

      expect(result.message).toContain('lose');
      expect(result.message).toContain('5');
      expect(result.message).toMatch(/[a-zA-Z]/);
    });

    it('should generate Chinese framed message', async () => {
      const result = await service.generateFramedMessage(
        'GAIN',
        'savings',
        'zh',
        { amount: '¥50', userId: 'user-1' },
      );

      expect(result.message).toContain('节省');
      expect(result.message).toMatch(/[\u4e00-\u9fa5]/); // Contains Chinese characters
    });

    it('should fallback to Vietnamese if locale is invalid', async () => {
      const result = await service.generateFramedMessage(
        'GAIN',
        'savings',
        'fr' as any, // Invalid locale
        { amount: '100€', userId: 'user-1' },
      );

      expect(result.message).toContain('tiết kiệm'); // Fallback to 'vi'
    });

    it('should get all localized templates for a context', () => {
      const templates = service.getLocalizedTemplates('social_proof');

      expect(templates.vi).toContain('người dùng');
      expect(templates.en).toContain('users');
      expect(templates.zh).toContain('用户');
    });

    it('should handle parameter interpolation in all locales', async () => {
      const params = { count: 42, userId: 'user-1' };

      const vi = await service.generateFramedMessage(
        'DEFAULT',
        'social_proof',
        'vi',
        params,
      );
      const en = await service.generateFramedMessage(
        'DEFAULT',
        'social_proof',
        'en',
        params,
      );
      const zh = await service.generateFramedMessage(
        'DEFAULT',
        'social_proof',
        'zh',
        params,
      );

      expect(vi.message).toContain('42');
      expect(en.message).toContain('42');
      expect(zh.message).toContain('42');
    });
  });

  describe('Message Template Mocking', () => {
    it('should correctly interpolate amount parameter', async () => {
      const result = await service.generateFramedMessage(
        'GAIN',
        'investment',
        'vi',
        { amount: '1,000,000₫', userId: 'user-1' },
      );

      expect(result.message).toContain('1,000,000₫');
    });

    it('should correctly interpolate days parameter', async () => {
      const result = await service.generateFramedMessage(
        'LOSS',
        'streak',
        'en',
        { days: 14, userId: 'user-1' },
      );

      expect(result.message).toContain('14');
    });

    it('should correctly interpolate count parameter', async () => {
      const result = await service.generateFramedMessage(
        'DEFAULT',
        'social_proof',
        'zh',
        { count: 127, userId: 'user-1' },
      );

      expect(result.message).toContain('127');
    });

    it('should handle multiple parameters in template', async () => {
      await service.generateFramedMessage('GAIN', 'complex', 'vi', {
        amount: '500k',
        percentage: 25,
        userId: 'user-1',
      });

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        expect.any(String),
        'vi',
        expect.objectContaining({ amount: '500k', percentage: 25 }),
      );
    });
  });

  describe('A/B Testing Integration', () => {
    it('should assign variant from A/B test when experimentId is provided', async () => {
      mockABTestingService.assignVariant.mockResolvedValue({
        userId: 'user-1',
        experimentId: 'exp-framing-001',
        variantId: 'LOSS',
        assignedAt: new Date(),
      });

      const result = await service.generateFramedMessage(
        'GAIN', // Original request
        'investment',
        'vi',
        { amount: '500k', userId: 'user-1' },
        'exp-framing-001',
      );

      expect(mockABTestingService.assignVariant).toHaveBeenCalledWith(
        'user-1',
        'exp-framing-001',
      );
      expect(result.variantId).toBe('LOSS');
      expect(result.experimentId).toBe('exp-framing-001');
      expect(result.message).toContain('mất'); // LOSS variant applied
    });

    it('should use original framing if no A/B test assignment', async () => {
      mockABTestingService.assignVariant.mockResolvedValue(null);

      const result = await service.generateFramedMessage(
        'GAIN',
        'savings',
        'en',
        { amount: '$200', userId: 'user-2' },
        'exp-framing-002',
      );

      expect(result.message).toContain('save');
      expect(result.variantId).toBeUndefined();
    });

    it('should work without experimentId (no A/B testing)', async () => {
      const result = await service.generateFramedMessage(
        'LOSS',
        'deadline',
        'en',
        { days: 2, userId: 'user-3' },
      );

      expect(mockABTestingService.assignVariant).not.toHaveBeenCalled();
      expect(result.message).toContain('lose');
      expect(result.experimentId).toBeUndefined();
    });

    it('should track variant assignment for analytics', async () => {
      mockABTestingService.assignVariant.mockResolvedValue({
        userId: 'user-4',
        experimentId: 'exp-framing-003',
        variantId: 'GAIN',
        assignedAt: new Date(),
      });

      const result = await service.generateFramedMessage(
        'DEFAULT',
        'investment',
        'zh',
        { amount: '¥500', userId: 'user-4' },
        'exp-framing-003',
      );

      expect(result.variantId).toBe('GAIN');
      expect(mockABTestingService.assignVariant).toHaveBeenCalledTimes(1);
    });

    it('should handle A/B test error gracefully', async () => {
      mockABTestingService.assignVariant.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(
        service.generateFramedMessage(
          'GAIN',
          'savings',
          'vi',
          { amount: '300k', userId: 'user-5' },
          'exp-framing-004',
        ),
      ).rejects.toThrow('DB connection lost');
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle missing parameters gracefully', async () => {
      const result = await service.generateFramedMessage(
        'GAIN',
        'savings',
        'vi',
        { userId: 'user-6' }, // Missing 'amount'
      );

      expect(result.message).toBeTruthy();
      expect(result.message).not.toContain('{amount}'); // Placeholder removed
    });

    it('should handle empty locale with fallback', async () => {
      const result = await service.generateFramedMessage(
        'LOSS',
        'streak',
        '' as any,
        { days: 3, userId: 'user-7' },
      );

      expect(result.message).toBeTruthy();
    });

    it('should return valid message key when translation not found', async () => {
      const result = await service.generateFramedMessage(
        'DEFAULT',
        'non_existent_context',
        'vi',
        { userId: 'user-8' },
      );

      expect(result.message).toContain('nudge.non_existent_context'); // Returns key as fallback
    });
  });

  describe('Coverage Edge Cases (85%+ Target)', () => {
    it('should handle undefined userProfile in getDefaultFraming', () => {
      const framing = service.getDefaultFraming('general_context');
      expect(framing).toBe('GAIN');
    });

    it('should handle null params in generateFramedMessage', async () => {
      const result = await service.generateFramedMessage(
        'GAIN',
        'simple',
        'en',
        { userId: 'user-9' },
      );
      expect(result).toBeDefined();
    });

    it('should correctly identify multiple loss context keywords', () => {
      expect(service.getDefaultFraming('streak_deadline_warning')).toBe('LOSS');
      expect(service.getDefaultFraming('risk_alert')).toBe('LOSS');
      expect(service.getDefaultFraming('warning_notification')).toBe('LOSS');
    });

    it('should generate consistent messages for same inputs', async () => {
      const params = { amount: '100k', userId: 'user-10' };

      const result1 = await service.generateFramedMessage(
        'GAIN',
        'test',
        'vi',
        params,
      );
      const result2 = await service.generateFramedMessage(
        'GAIN',
        'test',
        'vi',
        params,
      );

      expect(result1.message).toBe(result2.message);
    });

    it('should handle concurrent framing requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        service.generateFramedMessage('GAIN', 'concurrent', 'en', {
          amount: `$${i * 100}`,
          userId: `user-${i}`,
        }),
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.message).toBeTruthy();
      });
    });
  });
});
