import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdaptiveService } from './adaptive.service';

describe('AdaptiveService', () => {
  let service: AdaptiveService;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      behaviorLog: {
        create: vi.fn(),
      },
    };
    service = new AdaptiveService(mockPrisma);
  });

  it('should adjust level up for good performance', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

    const result = await service.adjustLearningPath('u1', 'l1', {
      score: 90,
      timeSpent: 300,
    });

    expect(result.adjustment).toBe('LEVEL_UP');
    expect(result.suggestedLevel).toBe('INTERMEDIATE');
    expect(mockPrisma.behaviorLog.create).toHaveBeenCalled();
  });

  it('should suggest reinforcement for poor performance', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

    const result = await service.adjustLearningPath('u1', 'l1', {
      score: 40,
      timeSpent: 300,
    });

    expect(result.adjustment).toBe('REINFORCE');
    expect(result.suggestedLevel).toBe('BEGINNER');
  });
});
