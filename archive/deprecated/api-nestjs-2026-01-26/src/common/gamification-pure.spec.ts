import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateLevel,
  calculatePoints,
  checkBadges,
  processStreak,
} from './gamification-pure';

describe('Gamification Pure Functions', () => {
  describe('calculatePoints', () => {
    it('should calculate base points with no streak', () => {
      expect(calculatePoints('LESSON_COMPLETED', 0)).toBe(10);
      expect(calculatePoints('QUIZ_PASSED', 0)).toBe(20);
    });

    it('should apply streak bonus correctly', () => {
      // 10 points + (10 * 5 * 0.1) = 15
      expect(calculatePoints('LESSON_COMPLETED', 5)).toBe(15);
      // 20 points + (20 * 10 * 0.1) = 40
      expect(calculatePoints('QUIZ_PASSED', 10)).toBe(40);
    });

    it('should return 0 for unknown actions', () => {
      expect(calculatePoints('UNKNOWN_ACTION' as any, 0)).toBe(0);
    });
  });

  describe('processStreak', () => {
    const now = new Date('2025-12-19T10:00:00Z');

    it('should increment streak if last active was yesterday', () => {
      const yesterday = new Date('2025-12-18T15:00:00Z');
      expect(processStreak(yesterday, now)).toEqual({
        status: 'INCREMENT',
        days: 1,
      });
    });

    it('should maintain streak if active today', () => {
      const earlierToday = new Date('2025-12-19T02:00:00Z');
      expect(processStreak(earlierToday, now)).toEqual({
        status: 'MAINTAIN',
        days: 0,
      });
    });

    it('should reset streak if last active was before yesterday', () => {
      const twoDaysAgo = new Date('2025-12-17T10:00:00Z');
      expect(processStreak(twoDaysAgo, now)).toEqual({
        status: 'RESET',
        days: 0,
      });
    });
  });

  describe('calculateLevel', () => {
    it('should start at level 1', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(50)).toBe(1);
    });

    it('should reach level 2 at 100 points', () => {
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(399)).toBe(2);
    });

    it('should reach level 3 at 400 points', () => {
      expect(calculateLevel(400)).toBe(3);
    });

    it('should handle negative points gracefully', () => {
      expect(calculateLevel(-50)).toBe(1);
    });
  });

  describe('checkBadges', () => {
    it('should return BRONZE_LEARNER when crossing 100 points', () => {
      expect(checkBadges(105, 95)).toContain('BRONZE_LEARNER');
    });

    it('should not return badge if already earned', () => {
      expect(checkBadges(150, 110)).toHaveLength(0);
    });

    it('should return multiple badges if crossing multiple thresholds', () => {
      const badges = checkBadges(1200, 50);
      expect(badges).toContain('BRONZE_LEARNER');
      expect(badges).toContain('SILVER_LEARNER');
      expect(badges).toContain('GOLD_LEARNER');
    });
  });
});
