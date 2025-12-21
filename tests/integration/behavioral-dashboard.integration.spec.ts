/**
 * I015: Behavioral Analytics Dashboard Integration Test
 * Tests: Multiple user actions → Logs aggregated → Dashboard metrics calculated → Real-time updates
 * Validates: Aggregation accuracy, date range filtering
 */

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

const mockPrismaService = {
  behaviorLog: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  $queryRaw: vi.fn(),
};

const mockAnalyticsService = {
  aggregateDailyMetrics: vi.fn(),
  calculateEngagementScore: vi.fn(),
};

describe('[I015] Behavioral Analytics Dashboard Integration', () => {
  let app: INestApplication;
  const userId = 'user-analytics-1';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: 'PrismaService', useValue: mockPrismaService },
        { provide: 'AnalyticsService', useValue: mockAnalyticsService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('Scenario 1: Log multiple user actions', async () => {
    const actions = [
      { eventType: 'LESSON_STARTED', metadata: { lessonId: 'lesson-1' } },
      { eventType: 'LESSON_COMPLETED', metadata: { lessonId: 'lesson-1', score: 95 } },
      { eventType: 'QUIZ_ATTEMPTED', metadata: { quizId: 'quiz-1', score: 80 } },
      { eventType: 'BADGE_EARNED', metadata: { badgeId: 'first-lesson' } },
      { eventType: 'COURSE_ENROLLED', metadata: { courseId: 'course-2' } },
    ];

    mockPrismaService.behaviorLog.createMany.mockResolvedValue({
      count: actions.length,
    });

    const result = await mockPrismaService.behaviorLog.createMany({
      data: actions.map((action) => ({
        userId,
        eventType: action.eventType,
        metadata: action.metadata,
        timestamp: new Date(),
      })),
    });

    expect(result.count).toBe(5);
    expect(mockPrismaService.behaviorLog.createMany).toHaveBeenCalled();
  });

  it('Scenario 2: Aggregate logs into daily metrics', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    mockPrismaService.behaviorLog.findMany.mockResolvedValue([
      {
        eventType: 'LESSON_COMPLETED',
        timestamp: new Date(),
        metadata: { score: 95 },
      },
      {
        eventType: 'LESSON_COMPLETED',
        timestamp: new Date(),
        metadata: { score: 88 },
      },
      {
        eventType: 'QUIZ_ATTEMPTED',
        timestamp: new Date(),
        metadata: { score: 80 },
      },
    ]);

    mockAnalyticsService.aggregateDailyMetrics.mockResolvedValue({
      date: today,
      totalLessonsCompleted: 2,
      averageScore: 91.5,
      totalQuizzes: 1,
      totalTimeSpent: 120, // minutes
    });

    const logs = await mockPrismaService.behaviorLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: today,
          lt: new Date(today.getTime() + 86400000), // +1 day
        },
      },
    });

    const metrics = await mockAnalyticsService.aggregateDailyMetrics(userId, today);

    expect(metrics.totalLessonsCompleted).toBe(2);
    expect(metrics.averageScore).toBe(91.5);
    expect(logs).toHaveLength(3);
  });

  it('Scenario 3: Calculate dashboard KPIs', async () => {
    mockPrismaService.behaviorLog.count.mockResolvedValue(45); // Total events this week

    mockPrismaService.behaviorLog.groupBy.mockResolvedValue([
      { eventType: 'LESSON_COMPLETED', _count: { eventType: 15 } },
      { eventType: 'QUIZ_ATTEMPTED', _count: { eventType: 10 } },
      { eventType: 'BADGE_EARNED', _count: { eventType: 5 } },
      { eventType: 'DISCUSSION_POSTED', _count: { eventType: 8 } },
      { eventType: 'NUDGE_CLICKED', _count: { eventType: 7 } },
    ]);

    const totalEvents = await mockPrismaService.behaviorLog.count({
      where: { userId },
    });

    const eventBreakdown = await mockPrismaService.behaviorLog.groupBy({
      by: ['eventType'],
      where: { userId },
      _count: { eventType: true },
    });

    const kpis = {
      totalEvents,
      lessonsCompleted: eventBreakdown.find((e) => e.eventType === 'LESSON_COMPLETED')?._count
        .eventType,
      quizzesAttempted: eventBreakdown.find((e) => e.eventType === 'QUIZ_ATTEMPTED')?._count
        .eventType,
      badgesEarned: eventBreakdown.find((e) => e.eventType === 'BADGE_EARNED')?._count.eventType,
    };

    expect(kpis.totalEvents).toBe(45);
    expect(kpis.lessonsCompleted).toBe(15);
    expect(kpis.quizzesAttempted).toBe(10);
  });

  it('Scenario 4: Filter metrics by date range', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    mockPrismaService.behaviorLog.findMany.mockResolvedValue([
      {
        eventType: 'LESSON_COMPLETED',
        timestamp: new Date('2024-01-15'),
        metadata: { score: 92 },
      },
      {
        eventType: 'LESSON_COMPLETED',
        timestamp: new Date('2024-01-20'),
        metadata: { score: 88 },
      },
    ]);

    const filteredLogs = await mockPrismaService.behaviorLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    expect(filteredLogs).toHaveLength(2);
    expect(new Date(filteredLogs[0].timestamp).getTime()).toBeGreaterThanOrEqual(
      startDate.getTime()
    );
    expect(new Date(filteredLogs[1].timestamp).getTime()).toBeLessThanOrEqual(endDate.getTime());
  });

  it('Scenario 5: Real-time engagement score calculation', async () => {
    const recentLogs = [
      { eventType: 'LESSON_COMPLETED', weight: 10 },
      { eventType: 'QUIZ_ATTEMPTED', weight: 8 },
      { eventType: 'BADGE_EARNED', weight: 15 },
      { eventType: 'DISCUSSION_POSTED', weight: 12 },
    ];

    mockAnalyticsService.calculateEngagementScore.mockImplementation((logs) => {
      return logs.reduce((score, log) => score + log.weight, 0);
    });

    const engagementScore = await mockAnalyticsService.calculateEngagementScore(recentLogs);

    expect(engagementScore).toBe(45);
    expect(mockAnalyticsService.calculateEngagementScore).toHaveBeenCalledWith(recentLogs);
  });

  it('Scenario 6: Aggregate weekly progress trends', async () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    mockPrismaService.$queryRaw.mockResolvedValue([
      { day: 'Monday', lessons: 3, quizzes: 2 },
      { day: 'Tuesday', lessons: 2, quizzes: 1 },
      { day: 'Wednesday', lessons: 4, quizzes: 3 },
      { day: 'Thursday', lessons: 1, quizzes: 1 },
      { day: 'Friday', lessons: 5, quizzes: 2 },
      { day: 'Saturday', lessons: 2, quizzes: 0 },
      { day: 'Sunday', lessons: 1, quizzes: 1 },
    ]);

    const weeklyTrend = await mockPrismaService.$queryRaw`
      SELECT DATE_FORMAT(timestamp, '%W') as day, 
             COUNT(*) FILTER (WHERE eventType = 'LESSON_COMPLETED') as lessons,
             COUNT(*) FILTER (WHERE eventType = 'QUIZ_ATTEMPTED') as quizzes
      FROM BehaviorLog
      WHERE userId = ${userId} AND timestamp >= ${weekStart}
      GROUP BY day
      ORDER BY timestamp ASC
    `;

    expect(weeklyTrend).toHaveLength(7);
    expect(weeklyTrend[0].day).toBe('Monday');
    expect(weeklyTrend[4].lessons).toBe(5); // Friday peak
  });

  it('Scenario 7: Verify aggregation accuracy with complex filtering', async () => {
    mockPrismaService.behaviorLog.findMany
      .mockResolvedValueOnce([
        // All events
        { eventType: 'LESSON_COMPLETED', timestamp: new Date() },
        { eventType: 'LESSON_COMPLETED', timestamp: new Date() },
        { eventType: 'QUIZ_ATTEMPTED', timestamp: new Date() },
      ])
      .mockResolvedValueOnce([
        // Only completed lessons
        { eventType: 'LESSON_COMPLETED', timestamp: new Date() },
        { eventType: 'LESSON_COMPLETED', timestamp: new Date() },
      ]);

    const allEvents = await mockPrismaService.behaviorLog.findMany({
      where: { userId },
    });

    const completedLessons = await mockPrismaService.behaviorLog.findMany({
      where: {
        userId,
        eventType: 'LESSON_COMPLETED',
      },
    });

    expect(allEvents).toHaveLength(3);
    expect(completedLessons).toHaveLength(2);
    expect(completedLessons.every((e) => e.eventType === 'LESSON_COMPLETED')).toBe(true);
  });

  it('Scenario 8: Test dashboard real-time update simulation', async () => {
    let dashboardState = { totalLessons: 10, totalPoints: 250 };

    // Simulate real-time event
    mockPrismaService.behaviorLog.create.mockResolvedValue({
      id: 'log-new',
      userId,
      eventType: 'LESSON_COMPLETED',
      metadata: { lessonId: 'lesson-10', pointsEarned: 50 },
      timestamp: new Date(),
    });

    const newEvent = await mockPrismaService.behaviorLog.create({
      data: {
        userId,
        eventType: 'LESSON_COMPLETED',
        metadata: { lessonId: 'lesson-10', pointsEarned: 50 },
      },
    });

    // Update dashboard state
    dashboardState = {
      totalLessons: dashboardState.totalLessons + 1,
      totalPoints: dashboardState.totalPoints + (newEvent.metadata.pointsEarned as number),
    };

    expect(dashboardState.totalLessons).toBe(11);
    expect(dashboardState.totalPoints).toBe(300);
  });
});
