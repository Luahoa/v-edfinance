import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorService } from './behavior.service';

describe('BehaviorService', () => {
  let service: BehaviorService;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      behaviorLog: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };
    service = new BehaviorService(mockPrisma);
  });

  it('should log an event', async () => {
    const eventData = {
      userId: 'u1',
      sessionId: 's1',
      path: '/home',
      eventType: 'CLICK',
      payload: { element: 'button-1' },
    };

    mockPrisma.behaviorLog.create.mockResolvedValue({
      id: 'log1',
      ...eventData,
    });

    const result = await service.logEvent(eventData.userId, eventData);

    expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        sessionId: 's1',
        path: '/home',
        eventType: 'CLICK',
        actionCategory: 'GENERAL',
        duration: 0,
        deviceInfo: undefined,
        payload: { element: 'button-1' },
      },
    });
    expect(result.id).toBe('log1');
  });

  it('should fetch user behaviors', async () => {
    mockPrisma.behaviorLog.findMany.mockResolvedValue([
      { id: 'log1' },
      { id: 'log2' },
    ]);

    const result = await service.getUserBehaviors('u1');

    expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: { timestamp: 'desc' },
    });
    expect(result).toHaveLength(2);
  });

  describe('Event aggregation by session', () => {
    it('should log events with same session ID', async () => {
      const sessionId = 'session-123';
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', {
        sessionId,
        path: '/home',
        eventType: 'CLICK',
        payload: { element: 'btn-1' },
      });

      await service.logEvent('u1', {
        sessionId,
        path: '/profile',
        eventType: 'NAVIGATION',
        payload: { from: '/home' },
      });

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.behaviorLog.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({ sessionId }),
      });
      expect(mockPrisma.behaviorLog.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({ sessionId }),
      });
    });
  });

  describe('JSONB payload handling', () => {
    it('should store complex nested JSONB payload', async () => {
      const complexPayload = {
        user_action: 'quiz_attempt',
        quiz_data: {
          questions: [
            { id: 1, answer: 'A', correct: true },
            { id: 2, answer: 'B', correct: false },
          ],
          score: 50,
        },
        metadata: {
          device: 'mobile',
          browser: 'Chrome',
        },
      };

      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', {
        sessionId: 's1',
        path: '/quiz',
        eventType: 'QUIZ_SUBMIT',
        payload: complexPayload,
      });

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payload: complexPayload,
        }),
      });
    });

    it('should handle JSONB deviceInfo', async () => {
      const deviceInfo = {
        platform: 'iOS',
        version: '15.0',
        screen: { width: 1920, height: 1080 },
      };

      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', {
        sessionId: 's1',
        path: '/home',
        eventType: 'PAGE_VIEW',
        deviceInfo,
      });

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceInfo,
        }),
      });
    });
  });

  describe('High-volume event streams', () => {
    it('should handle 100+ events without error', async () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        sessionId: `session-${i % 10}`,
        path: `/page-${i}`,
        eventType: 'CLICK',
        payload: { index: i },
      }));

      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      const promises = events.map((event) => service.logEvent('u1', event));
      await Promise.all(promises);

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledTimes(100);
    });

    it('should handle rapid sequential logging', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      for (let i = 0; i < 50; i++) {
        await service.logEvent('u1', {
          sessionId: 's1',
          path: `/action-${i}`,
          eventType: 'RAPID_CLICK',
        });
      }

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledTimes(50);
    });
  });

  describe('Privacy filtering', () => {
    it('should allow undefined userId for anonymous tracking', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent(undefined, {
        sessionId: 's1',
        path: '/landing',
        eventType: 'PAGE_VIEW',
      });

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: undefined,
        }),
      });
    });

    it('should set default actionCategory to GENERAL if not provided', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', {
        sessionId: 's1',
        path: '/home',
        eventType: 'CLICK',
      });

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actionCategory: 'GENERAL',
        }),
      });
    });

    it('should set default duration to 0 if not provided', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.logEvent('u1', {
        sessionId: 's1',
        path: '/home',
        eventType: 'PAGE_VIEW',
      });

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          duration: 0,
        }),
      });
    });
  });
});
