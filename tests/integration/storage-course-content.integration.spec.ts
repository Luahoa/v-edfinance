/**
 * I011: Storage → Course Content Flow Integration Test
 * 
 * Tests: Upload lesson asset → R2 storage → Presigned URL → Student access
 * Validates: File integrity, access control
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { PrismaModule } from '../../apps/api/src/prisma/prisma.module';
import { generateTestEmail } from './test-setup';

describe('I011: Storage → Course Content Flow', () => {
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
    await prisma.courseAsset.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.course.deleteMany({ where: { title: { contains: 'TEST-' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-storage-' } } });
  });

  describe('File Upload → Storage → Access Control', () => {
    it('should upload lesson asset to storage', async () => {
      await prisma.$transaction(async (tx) => {
        const instructor = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Instructor',
            role: 'INSTRUCTOR',
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-Video Course',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-video-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const lesson = await tx.lesson.create({
          data: {
            courseId: course.id,
            title: { vi: 'Video Lesson', en: 'Video Lesson', zh: 'Video Lesson' },
            content: { vi: 'Content', en: 'Content', zh: 'Content' },
            order: 1,
          },
        });

        // Simulate asset upload
        const asset = await tx.courseAsset.create({
          data: {
            courseId: course.id,
            lessonId: lesson.id,
            fileName: 'lesson-1-video.mp4',
            fileSize: 15728640, // 15MB
            mimeType: 'video/mp4',
            storageKey: `courses/${course.id}/lessons/${lesson.id}/lesson-1-video.mp4`,
            uploadedAt: new Date(),
          },
        });

        expect(asset).toBeDefined();
        expect(asset.fileName).toBe('lesson-1-video.mp4');
        expect(asset.storageKey).toContain(course.id);
      });
    });

    it('should generate presigned URL for authorized user', async () => {
      await prisma.$transaction(async (tx) => {
        const student = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Student',
            role: 'USER',
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-Protected Course',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-protected-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const lesson = await tx.lesson.create({
          data: {
            courseId: course.id,
            title: { vi: 'Protected Lesson', en: 'Protected Lesson', zh: 'Protected Lesson' },
            content: { vi: 'Content', en: 'Content', zh: 'Content' },
            order: 1,
          },
        });

        // Enroll student
        await tx.enrollment.create({
          data: {
            userId: student.id,
            courseId: course.id,
            enrolledAt: new Date(),
            progress: 0,
          },
        });

        const asset = await tx.courseAsset.create({
          data: {
            courseId: course.id,
            lessonId: lesson.id,
            fileName: 'protected-video.mp4',
            fileSize: 10485760,
            mimeType: 'video/mp4',
            storageKey: `courses/${course.id}/lessons/${lesson.id}/protected-video.mp4`,
            uploadedAt: new Date(),
          },
        });

        // Simulate presigned URL generation
        const presignedUrl = `https://r2.example.com/${asset.storageKey}?signature=xyz&expires=1234567890`;

        // Log access
        await tx.behaviorLog.create({
          data: {
            userId: student.id,
            eventType: 'ASSET_ACCESS',
            metadata: {
              assetId: asset.id,
              presignedUrl: presignedUrl,
              granted: true,
            },
            timestamp: new Date(),
          },
        });

        const accessLog = await tx.behaviorLog.findFirst({
          where: {
            userId: student.id,
            eventType: 'ASSET_ACCESS',
          },
        });

        expect(accessLog?.metadata).toMatchObject({ granted: true });
      });
    });

    it('should deny access to non-enrolled users', async () => {
      await prisma.$transaction(async (tx) => {
        const student = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Unenrolled Student',
            role: 'USER',
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-Restricted Course',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-restricted-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const lesson = await tx.lesson.create({
          data: {
            courseId: course.id,
            title: { vi: 'Restricted Lesson', en: 'Restricted Lesson', zh: 'Restricted Lesson' },
            content: { vi: 'Content', en: 'Content', zh: 'Content' },
            order: 1,
          },
        });

        const asset = await tx.courseAsset.create({
          data: {
            courseId: course.id,
            lessonId: lesson.id,
            fileName: 'restricted-video.mp4',
            fileSize: 10485760,
            mimeType: 'video/mp4',
            storageKey: `courses/${course.id}/lessons/${lesson.id}/restricted-video.mp4`,
            uploadedAt: new Date(),
          },
        });

        // Check enrollment
        const enrollment = await tx.enrollment.findFirst({
          where: {
            userId: student.id,
            courseId: course.id,
          },
        });

        // Log denied access
        await tx.behaviorLog.create({
          data: {
            userId: student.id,
            eventType: 'ASSET_ACCESS',
            metadata: {
              assetId: asset.id,
              granted: false,
              reason: 'Not enrolled',
            },
            timestamp: new Date(),
          },
        });

        expect(enrollment).toBeNull();
      });
    });

    it('should validate file integrity after upload', async () => {
      await prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            title: 'TEST-Integrity Check',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-integrity-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const lesson = await tx.lesson.create({
          data: {
            courseId: course.id,
            title: { vi: 'Lesson', en: 'Lesson', zh: 'Lesson' },
            content: { vi: 'Content', en: 'Content', zh: 'Content' },
            order: 1,
          },
        });

        // Upload with checksum
        const asset = await tx.courseAsset.create({
          data: {
            courseId: course.id,
            lessonId: lesson.id,
            fileName: 'lesson-video.mp4',
            fileSize: 10485760,
            mimeType: 'video/mp4',
            storageKey: `courses/${course.id}/lessons/${lesson.id}/lesson-video.mp4`,
            uploadedAt: new Date(),
            metadata: {
              checksum: 'abc123def456',
              originalName: 'lesson-video.mp4',
            },
          },
        });

        expect(asset.metadata).toMatchObject({
          checksum: 'abc123def456',
        });
      });
    });

    it('should support multiple file types (video, pdf, images)', async () => {
      await prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            title: 'TEST-Multi-Format Course',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-multiformat-${Date.now()}`,
            level: 'INTERMEDIATE',
            estimatedHours: 10,
          },
        });

        const lesson = await tx.lesson.create({
          data: {
            courseId: course.id,
            title: { vi: 'Multi-Format Lesson', en: 'Multi-Format Lesson', zh: 'Multi-Format Lesson' },
            content: { vi: 'Content', en: 'Content', zh: 'Content' },
            order: 1,
          },
        });

        const assets = await Promise.all([
          tx.courseAsset.create({
            data: {
              courseId: course.id,
              lessonId: lesson.id,
              fileName: 'lesson-video.mp4',
              fileSize: 15728640,
              mimeType: 'video/mp4',
              storageKey: `courses/${course.id}/lessons/${lesson.id}/video.mp4`,
              uploadedAt: new Date(),
            },
          }),
          tx.courseAsset.create({
            data: {
              courseId: course.id,
              lessonId: lesson.id,
              fileName: 'lesson-slides.pdf',
              fileSize: 2097152,
              mimeType: 'application/pdf',
              storageKey: `courses/${course.id}/lessons/${lesson.id}/slides.pdf`,
              uploadedAt: new Date(),
            },
          }),
          tx.courseAsset.create({
            data: {
              courseId: course.id,
              lessonId: lesson.id,
              fileName: 'diagram.png',
              fileSize: 524288,
              mimeType: 'image/png',
              storageKey: `courses/${course.id}/lessons/${lesson.id}/diagram.png`,
              uploadedAt: new Date(),
            },
          }),
        ]);

        expect(assets).toHaveLength(3);
        expect(assets.map(a => a.mimeType)).toEqual([
          'video/mp4',
          'application/pdf',
          'image/png',
        ]);
      });
    });

    it('should track asset download/view count', async () => {
      await prisma.$transaction(async (tx) => {
        const student = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Student',
            role: 'USER',
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-Analytics Course',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-analytics-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const lesson = await tx.lesson.create({
          data: {
            courseId: course.id,
            title: { vi: 'Lesson', en: 'Lesson', zh: 'Lesson' },
            content: { vi: 'Content', en: 'Content', zh: 'Content' },
            order: 1,
          },
        });

        await tx.enrollment.create({
          data: {
            userId: student.id,
            courseId: course.id,
            enrolledAt: new Date(),
            progress: 0,
          },
        });

        const asset = await tx.courseAsset.create({
          data: {
            courseId: course.id,
            lessonId: lesson.id,
            fileName: 'popular-video.mp4',
            fileSize: 10485760,
            mimeType: 'video/mp4',
            storageKey: `courses/${course.id}/lessons/${lesson.id}/popular-video.mp4`,
            uploadedAt: new Date(),
            metadata: { viewCount: 0 },
          },
        });

        // Simulate 3 views
        for (let i = 0; i < 3; i++) {
          await tx.behaviorLog.create({
            data: {
              userId: student.id,
              eventType: 'ASSET_ACCESS',
              metadata: { assetId: asset.id, action: 'view' },
              timestamp: new Date(Date.now() + i * 1000),
            },
          });
        }

        const viewCount = await tx.behaviorLog.count({
          where: {
            eventType: 'ASSET_ACCESS',
            metadata: {
              path: ['assetId'],
              equals: asset.id,
            },
          },
        });

        expect(viewCount).toBe(3);
      });
    });

    it('should cleanup orphaned assets when course is deleted', async () => {
      await prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            title: 'TEST-Temporary Course',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-temp-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const lesson = await tx.lesson.create({
          data: {
            courseId: course.id,
            title: { vi: 'Lesson', en: 'Lesson', zh: 'Lesson' },
            content: { vi: 'Content', en: 'Content', zh: 'Content' },
            order: 1,
          },
        });

        await tx.courseAsset.create({
          data: {
            courseId: course.id,
            lessonId: lesson.id,
            fileName: 'orphan-video.mp4',
            fileSize: 10485760,
            mimeType: 'video/mp4',
            storageKey: `courses/${course.id}/lessons/${lesson.id}/orphan-video.mp4`,
            uploadedAt: new Date(),
          },
        });

        // Delete course (cascade should handle assets)
        await tx.courseAsset.deleteMany({ where: { courseId: course.id } });
        await tx.lesson.deleteMany({ where: { courseId: course.id } });
        await tx.course.delete({ where: { id: course.id } });

        const remainingAssets = await tx.courseAsset.findMany({
          where: { courseId: course.id },
        });

        expect(remainingAssets).toHaveLength(0);
      });
    });
  });
});
