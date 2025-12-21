import { Test } from '@nestjs/testing';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('I019: High-Load Behavior Logging Integration', () => {
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should handle 100+ concurrent behavior log writes without data loss', async () => {
    const startTime = Date.now();
    const eventCount = 100;
    const userIds = Array.from({ length: 10 }, (_, i) => `user-${i}`);

    const logPromises = Array.from({ length: eventCount }, (_, i) =>
      prismaService.behaviorLog.create({
        data: {
          userId: userIds[i % 10],
          sessionId: `session-${Math.floor(i / 10)}`,
          path: `/test/event-${i}`,
          eventType: 'HIGH_LOAD_TEST',
          payload: {
            index: i,
            timestamp: new Date().toISOString(),
            details: { batch: 'stress-test' },
          },
        },
      })
    );

    const results = await Promise.allSettled(logPromises);
    const duration = Date.now() - startTime;

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`[PERF] 100 concurrent writes in ${duration}ms`);
    console.log(`[RESULT] Success: ${successful}, Failed: ${failed}`);

    expect(successful).toBe(eventCount);
    expect(failed).toBe(0);
    expect(duration).toBeLessThan(5000);
  });

  it('should maintain data integrity during concurrent writes', async () => {
    const userId = 'integrity-test-user';
    const writes = 50;

    await Promise.all(
      Array.from({ length: writes }, (_, i) =>
        prismaService.behaviorLog.create({
          data: {
            userId,
            sessionId: `concurrent-${i}`,
            path: `/integrity/${i}`,
            eventType: 'INTEGRITY_TEST',
            payload: { sequenceNumber: i },
          },
        })
      )
    );

    const logs = await prismaService.behaviorLog.findMany({
      where: { userId, eventType: 'INTEGRITY_TEST' },
      orderBy: { createdAt: 'asc' },
    });

    expect(logs).toHaveLength(writes);

    const sequences = logs.map((log: any) => log.payload.sequenceNumber).sort((a, b) => a - b);
    expect(sequences).toEqual(Array.from({ length: writes }, (_, i) => i));
  });

  it('should handle database lock contention gracefully', async () => {
    const sharedUserId = 'lock-test-user';
    const startTime = Date.now();

    const promises = Array.from({ length: 20 }, (_, i) =>
      prismaService.$transaction(async (tx) => {
        await tx.behaviorLog.create({
          data: {
            userId: sharedUserId,
            sessionId: `tx-${i}`,
            path: `/lock-test/${i}`,
            eventType: 'LOCK_TEST',
            payload: { index: i },
          },
        });

        await new Promise((resolve) => setTimeout(resolve, 10));
      })
    );

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    const logs = await prismaService.behaviorLog.findMany({
      where: { userId: sharedUserId, eventType: 'LOCK_TEST' },
    });

    console.log(`[PERF] 20 transactions with contention: ${duration}ms`);
    expect(logs).toHaveLength(20);
  });

  it('should perform aggregation on high-volume data efficiently', async () => {
    const testUserId = 'aggregation-user';

    await Promise.all(
      Array.from({ length: 200 }, (_, i) =>
        prismaService.behaviorLog.create({
          data: {
            userId: testUserId,
            sessionId: `agg-session-${Math.floor(i / 20)}`,
            path: '/aggregation-test',
            eventType: i % 3 === 0 ? 'CLICK' : i % 3 === 1 ? 'VIEW' : 'SUBMIT',
            payload: { value: i },
          },
        })
      )
    );

    const startTime = Date.now();
    const grouped = await prismaService.behaviorLog.groupBy({
      by: ['eventType'],
      where: { userId: testUserId },
      _count: { id: true },
    });
    const duration = Date.now() - startTime;

    console.log(`[PERF] Aggregation on 200 records: ${duration}ms`);
    expect(grouped).toHaveLength(3);
    expect(duration).toBeLessThan(500);
  });

  it('should maintain performance under mixed read/write load', async () => {
    const userId = 'mixed-load-user';
    let readCount = 0;
    let writeCount = 0;

    const operations = Array.from({ length: 100 }, (_, i) => {
      if (i % 3 === 0) {
        readCount++;
        return prismaService.behaviorLog.findMany({
          where: { userId },
          take: 10,
        });
      } else {
        writeCount++;
        return prismaService.behaviorLog.create({
          data: {
            userId,
            sessionId: `mixed-${i}`,
            path: `/mixed/${i}`,
            eventType: 'MIXED_LOAD',
            payload: { type: 'write', index: i },
          },
        });
      }
    });

    const startTime = Date.now();
    await Promise.all(operations);
    const duration = Date.now() - startTime;

    console.log(`[PERF] ${readCount} reads + ${writeCount} writes: ${duration}ms`);
    expect(duration).toBeLessThan(3000);
  });
});
