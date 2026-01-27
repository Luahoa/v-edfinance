import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUserId = 'user-123';
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    role: 'STUDENT',
    points: 100,
    level: 5,
  };

  const mockUsersService = {
    findById: vi.fn(),
    getInvestmentProfile: vi.fn(),
    updateInvestmentProfile: vi.fn(),
    getDashboardStats: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: mockUserId };
          return true;
        },
      })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    // Manually bind service to fix NestJS TestingModule mock binding issue
    (controller as any).usersService = mockUsersService;

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const req = { user: { userId: mockUserId } };
      const result = await controller.getProfile(req);

      expect(usersService.findById).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      const req = { user: { userId: 'non-existent' } };

      await expect(controller.getProfile(req)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersService.findById).toHaveBeenCalledWith('non-existent');
    });

    it('should throw UnauthorizedException when userId is missing', async () => {
      mockUsersService.findById.mockRejectedValue(
        new UnauthorizedException('User not authenticated'),
      );

      const req = { user: {} };

      await expect(controller.getProfile(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle service errors gracefully', async () => {
      mockUsersService.findById.mockRejectedValue(
        new Error('Database connection error'),
      );

      const req = { user: { userId: mockUserId } };

      await expect(controller.getProfile(req)).rejects.toThrow(
        'Database connection error',
      );
    });
  });

  const mockInvestmentProfile = {
    riskTolerance: 'MODERATE',
    investmentGoals: ['RETIREMENT', 'SAVINGS'],
    monthlyIncome: 50000000,
    monthlyExpense: 30000000,
  };

  describe('getInvestmentProfile', () => {
    it('should return investment profile successfully', async () => {
      mockUsersService.getInvestmentProfile.mockResolvedValue(
        mockInvestmentProfile,
      );

      const req = { user: { userId: mockUserId } };
      const result = await controller.getInvestmentProfile(req);

      expect(usersService.getInvestmentProfile).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(result).toEqual(mockInvestmentProfile);
    });

    it('should handle user without investment profile', async () => {
      mockUsersService.getInvestmentProfile.mockResolvedValue(null);

      const req = { user: { userId: mockUserId } };
      const result = await controller.getInvestmentProfile(req);

      expect(result).toBeNull();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUsersService.getInvestmentProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      const req = { user: { userId: 'invalid-id' } };

      await expect(controller.getInvestmentProfile(req)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateInvestmentProfile', () => {
    const updateDto = {
      riskTolerance: 'AGGRESSIVE',
      investmentGoals: ['GROWTH'],
      monthlyIncome: 60000000,
      monthlyExpense: 35000000,
    };

    it('should update investment profile successfully', async () => {
      const updatedProfile = { ...updateDto, id: mockUserId };
      mockUsersService.updateInvestmentProfile.mockResolvedValue(
        updatedProfile,
      );

      const req = { user: { userId: mockUserId } };
      const result = await controller.updateInvestmentProfile(req, updateDto);

      expect(usersService.updateInvestmentProfile).toHaveBeenCalledWith(
        mockUserId,
        updateDto,
      );
      expect(result).toEqual(updatedProfile);
    });

    it('should handle partial updates', async () => {
      const partialDto = { riskTolerance: 'CONSERVATIVE' };
      const updatedProfile = { ...mockInvestmentProfile, ...partialDto };
      mockUsersService.updateInvestmentProfile.mockResolvedValue(
        updatedProfile,
      );

      const req = { user: { userId: mockUserId } };
      const result = await controller.updateInvestmentProfile(req, partialDto);

      expect(usersService.updateInvestmentProfile).toHaveBeenCalledWith(
        mockUserId,
        partialDto,
      );
      expect(result.riskTolerance).toBe('CONSERVATIVE');
    });

    it('should validate investment goals array', async () => {
      const invalidDto = {
        investmentGoals: [],
      };
      mockUsersService.updateInvestmentProfile.mockRejectedValue(
        new Error('Investment goals cannot be empty'),
      );

      const req = { user: { userId: mockUserId } };

      await expect(
        controller.updateInvestmentProfile(req, invalidDto),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUsersService.updateInvestmentProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      const req = { user: { userId: 'invalid-id' } };

      await expect(
        controller.updateInvestmentProfile(req, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDashboardStats', () => {
    const mockStats = {
      points: 1250,
      level: 8,
      currentStreak: 15,
      longestStreak: 30,
      coursesCompleted: 5,
      lessonsCompleted: 42,
      totalLearningTime: 18000,
      achievements: [
        { id: 'ach-1', title: 'First Steps', unlockedAt: new Date() },
        { id: 'ach-2', title: 'Streak Master', unlockedAt: new Date() },
      ],
    };

    it('should return dashboard statistics successfully', async () => {
      mockUsersService.getDashboardStats.mockResolvedValue(mockStats);

      const req = { user: { userId: mockUserId } };
      const result = await controller.getDashboardStats(req);

      expect(usersService.getDashboardStats).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockStats);
      expect(result.points).toBe(1250);
      expect(result.achievements).toHaveLength(2);
    });

    it('should return empty stats for new user', async () => {
      const emptyStats = {
        points: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        coursesCompleted: 0,
        lessonsCompleted: 0,
        totalLearningTime: 0,
        achievements: [],
      };
      mockUsersService.getDashboardStats.mockResolvedValue(emptyStats);

      const req = { user: { userId: 'new-user' } };
      const result = await controller.getDashboardStats(req);

      expect(result.points).toBe(0);
      expect(result.achievements).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      mockUsersService.getDashboardStats.mockRejectedValue(
        new Error('Stats calculation failed'),
      );

      const req = { user: { userId: mockUserId } };

      await expect(controller.getDashboardStats(req)).rejects.toThrow(
        'Stats calculation failed',
      );
    });
  });

  describe('Guard Protection', () => {
    it('should protect all endpoints with JwtAuthGuard', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        UsersController.prototype.getProfile,
      );
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should require authentication for investment profile endpoints', () => {
      const getGuards = Reflect.getMetadata(
        '__guards__',
        UsersController.prototype.getInvestmentProfile,
      );
      const updateGuards = Reflect.getMetadata(
        '__guards__',
        UsersController.prototype.updateInvestmentProfile,
      );

      expect(getGuards).toContain(JwtAuthGuard);
      expect(updateGuards).toContain(JwtAuthGuard);
    });

    it('should require authentication for dashboard stats', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        UsersController.prototype.getDashboardStats,
      );
      expect(guards).toContain(JwtAuthGuard);
    });
  });
});
