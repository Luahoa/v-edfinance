import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ValidationService();
  });

  describe('validate', () => {
    it('should validate correct BEHAVIOR_LOG_PAYLOAD', () => {
      const validData = {
        isMock: true,
        generatedAt: '2025-12-21T10:00:00.000Z',
        action: 'CLICK',
        details: { buttonId: 'btn-1' },
      };

      const result = service.validate('BEHAVIOR_LOG_PAYLOAD', validData);
      expect(result).toEqual(validData);
    });

    it('should validate minimal BEHAVIOR_LOG_PAYLOAD', () => {
      const validData = {};
      const result = service.validate('BEHAVIOR_LOG_PAYLOAD', validData);
      expect(result).toEqual({});
    });

    it('should validate correct I18N_TEXT with all locales', () => {
      const validData = {
        vi: 'Tiếng Việt',
        en: 'English',
        zh: '中文',
      };

      const result = service.validate('I18N_TEXT', validData);
      expect(result).toEqual(validData);
    });

    it('should reject I18N_TEXT missing required locale', () => {
      const invalidData = {
        vi: 'Tiếng Việt',
        en: 'English',
      };

      expect(() => service.validate('I18N_TEXT', invalidData)).toThrow();
    });

    it('should validate USER_METADATA with optional fields', () => {
      const validData = {
        displayName: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
        preferences: { theme: 'dark', language: 'vi' },
      };

      const result = service.validate('USER_METADATA', validData);
      expect(result).toEqual(validData);
    });

    it('should reject USER_METADATA with invalid URL', () => {
      const invalidData = {
        avatar: 'not-a-url',
      };

      expect(() => service.validate('USER_METADATA', invalidData)).toThrow();
    });

    it('should validate SOCIAL_POST_CONTENT', () => {
      const validData = {
        text: 'My financial journey',
        mediaKey: 'image123.jpg',
        tags: ['finance', 'investment'],
      };

      const result = service.validate('SOCIAL_POST_CONTENT', validData);
      expect(result).toEqual(validData);
    });

    it('should validate SIMULATION_EVENT with nested options', () => {
      const validData = {
        eventTitle: 'Emergency Fund Decision',
        description: 'You have $5000. What will you do?',
        options: [
          {
            id: 'opt1',
            text: 'Save it',
            impact: { savings: 5000, happiness: 10 },
          },
          {
            id: 'opt2',
            text: 'Invest it',
            impact: { savings: 6000, happiness: 15 },
          },
        ],
        aiNudge: '70% of users in your situation chose to invest.',
        choice: 'opt2',
      };

      const result = service.validate('SIMULATION_EVENT', validData);
      expect(result).toEqual(validData);
    });

    it('should reject SIMULATION_EVENT with missing required fields', () => {
      const invalidData = {
        eventTitle: 'Emergency',
        options: [],
      };

      expect(() => service.validate('SIMULATION_EVENT', invalidData)).toThrow();
    });

    it('should validate INVESTMENT_PHILOSOPHY', () => {
      const validData = {
        riskTolerance: 'HIGH',
        strategy: 'Aggressive growth',
        ai_summary: 'User prefers high-risk investments.',
      };

      const result = service.validate('INVESTMENT_PHILOSOPHY', validData);
      expect(result).toEqual(validData);
    });

    it('should reject INVESTMENT_PHILOSOPHY with invalid enum', () => {
      const invalidData = {
        riskTolerance: 'EXTREME',
      };

      expect(() =>
        service.validate('INVESTMENT_PHILOSOPHY', invalidData),
      ).toThrow();
    });

    it('should validate FINANCIAL_GOALS array', () => {
      const validData = [
        {
          id: 'goal1',
          title: 'Buy a house',
          targetAmount: 500000,
          deadline: '2030-12-31T00:00:00.000Z',
        },
        {
          id: 'goal2',
          title: 'Retirement fund',
          targetAmount: 1000000,
        },
      ];

      const result = service.validate('FINANCIAL_GOALS', validData);
      expect(result).toEqual(validData);
    });

    it('should validate CHECKLIST_ITEMS', () => {
      const validData = [
        {
          id: 'item1',
          label: 'Complete onboarding',
          isCompleted: true,
          completedAt: '2025-12-20T10:00:00.000Z',
        },
        {
          id: 'item2',
          label: 'Watch first video',
          isCompleted: false,
        },
      ];

      const result = service.validate('CHECKLIST_ITEMS', validData);
      expect(result).toEqual(validData);
    });

    it('should validate PORTFOLIO_ASSETS with mixed types', () => {
      const validData = {
        cash: 10000,
        AAPL: {
          quantity: 50,
          averagePrice: 150,
          symbol: 'AAPL',
        },
      };

      const result = service.validate('PORTFOLIO_ASSETS', validData);
      expect(result).toEqual(validData);
    });

    it('should validate SIMULATION_STATUS with optional fields', () => {
      const validData = {
        age: 25,
        job: 'Software Engineer',
        salary: 50000,
        savings: 10000,
        goals: ['House', 'Retirement'],
        happiness: 75,
        stage: 'Young Professional',
        metrics: { netWorth: 20000, debtRatio: 0.2 },
      };

      const result = service.validate('SIMULATION_STATUS', validData);
      expect(result).toEqual(validData);
    });

    it('should validate COURSE_RECOMMENDATION with i18n reason', () => {
      const validData = [
        {
          courseId: 'course-123',
          reason: {
            vi: 'Phù hợp với mục tiêu của bạn',
            en: 'Matches your goals',
            zh: '符合您的目标',
          },
          strategy: 'BEHAVIORAL_PATTERN',
        },
      ];

      const result = service.validate('COURSE_RECOMMENDATION', validData);
      expect(result).toEqual(validData);
    });

    it('should validate CHAT_MESSAGE_METADATA', () => {
      const validData = {
        type: 'ACTION_CARD',
        hasActionCard: true,
        suggestions: ['Save more', 'Invest wisely'],
      };

      const result = service.validate('CHAT_MESSAGE_METADATA', validData);
      expect(result).toEqual(validData);
    });

    it('should throw error for validation failure', () => {
      expect(() =>
        service.validate('I18N_TEXT', { vi: 'Only Vietnamese' }),
      ).toThrow();
    });

    it('should throw error for undefined schema key', () => {
      expect(() => service.validate('NON_EXISTENT' as any, {})).toThrow(
        'Schema for key NON_EXISTENT is not defined in SchemaRegistry.',
      );
    });

    it('should validate empty BEHAVIOR_LOG_PAYLOAD as valid', () => {
      const result = service.validate('BEHAVIOR_LOG_PAYLOAD', {});
      expect(result).toEqual({});
    });

    it('should validate SIMULATION_DECISIONS with multiple decision types', () => {
      const validData = [
        {
          step: 1,
          choice: 'save',
          timestamp: '2025-12-21T10:00:00.000Z',
        },
        {
          eventTitle: 'Investment opportunity',
          description: 'Stock market crash',
          options: [
            {
              id: 'buy',
              text: 'Buy the dip',
              impact: { savings: -1000, happiness: 5 },
            },
          ],
          aiNudge: 'Historical data shows...',
        },
      ];

      const result = service.validate('SIMULATION_DECISIONS', validData);
      expect(result).toEqual(validData);
    });

    it('should handle passthrough fields in INVESTMENT_PHILOSOPHY', () => {
      const validData = {
        riskTolerance: 'MEDIUM',
        customField: 'This should be allowed',
        anotherCustom: 123,
      };

      const result = service.validate('INVESTMENT_PHILOSOPHY', validData);
      expect(result.customField).toBe('This should be allowed');
      expect(result.anotherCustom).toBe(123);
    });

    it('should validate YOUTUBE_VIDEO_METADATA with all required fields', () => {
      const validData = {
        videoId: 'dQw4w9WgXcQ',
        title: 'Introduction to Financial Literacy',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration: 300,
      };

      const result = service.validate('YOUTUBE_VIDEO_METADATA', validData);
      expect(result).toEqual(validData);
    });

    it('should reject YOUTUBE_VIDEO_METADATA with invalid thumbnail URL', () => {
      const invalidData = {
        videoId: 'abc123',
        title: 'Test Video',
        thumbnail: 'not-a-url',
        duration: 120,
      };

      expect(() => service.validate('YOUTUBE_VIDEO_METADATA', invalidData)).toThrow();
    });

    it('should reject YOUTUBE_VIDEO_METADATA with negative duration', () => {
      const invalidData = {
        videoId: 'abc123',
        title: 'Test Video',
        thumbnail: 'https://example.com/thumb.jpg',
        duration: -5,
      };

      expect(() => service.validate('YOUTUBE_VIDEO_METADATA', invalidData)).toThrow();
    });

    it('should reject YOUTUBE_VIDEO_METADATA with missing required fields', () => {
      const invalidData = {
        videoId: 'abc123',
        title: 'Test Video',
      };

      expect(() => service.validate('YOUTUBE_VIDEO_METADATA', invalidData)).toThrow();
    });
  });
});
