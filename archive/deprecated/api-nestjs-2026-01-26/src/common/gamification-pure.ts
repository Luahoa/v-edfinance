/**
 * Pure functions for Gamification logic
 * No side effects, no DB calls - easy to test
 */

export interface UserStats {
  points: number;
  streakDays: number;
  lastActive: Date | string;
  level: number;
}

export const POINTS_CONFIG = {
  LESSON_COMPLETED: 10,
  QUIZ_PASSED: 20,
  DAILY_LOGIN: 5,
  STREAK_BONUS_MULTIPLIER: 0.1, // 10% bonus per streak day
};

/**
 * Calculate points earned based on action and current streak
 */
export function calculatePoints(
  action: keyof typeof POINTS_CONFIG,
  currentStreak = 0,
): number {
  const basePoints = POINTS_CONFIG[action] || 0;
  if (typeof basePoints !== 'number') return 0;

  const bonus = Math.floor(
    basePoints * currentStreak * POINTS_CONFIG.STREAK_BONUS_MULTIPLIER,
  );
  return basePoints + bonus;
}

/**
 * Determine if streak should be incremented, maintained, or reset
 */
export function processStreak(
  lastActive: Date | string,
  now: Date = new Date(),
): { status: 'INCREMENT' | 'MAINTAIN' | 'RESET'; days: number } {
  const last = new Date(lastActive);
  const today = new Date(now);

  // Reset time to midnight for comparison
  last.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffInDays = Math.floor(
    (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays === 0) return { status: 'MAINTAIN', days: 0 };
  if (diffInDays === 1) return { status: 'INCREMENT', days: 1 };
  return { status: 'RESET', days: 0 };
}

/**
 * Calculate level based on total points
 * Level 1: 0-99, Level 2: 100-299, Level 3: 300-599, etc.
 * Formula: Level = floor(sqrt(points / 100)) + 1
 */
export function calculateLevel(points: number): number {
  if (points < 0) return 1;
  return Math.floor(Math.sqrt(points / 100)) + 1;
}

/**
 * Check if user earned a new badge
 */
export function checkBadges(points: number, oldPoints: number): string[] {
  const milestones = [
    { threshold: 100, id: 'BRONZE_LEARNER' },
    { threshold: 500, id: 'SILVER_LEARNER' },
    { threshold: 1000, id: 'GOLD_LEARNER' },
  ];

  return milestones
    .filter((m) => points >= m.threshold && oldPoints < m.threshold)
    .map((m) => m.id);
}
