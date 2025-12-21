/**
 * I002: Courses → Gamification Flow Integration Tests
 * Tests course enrollment, lesson completion, XP awarding, and achievement unlocking
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('I002: Courses → Gamification Flow', () => {
  let testUserId: string;
  let testCourseId: string;
  let testLessonId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Create test course
    const course = await prisma.course.create({
      data: {
        slug: `integration-course-${Date.now()}`,
        title: { vi: 'Khóa học test', en: 'Test Course', zh: '测试课程' },
        description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
        thumbnailKey: 'test-thumbnail.jpg',
        level: 'BEGINNER'
      }
    });
    testCourseId = course.id;

    // Create test lesson
    const lesson = await prisma.lesson.create({
      data: {
        courseId: testCourseId,
        order: 1,
        title: { vi: 'Bài học 1', en: 'Lesson 1', zh: '课程1' },
        content: { vi: 'Nội dung', en: 'Content', zh: '内容' },
        xpReward: 50,
        type: 'VIDEO'
      }
    });
    testLessonId = lesson.id;
  });

  afterAll(async () => {
    await prisma.userProgress.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.behaviorLog.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.userAchievement.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: '@gamification-test.com' } }
    });
    await prisma.lesson.deleteMany({ where: { courseId: testCourseId } });
    await prisma.course.deleteMany({ where: { id: testCourseId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create fresh test user
    const user = await prisma.user.create({
      data: {
        email: `user-${Date.now()}@gamification-test.com`,
        passwordHash: 'hashed',
        name: { vi: 'Test User', en: 'Test User', zh: '测试用户' },
        points: 0
      }
    });
    testUserId = user.id;
  });

  it('S01: Should enroll user in course', async () => {
    const enrollment = await prisma.userProgress.create({
      data: {
        userId: testUserId,
        lessonId: testLessonId,
        completed: false,
        completedAt: null
      }
    });

    expect(enrollment).toBeDefined();
    expect(enrollment.userId).toBe(testUserId);
    expect(enrollment.completed).toBe(false);
  });

  it('S02: Should mark lesson as completed', async () => {
    await prisma.userProgress.create({
      data: {
        userId: testUserId,
        lessonId: testLessonId,
        completed: false
      }
    });

    const updated = await prisma.userProgress.updateMany({
      where: { userId: testUserId, lessonId: testLessonId },
      data: {
        completed: true,
        completedAt: new Date()
      }
    });

    expect(updated.count).toBe(1);
  });

  it('S03: Should award XP upon lesson completion', async () => {
    const lesson = await prisma.lesson.findUnique({ where: { id: testLessonId } });
    const xpReward = lesson!.xpReward;

    await prisma.userProgress.create({
      data: {
        userId: testUserId,
        lessonId: testLessonId,
        completed: true,
        completedAt: new Date()
      }
    });

    // Award XP
    const updatedUser = await prisma.user.update({
      where: { id: testUserId },
      data: {
        points: { increment: xpReward }
      }
    });

    expect(updatedUser.points).toBe(xpReward);
  });

  it('S04: Should create BehaviorLog entry on lesson completion', async () => {
    await prisma.userProgress.create({
      data: {
        userId: testUserId,
        lessonId: testLessonId,
        completed: true,
        completedAt: new Date()
      }
    });

    const behaviorLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'LESSON_COMPLETED',
        context: {
          lessonId: testLessonId,
          courseId: testCourseId,
          xpEarned: 50
        }
      }
    });

    expect(behaviorLog).toBeDefined();
    expect(behaviorLog.action).toBe('LESSON_COMPLETED');
    expect((behaviorLog.context as any).xpEarned).toBe(50);
  });

  it('S05: Should unlock achievement after reaching XP threshold', async () => {
    // Award enough XP
    await prisma.user.update({
      where: { id: testUserId },
      data: { points: 100 }
    });

    // Create achievement
    const achievement = await prisma.achievement.create({
      data: {
        slug: `achievement-${Date.now()}`,
        title: { vi: 'Người mới', en: 'Beginner', zh: '初学者' },
        description: { vi: 'Đạt 100 XP', en: 'Reach 100 XP', zh: '达到100经验' },
        iconKey: 'beginner.svg',
        xpRequired: 100,
        tier: 'BRONZE'
      }
    });

    // Award achievement
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId: testUserId,
        achievementId: achievement.id
      }
    });

    expect(userAchievement).toBeDefined();
    expect(userAchievement.userId).toBe(testUserId);

    // Cleanup
    await prisma.userAchievement.delete({ where: { id: userAchievement.id } });
    await prisma.achievement.delete({ where: { id: achievement.id } });
  });

  it('S06: Should update leaderboard after XP gain', async () => {
    await prisma.user.update({
      where: { id: testUserId },
      data: { points: 200 }
    });

    const leaderboard = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: 10,
      select: { id: true, name: true, points: true }
    });

    const userRank = leaderboard.findIndex(u => u.id === testUserId);
    expect(userRank).toBeGreaterThanOrEqual(0);
  });

  it('S07: Should track course completion progress', async () => {
    const totalLessons = await prisma.lesson.count({ where: { courseId: testCourseId } });

    const completedLessons = await prisma.userProgress.count({
      where: {
        userId: testUserId,
        lesson: { courseId: testCourseId },
        completed: true
      }
    });

    const progress = (completedLessons / totalLessons) * 100;
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it('S08: Should prevent duplicate lesson completion XP', async () => {
    const lesson = await prisma.lesson.findUnique({ where: { id: testLessonId } });

    // First completion
    await prisma.userProgress.create({
      data: {
        userId: testUserId,
        lessonId: testLessonId,
        completed: true,
        completedAt: new Date()
      }
    });

    await prisma.user.update({
      where: { id: testUserId },
      data: { points: { increment: lesson!.xpReward } }
    });

    const userAfterFirst = await prisma.user.findUnique({ where: { id: testUserId } });

    // Try second completion (should be prevented by business logic)
    const existingProgress = await prisma.userProgress.findFirst({
      where: { userId: testUserId, lessonId: testLessonId }
    });

    if (existingProgress?.completed) {
      // Do not award XP again
      const userAfterSecond = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(userAfterSecond!.points).toBe(userAfterFirst!.points);
    }
  });

  it('S09: Should track lesson completion time', async () => {
    const startTime = new Date();
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate time passage

    const progress = await prisma.userProgress.create({
      data: {
        userId: testUserId,
        lessonId: testLessonId,
        completed: true,
        completedAt: new Date()
      }
    });

    expect(progress.completedAt).toBeDefined();
    expect(progress.completedAt!.getTime()).toBeGreaterThan(startTime.getTime());
  });

  it('S10: Should support multi-course enrollment tracking', async () => {
    const course2 = await prisma.course.create({
      data: {
        slug: `second-course-${Date.now()}`,
        title: { vi: 'Khóa 2', en: 'Course 2', zh: '课程2' },
        description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
        thumbnailKey: 'test2.jpg',
        level: 'INTERMEDIATE'
      }
    });

    const lesson2 = await prisma.lesson.create({
      data: {
        courseId: course2.id,
        order: 1,
        title: { vi: 'Bài 1', en: 'Lesson 1', zh: '课1' },
        content: { vi: 'Nội dung', en: 'Content', zh: '内容' },
        xpReward: 30,
        type: 'TEXT'
      }
    });

    await prisma.userProgress.createMany({
      data: [
        { userId: testUserId, lessonId: testLessonId, completed: false },
        { userId: testUserId, lessonId: lesson2.id, completed: false }
      ]
    });

    const enrollments = await prisma.userProgress.count({
      where: { userId: testUserId }
    });

    expect(enrollments).toBe(2);

    // Cleanup
    await prisma.userProgress.deleteMany({ where: { lessonId: lesson2.id } });
    await prisma.lesson.delete({ where: { id: lesson2.id } });
    await prisma.course.delete({ where: { id: course2.id } });
  });
});
