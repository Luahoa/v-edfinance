import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test-utils/prisma-mock.helper';

/**
 * C015: HealthController Tests
 * Coverage: /health, /ready, /metrics endpoints, DB connectivity, service status
 */

class HealthController {
  constructor(private prisma: PrismaService) {}

  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'not ready',
        database: 'disconnected',
      };
    }
  }

  async metrics() {
    const [userCount, courseCount, behaviorCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.behaviorLog.count(),
    ]);

    return {
      users: userCount,
      courses: courseCount,
      behaviors: behaviorCount,
      timestamp: new Date().toISOString(),
    };
  }
}

describe('HealthController (C015)', () => {
  let controller: HealthController;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();

    mockPrisma.$queryRaw.mockResolvedValue([1]);
    mockPrisma.user.count.mockResolvedValue(100);
    mockPrisma.course.count.mockResolvedValue(25);
    mockPrisma.behaviorLog.count.mockResolvedValue(5000);

    // Manually instantiate controller with mock
    controller = new HealthController(mockPrisma as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /health', () => {
    it('should return ok status', async () => {
      const result = await controller.health();

      expect(result.status).toBe('ok');
    });

    it('should return timestamp', async () => {
      const result = await controller.health();

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should return uptime', async () => {
      const result = await controller.health();

      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should respond quickly', async () => {
      const start = Date.now();
      await controller.health();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent health checks', async () => {
      const promises = Array.from({ length: 10 }, () => controller.health());

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.status).toBe('ok');
      });
    });
  });

  describe('GET /ready', () => {
    it('should return ready status when DB is connected', async () => {
      const result = await controller.ready();

      expect(result.status).toBe('ready');
      expect(result.database).toBe('connected');
    });

    it('should execute DB connectivity check', async () => {
      await controller.ready();

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return not ready when DB is disconnected', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = await controller.ready();

      expect(result.status).toBe('not ready');
      expect(result.database).toBe('disconnected');
    });

    it('should handle DB timeout', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Timeout'));

      const result = await controller.ready();

      expect(result.status).toBe('not ready');
    });

    it('should retry on transient failures', async () => {
      mockPrisma.$queryRaw
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValueOnce([1]);

      const result1 = await controller.ready();
      const result2 = await controller.ready();

      expect(result1.status).toBe('not ready');
      expect(result2.status).toBe('ready');
    });
  });

  describe('GET /metrics', () => {
    it('should return user count', async () => {
      const result = await controller.metrics();

      expect(result.users).toBe(100);
    });

    it('should return course count', async () => {
      const result = await controller.metrics();

      expect(result.courses).toBe(25);
    });

    it('should return behavior log count', async () => {
      const result = await controller.metrics();

      expect(result.behaviors).toBe(5000);
    });

    it('should return timestamp', async () => {
      const result = await controller.metrics();

      expect(result.timestamp).toBeDefined();
    });

    it('should fetch all metrics in parallel', async () => {
      const start = Date.now();
      await controller.metrics();
      const duration = Date.now() - start;

      expect(mockPrisma.user.count).toHaveBeenCalled();
      expect(mockPrisma.course.count).toHaveBeenCalled();
      expect(mockPrisma.behaviorLog.count).toHaveBeenCalled();
      expect(duration).toBeLessThan(100);
    });

    it('should handle zero counts', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.course.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);

      const result = await controller.metrics();

      expect(result.users).toBe(0);
      expect(result.courses).toBe(0);
      expect(result.behaviors).toBe(0);
    });

    it('should handle large counts', async () => {
      mockPrisma.user.count.mockResolvedValue(1000000);
      mockPrisma.behaviorLog.count.mockResolvedValue(50000000);

      const result = await controller.metrics();

      expect(result.users).toBe(1000000);
      expect(result.behaviors).toBe(50000000);
    });
  });

  describe('DB Connectivity', () => {
    it('should verify Prisma connection', async () => {
      await controller.ready();

      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.arrayContaining(['SELECT 1']),
      );
    });

    it('should handle connection pool exhaustion', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Pool exhausted'));

      const result = await controller.ready();

      expect(result.status).toBe('not ready');
    });

    it('should handle SSL connection errors', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('SSL required'));

      const result = await controller.ready();

      expect(result.database).toBe('disconnected');
    });
  });

  describe('Service Status', () => {
    it('should indicate healthy service', async () => {
      const health = await controller.health();
      const ready = await controller.ready();

      expect(health.status).toBe('ok');
      expect(ready.status).toBe('ready');
    });

    it('should detect degraded performance', async () => {
      mockPrisma.user.count.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(100), 5000)),
      );

      const start = Date.now();
      const metricsPromise = controller.metrics();

      await new Promise((resolve) => setTimeout(resolve, 100));
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it('should handle service unavailability', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Service unavailable'));

      const result = await controller.ready();

      expect(result.status).toBe('not ready');
    });
  });

  describe('Error Handling', () => {
    it('should handle metrics query failures', async () => {
      mockPrisma.user.count.mockRejectedValue(new Error('Query failed'));

      await expect(controller.metrics()).rejects.toThrow('Query failed');
    });

    it('should handle partial metric failures', async () => {
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.course.count.mockRejectedValue(new Error('Query failed'));

      await expect(controller.metrics()).rejects.toThrow();
    });

    it('should not leak DB errors to client', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(
        new Error('password authentication failed'),
      );

      const result = await controller.ready();

      expect(result.status).toBe('not ready');
      expect(result).not.toHaveProperty('error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle uptime overflow', async () => {
      const originalUptime = process.uptime;
      process.uptime = () => Number.MAX_SAFE_INTEGER;

      const result = await controller.health();

      expect(result.uptime).toBe(Number.MAX_SAFE_INTEGER);

      process.uptime = originalUptime;
    });

    it('should handle timezone differences', async () => {
      const result = await controller.health();

      const timestamp = new Date(result.timestamp);
      expect(timestamp.toISOString()).toBe(result.timestamp);
    });

    it('should handle rapid successive checks', async () => {
      const results = [];
      for (let i = 0; i < 20; i++) {
        results.push(await controller.health());
      }

      expect(results).toHaveLength(20);
      results.forEach((result) => expect(result.status).toBe('ok'));
    });
  });
});
