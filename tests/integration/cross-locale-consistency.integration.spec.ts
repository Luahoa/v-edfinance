import { Test } from '@nestjs/testing';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { I18nService } from '../../apps/api/src/common/i18n.service';
import { beforeEach, describe, expect, it } from 'vitest';

describe('I024: Cross-Locale Data Consistency Integration', () => {
  let prismaService: PrismaService;
  let i18nService: I18nService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService, I18nService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    i18nService = module.get<I18nService>(I18nService);
  });

  it('should store content with all three locales (vi, en, zh)', async () => {
    const courseId = 'locale-test-course';

    const course = await prismaService.course.create({
      data: {
        id: courseId,
        title: {
          vi: 'Khóa học tài chính',
          en: 'Finance Course',
          zh: '金融课程',
        },
        description: {
          vi: 'Mô tả bằng tiếng Việt',
          en: 'Description in English',
          zh: '中文描述',
        },
        category: 'FINANCE',
        difficulty: 'BEGINNER',
        estimatedMinutes: 60,
      },
    });

    expect(course.title).toHaveProperty('vi', 'Khóa học tài chính');
    expect(course.title).toHaveProperty('en', 'Finance Course');
    expect(course.title).toHaveProperty('zh', '金融课程');
  });

  it('should retrieve content in requested locale', () => {
    const multilingualContent = {
      vi: 'Xin chào',
      en: 'Hello',
      zh: '你好',
    };

    const viContent = i18nService.getLocalizedValue(multilingualContent, 'vi');
    const enContent = i18nService.getLocalizedValue(multilingualContent, 'en');
    const zhContent = i18nService.getLocalizedValue(multilingualContent, 'zh');

    expect(viContent).toBe('Xin chào');
    expect(enContent).toBe('Hello');
    expect(zhContent).toBe('你好');
  });

  it('should fallback to default locale when translation is missing', () => {
    const partialContent = {
      vi: 'Có nội dung',
      en: 'Has content',
      zh: '',
    };

    const zhFallback = i18nService.getLocalizedValue(partialContent, 'zh', 'vi');
    expect(zhFallback).toBe('Có nội dung');
  });

  it('should handle missing locale keys gracefully', () => {
    const incompleteContent = {
      vi: 'Tiếng Việt',
    };

    const enFallback = i18nService.getLocalizedValue(incompleteContent as any, 'en', 'vi');
    expect(enFallback).toBe('Tiếng Việt');
  });

  it('should ensure no data loss when switching locales', async () => {
    const lessonId = 'locale-switch-lesson';

    const lesson = await prismaService.lesson.create({
      data: {
        id: lessonId,
        courseId: 'test-course',
        order: 1,
        title: {
          vi: 'Bài học 1',
          en: 'Lesson 1',
          zh: '第一课',
        },
        content: {
          vi: 'Nội dung tiếng Việt',
          en: 'English content',
          zh: '中文内容',
        },
        videoKey: 'video-key',
      },
    });

    const viTitle = i18nService.getLocalizedValue(lesson.title, 'vi');
    const enTitle = i18nService.getLocalizedValue(lesson.title, 'en');
    const zhTitle = i18nService.getLocalizedValue(lesson.title, 'zh');

    expect(viTitle).toBe('Bài học 1');
    expect(enTitle).toBe('Lesson 1');
    expect(zhTitle).toBe('第一课');
  });

  it('should validate all JSONB I18N fields have required keys', async () => {
    const courseId = 'validation-i18n-course';

    const invalidCourse = async () => {
      await prismaService.course.create({
        data: {
          id: courseId,
          title: {
            vi: 'Only Vietnamese',
          } as any,
          description: {
            vi: 'Mô tả',
            en: 'Description',
            zh: '描述',
          },
          category: 'FINANCE',
          difficulty: 'BEGINNER',
          estimatedMinutes: 30,
        },
      });
    };

    await expect(invalidCourse()).rejects.toThrow();
  });

  it('should support locale-specific content formatting', () => {
    const numberValue = 1234567.89;

    const viFormatted = i18nService.formatNumber(numberValue, 'vi');
    const enFormatted = i18nService.formatNumber(numberValue, 'en');
    const zhFormatted = i18nService.formatNumber(numberValue, 'zh');

    expect(viFormatted).toBeDefined();
    expect(enFormatted).toBeDefined();
    expect(zhFormatted).toBeDefined();
  });

  it('should handle complex JSONB structures with nested I18N', async () => {
    const scenario = await prismaService.simulationEvent.create({
      data: {
        userId: 'test-user',
        type: 'MARKET_CRASH',
        scenario: {
          eventTitle: 'Market Event',
          description: 'Event description',
          options: [
            {
              id: 'opt1',
              text: 'Option 1',
              impact: { savings: -100, happiness: -10 },
            },
          ],
        },
        choice: 'opt1',
      },
    });

    expect(scenario.scenario).toHaveProperty('eventTitle');
    expect(scenario.scenario).toHaveProperty('options');
  });

  it('should maintain consistency across user locale changes', async () => {
    const userId = 'locale-change-user';

    const user = await prismaService.user.create({
      data: {
        id: userId,
        email: `${userId}@test.com`,
        passwordHash: 'hashed',
        locale: 'vi',
      },
    });

    expect(user.locale).toBe('vi');

    await prismaService.user.update({
      where: { id: userId },
      data: { locale: 'en' },
    });

    const updatedUser = await prismaService.user.findUnique({
      where: { id: userId },
    });

    expect(updatedUser?.locale).toBe('en');
  });
});
