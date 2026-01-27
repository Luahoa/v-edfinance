import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorService } from '../../../src/behavior/behavior.service';

describe('BehaviorService', () => {
  let service: BehaviorService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      behaviorLog: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };
    service = new BehaviorService(prisma);
  });

  describe('logEvent', () => {
    it('should create a behavior log', async () => {
      const data = {
        userId: 'user-1',
        sessionId: 'session-1',
        path: '/test',
        eventType: 'TEST_EVENT',
        payload: { foo: 'bar' },
      };
      await service.logEvent(data.userId, data);
      expect(prisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          eventType: 'TEST_EVENT',
        }),
      });
    });
  });
});
