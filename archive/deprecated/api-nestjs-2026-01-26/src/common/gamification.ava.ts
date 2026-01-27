import test from 'ava';
import {
  calculateLevel,
  calculatePoints,
  processStreak,
} from './gamification-pure';

test('calculatePoints: base points for lesson', (t) => {
  const points = calculatePoints('LESSON_COMPLETED', 0);
  t.is(points, 10);
});

test('calculatePoints: bonus points with 5 day streak', (t) => {
  // 10 base + (10 * 5 * 0.1) = 15
  const points = calculatePoints('LESSON_COMPLETED', 5);
  t.is(points, 15);
});

test('processStreak: increments on consecutive days', (t) => {
  const now = new Date('2025-12-21');
  const last = new Date('2025-12-20');
  const result = processStreak(last, now);
  t.is(result.status, 'INCREMENT');
  t.is(result.days, 1);
});

test('processStreak: resets on gap', (t) => {
  const now = new Date('2025-12-21');
  const last = new Date('2025-12-18');
  const result = processStreak(last, now);
  t.is(result.status, 'RESET');
});

test('calculateLevel: level 1 at 0 points', (t) => {
  t.is(calculateLevel(0), 1);
});

test('calculateLevel: level 2 at 100 points', (t) => {
  t.is(calculateLevel(100), 2);
});

test('calculateLevel: level 3 at 400 points', (t) => {
  t.is(calculateLevel(400), 3);
});
