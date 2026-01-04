import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProactiveTriggersService } from './proactive-triggers.service';
import { PrismaService } from '../prisma/prisma.service';
import { NudgeEngineService } from '../modules/nudge/nudge-engine.service';

describe('ProactiveTriggersService', () => {
  let service: ProactiveTriggersService;
  let prismaMock: any;
  let nudgeEngineMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: { findMany: vi.fn() },
      courseProgress: { findMany: vi.fn() },
      behaviorLog: { create: vi.fn() },
    };

    nudgeEngineMock = {
      generateNudge: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProactiveTriggersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NudgeEngineService, useValue: nudgeEngineMock },
      ],
    }).compile();

    service = module.get(ProactiveTriggersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should detect users at risk of losing streak', async () => {
    // Mock users with 22-hour last login (2h left to save streak)
    const pastDate = new Date(Date.now() - 22 * 60 * 60 * 1000);

    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user1',
        email: 'test@example.com',
        locale: 'vi',
        streak: 5,
        lastLoginAt: pastDate,
      },
    ]);

    nudgeEngineMock.generateNudge.mockResolvedValue({
      type: 'LOSS_AVERSION',
      message: { vi: 'Test nudge' },
    });

    await service.checkStreaksAtRisk();

    expect(nudgeEngineMock.generateNudge).toHaveBeenCalledWith(
      'user1',
      'STREAK_WARNING',
      expect.objectContaining({ streak: 5 }),
    );
  });

  it('should detect unfinished courses', async () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    prismaMock.courseProgress.findMany.mockResolvedValue([
      {
        user: { id: 'user1', email: 'test@example.com', locale: 'en' },
        course: { id: 'course1', title: 'Financial Planning' },
        progress: 85,
        updatedAt: oldDate,
      },
    ]);

    nudgeEngineMock.generateNudge.mockResolvedValue({
      type: 'GOAL_GRADIENT',
      message: { en: 'Finish your course!' },
    });

    await service.checkUnfinishedCourses();

    expect(nudgeEngineMock.generateNudge).toHaveBeenCalledWith(
      'user1',
      'COURSE_COMPLETION',
      expect.objectContaining({ progress: 85 }),
    );
  });
});
