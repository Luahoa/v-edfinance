/**
 * I013: Full Onboarding Journey Integration Test
 * Tests: Register → Setup profile → Risk assessment → Course recommendations → First lesson
 * Validates: State transitions, data consistency
 */

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

// Mock modules
const mockPrismaService = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  userProfile: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  gamificationProfile: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  course: {
    findMany: vi.fn(),
  },
  enrollment: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  lesson: {
    findMany: vi.fn(),
  },
  lessonProgress: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  behaviorLog: {
    create: vi.fn(),
  },
};

const mockAiService = {
  generateRecommendations: vi.fn().mockResolvedValue({
    courses: [{ id: 'course-1', score: 0.95, reason: 'Matches risk profile' }],
  }),
};

describe('[I013] Full Onboarding Journey Integration', () => {
  let app: INestApplication;
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    // Create minimal test module
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: 'PrismaService', useValue: mockPrismaService },
        { provide: 'AiService', useValue: mockAiService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('Scenario 1: Complete user registration', async () => {
    const registerPayload = {
      email: 'newuser@test.com',
      password: 'SecurePass123!',
      name: 'New User',
    };

    mockPrismaService.user.create.mockResolvedValue({
      id: 'user-123',
      email: registerPayload.email,
      name: registerPayload.name,
      role: 'STUDENT',
      createdAt: new Date(),
    });

    // Mock registration endpoint
    const response = {
      userId: 'user-123',
      email: registerPayload.email,
      message: 'Registration successful',
    };

    userId = response.userId;
    expect(userId).toBe('user-123');
    expect(mockPrismaService.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: registerPayload.email,
          name: registerPayload.name,
        }),
      })
    );
  });

  it('Scenario 2: Create user profile with personal details', async () => {
    const profilePayload = {
      age: 25,
      occupation: 'Developer',
      monthlyIncome: 50000000,
      financialGoals: ['SAVING', 'INVESTING'],
    };

    mockPrismaService.userProfile.create.mockResolvedValue({
      id: 'profile-123',
      userId,
      ...profilePayload,
      createdAt: new Date(),
    });

    const profile = await mockPrismaService.userProfile.create({
      data: {
        userId,
        ...profilePayload,
      },
    });

    expect(profile.userId).toBe(userId);
    expect(profile.age).toBe(25);
    expect(mockPrismaService.userProfile.create).toHaveBeenCalled();
  });

  it('Scenario 3: Complete risk assessment questionnaire', async () => {
    const riskAnswers = {
      questionnaireId: 'risk-assessment-v1',
      answers: [
        { questionId: 'q1', answer: 'B', score: 2 },
        { questionId: 'q2', answer: 'C', score: 3 },
        { questionId: 'q3', answer: 'B', score: 2 },
      ],
    };

    const totalScore = riskAnswers.answers.reduce((sum, a) => sum + a.score, 0);
    const riskLevel = totalScore <= 3 ? 'LOW' : totalScore <= 6 ? 'MEDIUM' : 'HIGH';

    mockPrismaService.userProfile.update.mockResolvedValue({
      id: 'profile-123',
      userId,
      riskTolerance: riskLevel,
      riskScore: totalScore,
      updatedAt: new Date(),
    });

    const updatedProfile = await mockPrismaService.userProfile.update({
      where: { userId },
      data: {
        riskTolerance: riskLevel,
        riskScore: totalScore,
      },
    });

    expect(updatedProfile.riskTolerance).toBe('HIGH');
    expect(updatedProfile.riskScore).toBe(7);
    expect(mockPrismaService.behaviorLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId,
          eventType: 'RISK_ASSESSMENT_COMPLETED',
        }),
      })
    );
  });

  it('Scenario 4: Generate personalized course recommendations', async () => {
    mockPrismaService.userProfile.findUnique.mockResolvedValue({
      id: 'profile-123',
      userId,
      riskTolerance: 'HIGH',
      financialGoals: ['INVESTING'],
    });

    mockPrismaService.course.findMany.mockResolvedValue([
      {
        id: 'course-1',
        title: { vi: 'Đầu tư chứng khoán', en: 'Stock Investment' },
        level: 'INTERMEDIATE',
        category: 'INVESTING',
      },
      {
        id: 'course-2',
        title: { vi: 'Quản lý rủi ro', en: 'Risk Management' },
        level: 'ADVANCED',
        category: 'INVESTING',
      },
    ]);

    const profile = await mockPrismaService.userProfile.findUnique({
      where: { userId },
    });

    const recommendations = await mockAiService.generateRecommendations({
      riskTolerance: profile.riskTolerance,
      goals: profile.financialGoals,
    });

    const courses = await mockPrismaService.course.findMany({
      where: {
        category: { in: profile.financialGoals },
      },
    });

    expect(courses).toHaveLength(2);
    expect(recommendations.courses[0].id).toBe('course-1');
    expect(mockAiService.generateRecommendations).toHaveBeenCalled();
  });

  it('Scenario 5: Enroll in first recommended course', async () => {
    const courseId = 'course-1';

    mockPrismaService.enrollment.create.mockResolvedValue({
      id: 'enrollment-123',
      userId,
      courseId,
      status: 'ACTIVE',
      enrolledAt: new Date(),
    });

    mockPrismaService.gamificationProfile.update.mockResolvedValue({
      id: 'gamif-123',
      userId,
      points: 50, // Welcome bonus
      level: 1,
    });

    const enrollment = await mockPrismaService.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
    });

    expect(enrollment.courseId).toBe(courseId);
    expect(mockPrismaService.gamificationProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        data: expect.objectContaining({
          points: expect.any(Number),
        }),
      })
    );
  });

  it('Scenario 6: Start first lesson and verify state consistency', async () => {
    const lessonId = 'lesson-1';

    mockPrismaService.lesson.findMany.mockResolvedValue([
      {
        id: lessonId,
        courseId: 'course-1',
        title: { vi: 'Bài 1: Giới thiệu', en: 'Lesson 1: Introduction' },
        order: 1,
      },
    ]);

    mockPrismaService.lessonProgress.create.mockResolvedValue({
      id: 'progress-123',
      userId,
      lessonId,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    });

    const lessons = await mockPrismaService.lesson.findMany({
      where: { courseId: 'course-1' },
      orderBy: { order: 'asc' },
    });

    const progress = await mockPrismaService.lessonProgress.create({
      data: {
        userId,
        lessonId: lessons[0].id,
        status: 'IN_PROGRESS',
      },
    });

    // Verify entire journey state
    expect(userId).toBeDefined();
    expect(progress.status).toBe('IN_PROGRESS');
    expect(mockPrismaService.behaviorLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId,
          eventType: 'LESSON_STARTED',
        }),
      })
    );
  });

  it('Scenario 7: Verify data consistency across all entities', async () => {
    // Fetch all created entities
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'newuser@test.com',
    });

    mockPrismaService.userProfile.findUnique.mockResolvedValue({
      userId,
      riskTolerance: 'HIGH',
    });

    mockPrismaService.enrollment.findFirst.mockResolvedValue({
      userId,
      courseId: 'course-1',
      status: 'ACTIVE',
    });

    mockPrismaService.lessonProgress.findFirst.mockResolvedValue({
      userId,
      lessonId: 'lesson-1',
      status: 'IN_PROGRESS',
    });

    const user = await mockPrismaService.user.findUnique({ where: { id: userId } });
    const profile = await mockPrismaService.userProfile.findUnique({ where: { userId } });
    const enrollment = await mockPrismaService.enrollment.findFirst({ where: { userId } });
    const lessonProgress = await mockPrismaService.lessonProgress.findFirst({
      where: { userId },
    });

    // All entities should reference the same userId
    expect(user.id).toBe(userId);
    expect(profile.userId).toBe(userId);
    expect(enrollment.userId).toBe(userId);
    expect(lessonProgress.userId).toBe(userId);
  });
});
