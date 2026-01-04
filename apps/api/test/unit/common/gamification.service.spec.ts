import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GamificationService } from '../../../src/common/gamification.service';

describe('GamificationService', () => {
  let service: GamificationService;
  let prisma: any;
  let eventEmitter: any;

  beforeEach(() => {
    prisma = {
      user: {
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      behaviorLog: {
        create: vi.fn(),
      },
    };
    eventEmitter = {
      emit: vi.fn(),
    };
    service = new GamificationService(prisma, eventEmitter);
  });

  describe('logEvent', () => {
    it('should update user points and create log', async () => {
      const userId = 'user-1';
      await service.logEvent(userId, 'TEST_EVENT', 50);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { points: { increment: 50 } },
      });
      expect(prisma.behaviorLog.create).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'points.earned',
        expect.any(Object),
      );
    });
  });

  describe('deductPoints', () => {
    it('should throw error if insufficient points', async () => {
      prisma.user.findUnique.mockResolvedValue({ points: 10 });
      await expect(
        service.deductPoints('user-1', 20, 'reason'),
      ).rejects.toThrow('Insufficient points');
    });

    it('should deduct points if sufficient', async () => {
      prisma.user.findUnique.mockResolvedValue({ points: 100 });
      await service.deductPoints('user-1', 20, 'reason');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { points: { decrement: 20 } },
      });
    });
  });
});
