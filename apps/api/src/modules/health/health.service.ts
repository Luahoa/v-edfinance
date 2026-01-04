import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CircuitBreakerService, CircuitState } from './circuit-breaker.service';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: Record<string, ComponentHealth>;
  timestamp: string;
  uptime: number;
}

export interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();

    try {
      await this.circuitBreaker.execute('database', async () => {
        await this.prisma.$queryRaw`SELECT 1`;
      });

      return {
        status: 'up',
        responseTime: Date.now() - start,
        message: 'Database connection successful',
      };
    } catch (error) {
      const circuitState = this.circuitBreaker.getState('database');
      return {
        status: circuitState === CircuitState.OPEN ? 'down' : 'degraded',
        responseTime: Date.now() - start,
        message:
          error instanceof Error ? error.message : 'Database check failed',
        details: { circuitState },
      };
    }
  }

  checkMemory(): ComponentHealth {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const usagePercent = (used.heapUsed / used.heapTotal) * 100;

    let status: 'up' | 'down' | 'degraded' = 'up';
    if (usagePercent > 90) {
      status = 'down';
    } else if (usagePercent > 75) {
      status = 'degraded';
    }

    return {
      status,
      message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
      details: {
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
        usagePercent: Math.round(usagePercent),
        rss: Math.round(used.rss / 1024 / 1024),
      },
    };
  }

  checkDisk(): ComponentHealth {
    return {
      status: 'up',
      message: 'Disk check not implemented (optional)',
    };
  }

  async getHealthStatus(): Promise<HealthCheckResult> {
    const [database, memory, disk] = await Promise.all([
      this.checkDatabase(),
      Promise.resolve(this.checkMemory()),
      Promise.resolve(this.checkDisk()),
    ]);

    const checks = { database, memory, disk };

    const statuses = Object.values(checks).map((c) => c.status);
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (statuses.some((s) => s === 'down')) {
      overallStatus = 'unhealthy';
    } else if (statuses.some((s) => s === 'degraded')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - this.startTime) / 1000),
    };
  }

  async getReadinessStatus(): Promise<HealthCheckResult> {
    return this.getHealthStatus();
  }

  getLivenessStatus(): { status: 'alive'; uptime: number } {
    return {
      status: 'alive',
      uptime: Math.round((Date.now() - this.startTime) / 1000),
    };
  }
}
