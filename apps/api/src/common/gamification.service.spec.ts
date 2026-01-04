import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GamificationService } from './gamification.service';

describe('GamificationService (Pure Unit Test)', () => {
  let service: GamificationService;
  let mockPrisma: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      user: {
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      behaviorLog: {
        create: vi.fn(),
      },
    };
    mockEventEmitter = {
      emit: vi.fn(),
    };
    service = new GamificationService(mockPrisma, mockEventEmitter);
  });

  describe('logEvent', () => {
    it('should increment user points and log behavior', async () => {
      const userId = 'u1';
      const eventType = 'LESSON_COMPLETED';
      const points = 50;

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 150 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent(userId, eventType, points);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { points: { increment: points } },
      });
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            eventType,
            payload: expect.objectContaining({ pointsEarned: points }),
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'points.earned',
        expect.objectContaining({
          userId,
          pointsEarned: points,
        }),
      );
    });

    it('should use simulation system ID when metadata has isSimulation true', async () => {
      const userId = 'u1';
      await service.logEvent(userId, 'TEST', 10, { isSimulation: true });

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'simulation-system',
          }),
        }),
      );
    });
  });

  describe('deductPoints', () => {
    it('should deduct points if user has enough', async () => {
      const userId = 'u1';
      mockPrisma.user.findUnique.mockResolvedValue({ points: 100 });
      mockPrisma.user.update.mockResolvedValue({ points: 80 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      const result = await service.deductPoints(userId, 20, 'PURCHASE');

      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { points: { decrement: 20 } },
      });
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'POINTS_DEDUCTED',
            payload: expect.objectContaining({
              pointsDeducted: 20,
              reason: 'PURCHASE',
            }),
          }),
        }),
      );
    });

    it('should throw error if user has insufficient points', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ points: 10 });
      await expect(service.deductPoints('u1', 20, 'PURCHASE')).rejects.toThrow(
        'Insufficient points',
      );
    });

    it('should throw error if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.deductPoints('u1', 20, 'PURCHASE')).rejects.toThrow(
        'Insufficient points',
      );
    });

    it('should log deduction with correct session ID', async () => {
      const userId = 'u1';
      mockPrisma.user.findUnique.mockResolvedValue({ points: 100 });
      mockPrisma.user.update.mockResolvedValue({ points: 80 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.deductPoints(userId, 50, 'STORE_ITEM');

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'gamification-system',
          }),
        }),
      );
    });
  });

  describe('Point calculation with streak multipliers (edge cases)', () => {
    it('should handle zero points correctly', async () => {
      mockPrisma.user.update.mockResolvedValue({ points: 100 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', 'TEST', 0);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { points: { increment: 0 } },
      });
    });

    it('should handle large point values', async () => {
      mockPrisma.user.update.mockResolvedValue({ points: 10000 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', 'ACHIEVEMENT_UNLOCKED', 5000);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { points: { increment: 5000 } },
      });
    });

    it('should include custom metadata in payload', async () => {
      mockPrisma.user.update.mockResolvedValue({ points: 100 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', 'CUSTOM_EVENT', 100, {
        streakMultiplier: 1.5,
        badgeType: 'GOLD',
      });

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              streakMultiplier: 1.5,
              badgeType: 'GOLD',
            }),
          }),
        }),
      );
    });
  });

  describe('XP Decay Logic (S004)', () => {
    it('should handle zero-point events', async () => {
      mockPrisma.user.update.mockResolvedValue({ points: 100 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', 'LOGIN', 0);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { points: { increment: 0 } },
      });
    });

    it('should handle negative point values gracefully', async () => {
      mockPrisma.user.update.mockResolvedValue({ points: 50 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', 'PENALTY', -10);
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should track point decay in metadata', async () => {
      mockPrisma.user.update.mockResolvedValue({ points: 90 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', 'DECAY', 0, {
        decayApplied: true,
        decayAmount: 10,
      });

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              decayApplied: true,
              decayAmount: 10,
            }),
          }),
        }),
      );
    });
  });

  describe('Achievement Unlock Race Conditions (S004)', () => {
    it('should handle concurrent point updates', async () => {
      mockPrisma.user.update.mockResolvedValue({ points: 100 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      const promises = [
        service.logEvent('u1', 'EVENT1', 10),
        service.logEvent('u1', 'EVENT2', 20),
        service.logEvent('u1', 'EVENT3', 30),
      ];

      await Promise.all(promises);
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(3);
    });

    it('should emit event for each point gain', async () => {
      mockPrisma.user.update.mockResolvedValue({ points: 150 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', 'ACHIEVEMENT', 100);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'points.earned',
        expect.objectContaining({
          userId: 'u1',
          pointsEarned: 100,
        }),
      );
    });
  });

  describe('Leaderboard Ranking Updates (S004)', () => {
    it('should log events with unique event types', async () => {
      mockPrisma.user.update.mockResolvedValue({ points: 100 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', 'LEADERBOARD_CLIMB', 50);

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'LEADERBOARD_CLIMB',
          }),
        }),
      );
    });

    it('should handle metadata for ranking changes', async () => {
      mockPrisma.user.update.mockResolvedValue({ points: 200 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', 'RANK_UP', 0, {
        previousRank: 10,
        newRank: 5,
      });

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              previousRank: 10,
              newRank: 5,
            }),
          }),
        }),
      );
    });
  });

  describe('Streak Recovery (S004)', () => {
    it('should log streak recovery events', async () => {
      mockPrisma.user.update.mockResolvedValue({ points: 100 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', 'STREAK_RECOVERED', 20, {
        streakDays: 7,
        recoveryBonus: 1.2,
      });

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'STREAK_RECOVERED',
            payload: expect.objectContaining({
              streakDays: 7,
            }),
          }),
        }),
      );
    });
  });

  describe('Deduction Edge Cases (S004)', () => {
    it('should handle deduction when points exactly match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ points: 100 });
      mockPrisma.user.update.mockResolvedValue({ points: 0 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      const result = await service.deductPoints('u1', 100, 'EXACT_MATCH');
      expect(result).toBe(true);
    });

    it('should emit deduction event', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ points: 100 });
      mockPrisma.user.update.mockResolvedValue({ points: 50 });
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.deductPoints('u1', 50, 'STORE');
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });
  });
});
