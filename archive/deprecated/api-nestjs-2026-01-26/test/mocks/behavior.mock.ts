import { type BehaviorLog, type UserStreak } from '@prisma/client';

/**
 * Mock behavior logs for testing analytics and tracking.
 */
export const mockBehaviorLogs: Omit<BehaviorLog, 'timestamp'>[] = [
  {
    id: 'log-001',
    userId: 'user-student-001',
    sessionId: 'session-001',
    path: '/courses/personal-finance-basics',
    eventType: 'PAGE_VIEW',
    actionCategory: 'LEARNING',
    duration: 120,
    deviceInfo: {
      browser: 'Chrome',
      os: 'Windows',
      screenSize: '1920x1080',
    },
    payload: {
      courseId: 'course-001',
      lessonId: null,
    },
  },
  {
    id: 'log-002',
    userId: 'user-student-001',
    sessionId: 'session-001',
    path: '/lessons/lesson-001-01',
    eventType: 'LESSON_START',
    actionCategory: 'LEARNING',
    duration: 480,
    deviceInfo: {
      browser: 'Chrome',
      os: 'Windows',
      screenSize: '1920x1080',
    },
    payload: {
      courseId: 'course-001',
      lessonId: 'lesson-001-01',
      progress: 0,
    },
  },
  {
    id: 'log-003',
    userId: 'user-student-001',
    sessionId: 'session-001',
    path: '/lessons/lesson-001-01',
    eventType: 'LESSON_COMPLETE',
    actionCategory: 'LEARNING',
    duration: 480,
    deviceInfo: {
      browser: 'Chrome',
      os: 'Windows',
      screenSize: '1920x1080',
    },
    payload: {
      courseId: 'course-001',
      lessonId: 'lesson-001-01',
      progress: 100,
      pointsEarned: 10,
    },
  },
  {
    id: 'log-004',
    userId: 'user-student-002',
    sessionId: 'session-002',
    path: '/portfolio',
    eventType: 'PAGE_VIEW',
    actionCategory: 'PORTFOLIO',
    duration: 300,
    deviceInfo: {
      browser: 'Firefox',
      os: 'MacOS',
      screenSize: '2560x1440',
    },
    payload: {
      portfolioValue: 105000,
    },
  },
  {
    id: 'log-005',
    userId: 'user-student-002',
    sessionId: 'session-002',
    path: '/portfolio/trade',
    eventType: 'TRADE_EXECUTE',
    actionCategory: 'PORTFOLIO',
    duration: 60,
    deviceInfo: {
      browser: 'Firefox',
      os: 'MacOS',
      screenSize: '2560x1440',
    },
    payload: {
      action: 'BUY',
      symbol: 'AAPL',
      quantity: 10,
      price: 175.5,
    },
  },
  {
    id: 'log-006',
    userId: 'user-student-003',
    sessionId: 'session-003',
    path: '/social/feed',
    eventType: 'PAGE_VIEW',
    actionCategory: 'SOCIAL',
    duration: 450,
    deviceInfo: {
      browser: 'Safari',
      os: 'iOS',
      screenSize: '390x844',
    },
    payload: {
      feedType: 'global',
    },
  },
  {
    id: 'log-007',
    userId: 'user-student-003',
    sessionId: 'session-003',
    path: '/social/post/create',
    eventType: 'POST_CREATE',
    actionCategory: 'SOCIAL',
    duration: 120,
    deviceInfo: {
      browser: 'Safari',
      os: 'iOS',
      screenSize: '390x844',
    },
    payload: {
      postType: 'ACHIEVEMENT',
      content: 'Just completed my first course!',
    },
  },
  {
    id: 'log-008',
    userId: 'user-student-004',
    sessionId: 'session-004',
    path: '/checklist',
    eventType: 'CHECKLIST_UPDATE',
    actionCategory: 'GAMIFICATION',
    duration: 90,
    deviceInfo: {
      browser: 'Chrome',
      os: 'Android',
      screenSize: '1080x2400',
    },
    payload: {
      checklistId: 'checklist-001',
      itemsCompleted: 3,
      totalItems: 5,
    },
  },
];

/**
 * Mock user streaks for testing gamification.
 */
export const mockUserStreaks: Omit<
  UserStreak,
  'createdAt' | 'updatedAt' | 'lastActivityDate'
>[] = [
  {
    id: 'streak-001',
    userId: 'user-student-001',
    currentStreak: 7,
    longestStreak: 15,
    streakFrozen: false,
    freezesRemaining: 3,
  },
  {
    id: 'streak-002',
    userId: 'user-student-002',
    currentStreak: 21,
    longestStreak: 21,
    streakFrozen: false,
    freezesRemaining: 5,
  },
  {
    id: 'streak-003',
    userId: 'user-student-003',
    currentStreak: 0,
    longestStreak: 5,
    streakFrozen: false,
    freezesRemaining: 2,
  },
  {
    id: 'streak-004',
    userId: 'user-student-004',
    currentStreak: 45,
    longestStreak: 45,
    streakFrozen: true,
    freezesRemaining: 0,
  },
];

/**
 * Get behavior logs by user ID.
 */
export function getLogsByUserId(
  userId: string,
): Omit<BehaviorLog, 'timestamp'>[] {
  return mockBehaviorLogs.filter((log) => log.userId === userId);
}

/**
 * Get behavior logs by action category.
 */
export function getLogsByCategory(
  category: string,
): Omit<BehaviorLog, 'timestamp'>[] {
  return mockBehaviorLogs.filter((log) => log.actionCategory === category);
}

/**
 * Get streak by user ID.
 */
export function getStreakByUserId(
  userId: string,
):
  | Omit<UserStreak, 'createdAt' | 'updatedAt' | 'lastActivityDate'>
  | undefined {
  return mockUserStreaks.find((streak) => streak.userId === userId);
}

/**
 * Generate a random session ID for testing.
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Create a behavior log entry for testing.
 */
export function createBehaviorLog(
  userId: string,
  eventType: string,
  actionCategory = 'GENERAL',
  payload: Record<string, any> = {},
): Omit<BehaviorLog, 'id' | 'timestamp'> {
  return {
    userId,
    sessionId: generateSessionId(),
    path: '/test-path',
    eventType,
    actionCategory,
    duration: 0,
    deviceInfo: {
      browser: 'Test Browser',
      os: 'Test OS',
    },
    payload,
  };
}
