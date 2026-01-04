import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from '../../../src/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      investmentProfile: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      userProgress: {
        findMany: vi.fn(),
        groupBy: vi.fn(),
      },
      userAchievement: {
        count: vi.fn(),
      },
    };
    service = new UsersService(prisma);
  });

  describe('getDashboardStats', () => {
    it('should calculate stats correctly', async () => {
      const userId = 'user-1';
      prisma.user.findUnique.mockResolvedValue({ points: 100 });
      prisma.userProgress.groupBy.mockResolvedValue([
        {
          status: 'COMPLETED',
          _count: { _all: 2 },
          _sum: { durationSpent: 100 },
        },
        {
          status: 'IN_PROGRESS',
          _count: { _all: 1 },
          _sum: { durationSpent: 30 },
        },
      ]);
      prisma.userProgress.findMany.mockResolvedValue([
        { lesson: { courseId: 'c1' } },
        { lesson: { courseId: 'c1' } },
        { lesson: { courseId: 'c2' } },
      ]);
      prisma.userAchievement.count.mockResolvedValue(2);

      const stats = await service.getDashboardStats(userId);

      expect(stats.points).toBe(100);
      expect(stats.enrolledCoursesCount).toBe(2);
      expect(stats.completedLessonsCount).toBe(2);
      expect(stats.badgesCount).toBe(2);
      expect(stats.totalDurationSpent).toBe(130);
    });
  });
});
