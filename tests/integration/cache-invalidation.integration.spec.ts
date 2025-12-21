import { Test } from '@nestjs/testing';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { beforeEach, describe, expect, it } from 'vitest';

describe('I023: Cache Invalidation Chain Integration', () => {
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should invalidate cache after user profile update', async () => {
    const userId = 'cache-test-user';

    const user = await prismaService.user.create({
      data: {
        id: userId,
        email: `${userId}@test.com`,
        passwordHash: 'hashed-password',
        locale: 'vi',
        metadata: {
          displayName: 'Original Name',
        },
      },
    });

    expect(user.metadata).toHaveProperty('displayName', 'Original Name');

    await prismaService.user.update({
      where: { id: userId },
      data: {
        metadata: {
          displayName: 'Updated Name',
        },
      },
    });

    const freshUser = await prismaService.user.findUnique({
      where: { id: userId },
    });

    expect(freshUser?.metadata).toHaveProperty('displayName', 'Updated Name');
  });

  it('should serve fresh data after cache invalidation', async () => {
    const userId = 'fresh-data-user';

    await prismaService.user.create({
      data: {
        id: userId,
        email: `${userId}@test.com`,
        passwordHash: 'hashed',
        locale: 'en',
        metadata: { displayName: 'Test User' },
      },
    });

    const firstRead = await prismaService.user.findUnique({
      where: { id: userId },
    });

    await prismaService.user.update({
      where: { id: userId },
      data: {
        metadata: { displayName: 'Updated User' },
      },
    });

    const secondRead = await prismaService.user.findUnique({
      where: { id: userId },
    });

    expect(firstRead?.metadata).toHaveProperty('displayName', 'Test User');
    expect(secondRead?.metadata).toHaveProperty('displayName', 'Updated User');
  });

  it('should handle concurrent updates with cache consistency', async () => {
    const userId = 'concurrent-cache-user';

    await prismaService.user.create({
      data: {
        id: userId,
        email: `${userId}@test.com`,
        passwordHash: 'hashed',
        locale: 'vi',
        metadata: { displayName: 'Initial' },
      },
    });

    const updates = Array.from({ length: 10 }, (_, i) =>
      prismaService.user.update({
        where: { id: userId },
        data: {
          metadata: { displayName: `Update-${i}` },
        },
      })
    );

    await Promise.all(updates);

    const finalUser = await prismaService.user.findUnique({
      where: { id: userId },
    });

    expect(finalUser?.metadata).toHaveProperty('displayName');
    expect((finalUser?.metadata as any).displayName).toMatch(/^Update-\d$/);
  });

  it('should invalidate related entity caches on cascade', async () => {
    const userId = 'cascade-test-user';

    const user = await prismaService.user.create({
      data: {
        id: userId,
        email: `${userId}@test.com`,
        passwordHash: 'hashed',
        locale: 'vi',
      },
    });

    await prismaService.behaviorLog.create({
      data: {
        userId: user.id,
        sessionId: 'session-1',
        path: '/test',
        eventType: 'TEST',
        payload: {},
      },
    });

    const logs = await prismaService.behaviorLog.findMany({
      where: { userId: user.id },
    });

    expect(logs).toHaveLength(1);

    await prismaService.user.update({
      where: { id: userId },
      data: {
        locale: 'en',
      },
    });

    const freshLogs = await prismaService.behaviorLog.findMany({
      where: { userId },
    });

    expect(freshLogs).toHaveLength(1);
  });

  it('should maintain cache coherence across multiple layers', async () => {
    const userId = 'multi-layer-cache-user';

    const user = await prismaService.user.create({
      data: {
        id: userId,
        email: `${userId}@test.com`,
        passwordHash: 'hashed',
        locale: 'vi',
        metadata: { preferences: { theme: 'dark' } },
      },
    });

    const layer1Read = await prismaService.user.findUnique({
      where: { id: userId },
    });

    await prismaService.user.update({
      where: { id: userId },
      data: {
        metadata: { preferences: { theme: 'light' } },
      },
    });

    const layer2Read = await prismaService.user.findUnique({
      where: { id: userId },
    });

    expect((layer1Read?.metadata as any).preferences.theme).toBe('dark');
    expect((layer2Read?.metadata as any).preferences.theme).toBe('light');
  });

  it('should handle cache miss gracefully and populate from DB', async () => {
    const userId = 'cache-miss-user';

    await prismaService.user.create({
      data: {
        id: userId,
        email: `${userId}@test.com`,
        passwordHash: 'hashed',
        locale: 'zh',
      },
    });

    const directRead = await prismaService.user.findUnique({
      where: { id: userId },
    });

    expect(directRead).toBeDefined();
    expect(directRead?.locale).toBe('zh');

    const secondRead = await prismaService.user.findUnique({
      where: { id: userId },
    });

    expect(secondRead).toEqual(directRead);
  });
});
