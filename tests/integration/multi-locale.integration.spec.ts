/**
 * I012: Multi-Locale Content Delivery Integration Test
 * 
 * Tests: Request content in vi/en/zh → JSONB fields retrieved → I18n fallback
 * Validates: Translation consistency, JSONB schema integrity
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { PrismaModule } from '../../apps/api/src/prisma/prisma.module';
import { generateTestEmail } from './test-setup';

describe('I012: Multi-Locale Content Delivery', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
  });

  afterEach(async () => {
    await prisma.lesson.deleteMany({});
    await prisma.course.deleteMany({ where: { title: { contains: 'TEST-' } } });
    await prisma.achievement.deleteMany({ where: { title: { contains: 'TEST-' } } });
    await prisma.nudgeHistory.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: 'test-i18n-' } } });
  });

  describe('JSONB Multi-Locale Content Retrieval', () => {
    it('should store and retrieve course in all locales (vi/en/zh)', async () => {
      await prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            title: 'TEST-Multi-Locale Course',
            description: {
              vi: 'Khóa học đầu tư chứng khoán cơ bản',
              en: 'Basic Stock Investment Course',
              zh: '基础股票投资课程',
            },
            slug: `test-i18n-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 10,
          },
        });

        // Retrieve and verify all locales
        const retrieved = await tx.course.findUnique({
          where: { id: course.id },
        });

        expect(retrieved?.description).toMatchObject({
          vi: 'Khóa học đầu tư chứng khoán cơ bản',
          en: 'Basic Stock Investment Course',
          zh: '基础股票投资课程',
        });
      });
    });

    it('should retrieve content in Vietnamese (vi)', async () => {
      await prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            title: 'TEST-Vietnamese Course',
            description: {
              vi: 'Nội dung tiếng Việt',
              en: 'English content',
              zh: '中文内容',
            },
            slug: `test-vi-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const lesson = await tx.lesson.create({
          data: {
            courseId: course.id,
            title: {
              vi: 'Bài học 1',
              en: 'Lesson 1',
              zh: '第一课',
            },
            content: {
              vi: 'Đây là nội dung bài học',
              en: 'This is lesson content',
              zh: '这是课程内容',
            },
            order: 1,
          },
        });

        // Simulate locale selection: vi
        const locale = 'vi';
        const lessonContent = lesson.content as any;

        expect(lessonContent[locale]).toBe('Đây là nội dung bài học');
      });
    });

    it('should retrieve content in English (en)', async () => {
      await prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            title: 'TEST-English Course',
            description: {
              vi: 'Nội dung tiếng Việt',
              en: 'English content',
              zh: '中文内容',
            },
            slug: `test-en-${Date.now()}`,
            level: 'INTERMEDIATE',
            estimatedHours: 8,
          },
        });

        const locale = 'en';
        const description = course.description as any;

        expect(description[locale]).toBe('English content');
      });
    });

    it('should retrieve content in Chinese (zh)', async () => {
      await prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            title: 'TEST-Chinese Course',
            description: {
              vi: 'Nội dung tiếng Việt',
              en: 'English content',
              zh: '中文内容',
            },
            slug: `test-zh-${Date.now()}`,
            level: 'ADVANCED',
            estimatedHours: 12,
          },
        });

        const locale = 'zh';
        const description = course.description as any;

        expect(description[locale]).toBe('中文内容');
      });
    });

    it('should fallback to default locale if requested locale is missing', async () => {
      await prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            title: 'TEST-Fallback Course',
            description: {
              vi: 'Nội dung tiếng Việt',
              en: 'English content',
              // zh is missing
            },
            slug: `test-fallback-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const requestedLocale = 'zh';
        const defaultLocale = 'en';
        const description = course.description as any;

        // Fallback logic
        const content = description[requestedLocale] || description[defaultLocale];

        expect(content).toBe('English content');
      });
    });

    it('should handle nudge messages in all locales', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test User',
            role: 'USER',
          },
        });

        const nudge = await tx.nudgeHistory.create({
          data: {
            userId: user.id,
            nudgeType: 'SOCIAL_PROOF',
            message: {
              vi: 'Hơn 80% người dùng đã hoàn thành bài học này!',
              en: 'Over 80% of users completed this lesson!',
              zh: '超过 80% 的用户完成了本课程！',
            },
            metadata: {},
            sentAt: new Date(),
          },
        });

        const message = nudge.message as any;

        expect(message.vi).toContain('80%');
        expect(message.en).toContain('80%');
        expect(message.zh).toContain('80%');
      });
    });

    it('should validate JSONB schema for achievement descriptions', async () => {
      await prisma.$transaction(async (tx) => {
        const achievement = await tx.achievement.create({
          data: {
            title: 'TEST-First Course Completion',
            description: {
              vi: 'Hoàn thành khóa học đầu tiên',
              en: 'Complete your first course',
              zh: '完成您的第一门课程',
            },
            icon: '🎓',
            pointsReward: 100,
          },
        });

        const description = achievement.description as any;

        // Validate all required locales are present
        expect(description).toHaveProperty('vi');
        expect(description).toHaveProperty('en');
        expect(description).toHaveProperty('zh');
      });
    });

    it('should maintain consistency across locales for numerical data', async () => {
      await prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            title: 'TEST-Consistency Check',
            description: {
              vi: 'Khóa học 10 giờ',
              en: '10-hour course',
              zh: '10小时课程',
            },
            slug: `test-consistency-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 10, // Numerical consistency
          },
        });

        const description = course.description as any;

        // All locales should reference the same number (10 hours)
        expect(description.vi).toContain('10');
        expect(description.en).toContain('10');
        expect(description.zh).toContain('10');
        expect(course.estimatedHours).toBe(10);
      });
    });

    it('should handle special characters and emojis in all locales', async () => {
      await prisma.$transaction(async (tx) => {
        const achievement = await tx.achievement.create({
          data: {
            title: 'TEST-Special Characters',
            description: {
              vi: 'Bạn đã kiếm được 💰 100 điểm!',
              en: 'You earned 💰 100 points!',
              zh: '你赚了 💰 100 积分！',
            },
            icon: '💰',
            pointsReward: 100,
          },
        });

        const description = achievement.description as any;

        expect(description.vi).toContain('💰');
        expect(description.en).toContain('💰');
        expect(description.zh).toContain('💰');
      });
    });

    it('should support dynamic locale switching for user preferences', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test User',
            role: 'USER',
            preferredLanguage: 'vi', // Default preference
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-User Preference',
            description: {
              vi: 'Tiếng Việt',
              en: 'English',
              zh: '中文',
            },
            slug: `test-pref-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        // User switches to English
        await tx.user.update({
          where: { id: user.id },
          data: { preferredLanguage: 'en' },
        });

        const updatedUser = await tx.user.findUnique({
          where: { id: user.id },
        });

        const description = course.description as any;
        const userContent = description[updatedUser!.preferredLanguage];

        expect(userContent).toBe('English');
      });
    });
  });

  describe('I18n Fallback and Edge Cases', () => {
    it('should handle completely missing JSONB field gracefully', async () => {
      await prisma.$transaction(async (tx) => {
        // Simulate a course with minimal JSONB content
        const course = await tx.course.create({
          data: {
            title: 'TEST-Minimal Course',
            description: { vi: 'Minimal' }, // Only vi locale
            slug: `test-minimal-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const description = course.description as any;

        // Fallback chain: zh -> en -> vi
        const content = description.zh || description.en || description.vi;

        expect(content).toBe('Minimal');
      });
    });

    it('should detect missing locales and flag for translation', async () => {
      await prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            title: 'TEST-Incomplete Translation',
            description: {
              vi: 'Vietnamese content',
              en: 'English content',
              // zh missing
            },
            slug: `test-incomplete-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const description = course.description as any;
        const requiredLocales = ['vi', 'en', 'zh'];
        const missingLocales = requiredLocales.filter(locale => !description[locale]);

        expect(missingLocales).toEqual(['zh']);
      });
    });
  });
});
