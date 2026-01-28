import { describe, it, expect } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  createTestCaller,
  createAuthenticatedContext,
  createUnauthenticatedContext,
  createMockDb,
  vi,
} from './test-helpers';

const mockQuiz = {
  id: 'quiz-1',
  lessonId: 'lesson-1',
  title: { vi: 'Bài kiểm tra 1', en: 'Quiz 1' },
  published: true,
  passingScore: 70,
  questions: [
    {
      id: 'q-1',
      quizId: 'quiz-1',
      order: 1,
      points: 10,
      correctAnswer: 'A',
    },
    {
      id: 'q-2',
      quizId: 'quiz-1',
      order: 2,
      points: 10,
      correctAnswer: 'B',
    },
  ],
};

describe('quizRouter', () => {
  describe('getById', () => {
    it('should return quiz with questions', async () => {
      const mockDb = createMockDb();
      mockDb.query.quizzes.findFirst.mockResolvedValue(mockQuiz);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.quiz.getById({ id: 'quiz-1' });

      expect(result).toEqual(mockQuiz);
      expect(result?.questions).toHaveLength(2);
    });

    it('should return null for non-existent quiz', async () => {
      const mockDb = createMockDb();
      mockDb.query.quizzes.findFirst.mockResolvedValue(null);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.quiz.getById({ id: 'non-existent' });

      expect(result).toBeNull();
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(caller.quiz.getById({ id: 'quiz-1' })).rejects.toThrow(
        TRPCError
      );
    });
  });

  describe('getByLesson', () => {
    it('should return published quizzes for a lesson', async () => {
      const mockDb = createMockDb();
      mockDb.query.quizzes.findMany.mockResolvedValue([mockQuiz]);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.quiz.getByLesson({ lessonId: 'lesson-1' });

      expect(result).toHaveLength(1);
      expect(result[0].lessonId).toBe('lesson-1');
    });

    it('should return empty array when no quizzes', async () => {
      const mockDb = createMockDb();
      mockDb.query.quizzes.findMany.mockResolvedValue([]);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.quiz.getByLesson({ lessonId: 'lesson-x' });

      expect(result).toEqual([]);
    });
  });

  describe('submit', () => {
    it('should calculate score and create attempt record', async () => {
      const mockDb = createMockDb();
      mockDb.query.quizzes.findFirst.mockResolvedValue(mockQuiz);

      const mockAttempt = {
        id: 'attempt-1',
        userId: 'test-user-id',
        quizId: 'quiz-1',
        score: 10,
        percentage: 50,
        answers: { 'q-1': 'A', 'q-2': 'C' },
        completedAt: new Date(),
      };

      const insertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockAttempt]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.quiz.submit({
        quizId: 'quiz-1',
        answers: { 'q-1': 'A', 'q-2': 'C' },
      });

      expect(result.quizId).toBe('quiz-1');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw error for non-existent quiz', async () => {
      const mockDb = createMockDb();
      mockDb.query.quizzes.findFirst.mockResolvedValue(null);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      await expect(
        caller.quiz.submit({ quizId: 'non-existent', answers: {} })
      ).rejects.toThrow('Quiz not found');
    });
  });

  describe('getAttempts', () => {
    it('should return user attempts for a quiz', async () => {
      const mockAttempts = [
        { id: 'attempt-1', score: 80, percentage: 80, completedAt: new Date() },
        { id: 'attempt-2', score: 90, percentage: 90, completedAt: new Date() },
      ];

      const mockDb = createMockDb();
      mockDb.query.quizAttempts.findMany.mockResolvedValue(mockAttempts);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.quiz.getAttempts({ quizId: 'quiz-1' });

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no attempts', async () => {
      const mockDb = createMockDb();
      mockDb.query.quizAttempts.findMany.mockResolvedValue([]);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.quiz.getAttempts({ quizId: 'quiz-1' });

      expect(result).toEqual([]);
    });
  });
});
