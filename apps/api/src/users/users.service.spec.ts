import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtBlacklistService } from '../auth/jwt-blacklist.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
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
      refreshToken: {
        updateMany: vi.fn(),
      },
    };

    const mockJwtBlacklistService = {
      blacklistAllUserTokens: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtBlacklistService, useValue: mockJwtBlacklistService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should find user by email', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('test@example.com');
      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { investmentProfile: true },
      });
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { investmentProfile: true },
      });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userInput = { email: 'new@example.com', passwordHash: 'hash' };
      const mockUser = { id: '2', ...userInput };
      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(userInput as any);
      expect(result).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: userInput,
      });
    });
  });

  describe('getDashboardStats', () => {
    it('should return correct stats', async () => {
      prismaService.user.findUnique.mockResolvedValue({ points: 100 });
      prismaService.userProgress.groupBy.mockResolvedValue([
        {
          status: 'COMPLETED',
          _count: { _all: 1 },
          _sum: { durationSpent: 60 },
        },
        {
          status: 'IN_PROGRESS',
          _count: { _all: 1 },
          _sum: { durationSpent: 30 },
        },
      ]);
      prismaService.userProgress.findMany.mockResolvedValue([
        { lesson: { courseId: 'c1' } },
        { lesson: { courseId: 'c1' } },
      ]);
      prismaService.userAchievement.count.mockResolvedValue(5);

      const result = await service.getDashboardStats('u1');

      expect(result).toEqual({
        points: 100,
        enrolledCoursesCount: 1,
        completedLessonsCount: 1,
        badgesCount: 5,
        totalDurationSpent: 90,
      });
    });

    it('should handle zero stats', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.userProgress.groupBy.mockResolvedValue([]);
      prismaService.userProgress.findMany.mockResolvedValue([]);
      prismaService.userAchievement.count.mockResolvedValue(0);

      const result = await service.getDashboardStats('u1');

      expect(result).toEqual({
        points: 0,
        enrolledCoursesCount: 0,
        completedLessonsCount: 0,
        badgesCount: 0,
        totalDurationSpent: 0,
      });
    });
  });

  describe('Profile Update Validation (S002)', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: { vi: 'Updated', en: 'Updated', zh: 'Updated' },
      };
      const updated = { id: 'u1', ...updateData };
      prismaService.user.update.mockResolvedValue(updated);

      const result = await service.update('u1', updateData as any);
      expect(result.id).toBe('u1');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: updateData,
      });
    });

    it('should handle JSONB preference updates', async () => {
      const preferences = { locale: 'vi', theme: 'dark' };
      prismaService.user.update.mockResolvedValue({ id: 'u1', preferences });

      await service.update('u1', { preferences } as any);
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should reject invalid user ID', async () => {
      prismaService.user.update.mockRejectedValue({ code: 'P2025' });
      await expect(service.update('invalid-id', {})).rejects.toThrow();
    });
  });

  describe('Soft Delete & User Search (S002)', () => {
    it('should find user by ID even if not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.findById('non-existent');
      expect(result).toBeNull();
    });

    it('should include investment profile in findById', async () => {
      const mockUser = {
        id: 'u1',
        investmentProfile: { userId: 'u1', goal: 'SAVING' },
      };
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('u1');
      expect(result).toHaveProperty('investmentProfile');
    });
  });

  describe('Investment Profile Management (S002)', () => {
    it('should create investment profile if not exists', async () => {
      const dto = { goal: 'SAVING', currentKnowledge: 'BEGINNER' };
      prismaService.investmentProfile.upsert.mockResolvedValue({
        userId: 'u1',
        ...dto,
      } as any);

      const result = await service.updateInvestmentProfile('u1', dto as any);
      expect(result.userId).toBe('u1');
      expect(prismaService.investmentProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          create: expect.objectContaining({ goal: 'SAVING' }),
        }),
      );
    });

    it('should update existing investment profile', async () => {
      const dto = { currentKnowledge: 'INTERMEDIATE' };
      prismaService.investmentProfile.upsert.mockResolvedValue({
        userId: 'u1',
        ...dto,
      } as any);

      await service.updateInvestmentProfile('u1', dto as any);
      expect(prismaService.investmentProfile.upsert).toHaveBeenCalled();
    });

    it('should return null if no investment profile exists', async () => {
      prismaService.investmentProfile.findUnique.mockResolvedValue(null);
      const result = await service.getInvestmentProfile('u1');
      expect(result).toBeNull();
    });
  });

  describe('Password Management (S002)', () => {
    let bcrypt: any;

    beforeEach(async () => {
      bcrypt = await import('bcrypt');
    });

    it('should change password with valid old password', async () => {
      const oldHash = await bcrypt.hash('oldPassword', 10);
      prismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: oldHash,
      });
      prismaService.user.update.mockResolvedValue({ id: 'u1' } as any);

      const result = await service.changePassword('u1', {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword123',
      });

      expect(result.message).toBe(
        'Password changed successfully. All devices logged out.',
      );
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should reject invalid old password', async () => {
      const { UnauthorizedException } = await import('@nestjs/common');
      const oldHash = await bcrypt.hash('correctPassword', 10);
      prismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: oldHash,
      });

      await expect(
        service.changePassword('u1', {
          oldPassword: 'wrongPassword',
          newPassword: 'new',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.changePassword('non-existent', {
          oldPassword: 'old',
          newPassword: 'new',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Dashboard Stats Edge Cases (S002)', () => {
    it('should handle multiple courses with same lessons', async () => {
      prismaService.user.findUnique.mockResolvedValue({ points: 200 });
      prismaService.userProgress.groupBy.mockResolvedValue([
        {
          status: 'COMPLETED',
          _count: { _all: 2 },
          _sum: { durationSpent: 80 },
        },
        {
          status: 'IN_PROGRESS',
          _count: { _all: 1 },
          _sum: { durationSpent: 20 },
        },
      ]);
      prismaService.userProgress.findMany.mockResolvedValue([
        { lesson: { courseId: 'c1' } },
        { lesson: { courseId: 'c1' } },
        { lesson: { courseId: 'c2' } },
      ]);
      prismaService.userAchievement.count.mockResolvedValue(3);

      const result = await service.getDashboardStats('u1');
      expect(result.enrolledCoursesCount).toBe(2);
      expect(result.completedLessonsCount).toBe(2);
      expect(result.totalDurationSpent).toBe(100);
    });

    it('should handle large duration values', async () => {
      prismaService.user.findUnique.mockResolvedValue({ points: 1000 });
      prismaService.userProgress.groupBy.mockResolvedValue([
        {
          status: 'COMPLETED',
          _count: { _all: 1 },
          _sum: { durationSpent: 999999 },
        },
      ]);
      prismaService.userProgress.findMany.mockResolvedValue([
        { lesson: { courseId: 'c1' } },
      ]);
      prismaService.userAchievement.count.mockResolvedValue(50);

      const result = await service.getDashboardStats('u1');
      expect(result.totalDurationSpent).toBe(999999);
    });
  });
});
