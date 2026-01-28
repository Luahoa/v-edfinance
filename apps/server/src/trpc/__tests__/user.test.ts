import { describe, it, expect, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  createTestCaller,
  createAuthenticatedContext,
  createUnauthenticatedContext,
  createMockDb,
  createMockUser,
  vi,
} from './test-helpers';

describe('userRouter', () => {
  describe('testDb', () => {
    it('should return user count from database', async () => {
      const mockDb = createMockDb();
      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: 42 }]),
      });
      mockDb.select = selectMock;

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.user.testDb();

      expect(result.success).toBe(true);
      expect(result.userCount).toBe(42);
    });

    it('should handle database errors gracefully', async () => {
      const mockDb = createMockDb();
      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockRejectedValue(new Error('Connection failed')),
      });
      mockDb.select = selectMock;

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.user.testDb();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('me', () => {
    it('should return current user profile when authenticated', async () => {
      const mockUser = createMockUser({ points: 500 });
      const mockDb = createMockDb();
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      const ctx = createAuthenticatedContext({ id: mockUser.id }, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.user.me();

      expect(result).toEqual(mockUser);
      expect(mockDb.query.users.findFirst).toHaveBeenCalled();
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(caller.user.me()).rejects.toThrow(TRPCError);
      await expect(caller.user.me()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('getById', () => {
    it('should return public user profile by ID', async () => {
      const mockUser = createMockUser();
      const publicProfile = {
        id: mockUser.id,
        name: mockUser.name,
        role: mockUser.role,
        points: mockUser.points,
        createdAt: mockUser.createdAt,
      };
      const mockDb = createMockDb();
      mockDb.query.users.findFirst.mockResolvedValue(publicProfile);

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.user.getById({ id: mockUser.id });

      expect(result).toEqual(publicProfile);
    });

    it('should return null for non-existent user', async () => {
      const mockDb = createMockDb();
      mockDb.query.users.findFirst.mockResolvedValue(null);

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.user.getById({ id: 'non-existent-id' });

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user name when authenticated', async () => {
      const mockUser = createMockUser();
      const updatedUser = {
        ...mockUser,
        name: { vi: 'Tên mới', en: 'New Name' },
        updatedAt: new Date(),
      };

      const mockDb = createMockDb();
      const updateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedUser]),
      };
      mockDb.update = vi.fn().mockReturnValue(updateChain);

      const ctx = createAuthenticatedContext({ id: mockUser.id }, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.user.updateProfile({
        name: { vi: 'Tên mới', en: 'New Name' },
      });

      expect(result).toEqual(updatedUser);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should update preferred locale', async () => {
      const mockUser = createMockUser();
      const updatedUser = {
        ...mockUser,
        preferredLocale: 'en',
        updatedAt: new Date(),
      };

      const mockDb = createMockDb();
      const updateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedUser]),
      };
      mockDb.update = vi.fn().mockReturnValue(updateChain);

      const ctx = createAuthenticatedContext({ id: mockUser.id }, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.user.updateProfile({
        preferredLocale: 'en',
      });

      expect(result.preferredLocale).toBe('en');
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(
        caller.user.updateProfile({ name: { en: 'Test' } })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getStats', () => {
    it('should return dashboard stats for authenticated user', async () => {
      const mockUser = createMockUser({ points: 250 });
      const mockDb = createMockDb();

      mockDb.query.users.findFirst.mockResolvedValue({ points: 250 });
      mockDb.query.userStreaks.findFirst.mockResolvedValue({
        currentStreak: 7,
      });

      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { enrolledCoursesCount: 5, completedLessonsCount: 12 },
        ]),
      };
      mockDb.select = vi.fn().mockReturnValue(selectChain);

      const ctx = createAuthenticatedContext({ id: mockUser.id }, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.user.getStats();

      expect(result).toEqual({
        enrolledCoursesCount: 5,
        completedLessonsCount: 12,
        points: 250,
        streak: 7,
      });
    });

    it('should return zero values when no data exists', async () => {
      const mockDb = createMockDb();

      mockDb.query.users.findFirst.mockResolvedValue(null);
      mockDb.query.userStreaks.findFirst.mockResolvedValue(null);

      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{}]),
      };
      mockDb.select = vi.fn().mockReturnValue(selectChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.user.getStats();

      expect(result.points).toBe(0);
      expect(result.streak).toBe(0);
    });
  });
});
