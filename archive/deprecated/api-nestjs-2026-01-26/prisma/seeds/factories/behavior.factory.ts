import { copycat } from '@snaplet/copycat';

const EVENT_TYPES = [
  'page_view',
  'lesson_start',
  'lesson_complete',
  'video_play',
  'video_pause',
  'quiz_submit',
  'achievement_view',
  'chat_open',
  'portfolio_view',
  'simulation_start',
  'simulation_decision',
];

const ACTION_CATEGORIES = ['LEARNING', 'GAMIFICATION', 'SOCIAL', 'SIMULATION', 'NAVIGATION', 'GENERAL'];

const PATHS = [
  '/courses',
  '/courses/tai-chinh-101',
  '/lessons/abc123',
  '/dashboard',
  '/portfolio',
  '/achievements',
  '/chat',
  '/simulate',
  '/social',
  '/profile',
];

const USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'Mozilla/5.0 (Linux; Android 13)',
];

const SCREEN_SIZES = ['375x812', '1920x1080', '1440x900', '393x873'];

export function createBehaviorLogData(
  index: number,
  userId: string,
  sessionId: string,
  timestamp: Date,
) {
  const eventType = copycat.oneOf(index, EVENT_TYPES);
  const path = copycat.oneOf(index * 2, PATHS);

  const duration =
    eventType === 'lesson_complete'
      ? copycat.int(index, { min: 300, max: 1800 })
      : eventType === 'video_play'
        ? copycat.int(index, { min: 30, max: 600 })
        : copycat.int(index, { min: 1, max: 30 });

  let payload: Record<string, unknown> | null = null;
  if (eventType === 'quiz_submit') {
    payload = {
      score: copycat.int(index, { min: 0, max: 100 }),
      attempts: copycat.int(index, { min: 1, max: 3 }),
    };
  } else if (eventType === 'simulation_decision') {
    payload = {
      decision: copycat.oneOf(index, ['buy', 'sell', 'hold']),
      amount: copycat.int(index, { min: 1000, max: 50000 }),
    };
  }

  return {
    id: copycat.uuid(`behavior-${index}-${userId}`).toString(),
    userId,
    sessionId,
    path,
    eventType,
    actionCategory: copycat.oneOf(index * 3, ACTION_CATEGORIES),
    duration,
    deviceInfo: {
      userAgent: copycat.oneOf(index, USER_AGENTS),
      screenSize: copycat.oneOf(index * 4, SCREEN_SIZES),
    },
    payload,
    timestamp,
  };
}

export function generateUserBehaviorSession(
  userId: string,
  baseDate: Date,
  activityLevel: 'low' | 'medium' | 'high',
) {
  const sessionId = copycat.uuid(userId + baseDate.toISOString()).toString();
  const eventCounts = { low: 3, medium: 8, high: 20 };
  const count = Math.max(1, eventCounts[activityLevel] + copycat.int(userId, { min: -2, max: 5 }));

  const logs = [];
  let currentTime = new Date(baseDate);

  for (let i = 0; i < count; i++) {
    logs.push(createBehaviorLogData(i, userId, sessionId, currentTime));
    currentTime = new Date(currentTime.getTime() + copycat.int(i, { min: 5000, max: 300000 }));
  }

  return logs;
}

export function generateBehaviorLogsForUsers(
  userIds: string[],
  days: number,
  activityDistribution: { low: number; medium: number; high: number } = {
    low: 0.3,
    medium: 0.5,
    high: 0.2,
  },
) {
  const allLogs: ReturnType<typeof createBehaviorLogData>[] = [];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(copycat.int(dayOffset, { min: 8, max: 22 }), 0, 0, 0);

    for (const userId of userIds) {
      const rand = Math.random();
      let activityLevel: 'low' | 'medium' | 'high';
      if (rand < activityDistribution.low) {
        activityLevel = 'low';
      } else if (rand < activityDistribution.low + activityDistribution.medium) {
        activityLevel = 'medium';
      } else {
        activityLevel = 'high';
      }

      const sessionLogs = generateUserBehaviorSession(userId, date, activityLevel);
      allLogs.push(...sessionLogs);
    }
  }

  return allLogs;
}
