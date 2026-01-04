import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StoreService } from './store.service';

describe('StoreService', () => {
  let service: StoreService;
  let mockPrisma: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      userStreak: {
        update: vi.fn(),
      },
    };
    mockEventEmitter = {
      emit: vi.fn(),
    };
    service = new StoreService(mockPrisma, mockEventEmitter);
  });

  describe('buyStreakFreeze', () => {
    it('should successfully buy a streak freeze', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ points: 1000 });
      mockPrisma.userStreak.update.mockResolvedValue({ freezesRemaining: 1 });

      const result = await service.buyStreakFreeze('user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { points: true },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('points.deduct', {
        userId: 'user-1',
        points: 500,
        reason: 'PURCHASE_STREAK_FREEZE',
      });
      expect(mockPrisma.userStreak.update).toHaveBeenCalled();
      expect(result.freezesRemaining).toBe(1);
    });

    it('should throw BadRequestException if user has insufficient points', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ points: 100 });

      await expect(service.buyStreakFreeze('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.buyStreakFreeze('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStoreItems', () => {
    it('should return list of store items', async () => {
      const items = await service.getStoreItems();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('streak-freeze');
      expect(items[0].price).toBe(500);
    });
  });
});
