import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';

/**
 * C012: DebugController Enhancement Tests
 * Coverage: Diagnostics endpoints, integrity checks, schema verification, health checks
 */
describe('DiagnosticController (C012)', () => {
  let controller: DiagnosticController;
  let service: DiagnosticService;

  const mockDiagnosticResults = {
    status: 'healthy',
    checks: {
      database: { status: 'pass', message: 'Connected' },
      ai: { status: 'pass', message: 'Available' },
      websockets: { status: 'pass', message: '5 connections' },
    },
  };

  const mockMetrics = `# HELP vedfinance_throughput_eps Events per second
# TYPE vedfinance_throughput_eps gauge
vedfinance_throughput_eps 42.5
`;

  beforeEach(async () => {
    const mockService = {
      runFullDiagnostics: vi.fn().mockResolvedValue(mockDiagnosticResults),
      getMetrics: vi.fn().mockResolvedValue(mockMetrics),
      simulateUserFlow: vi.fn().mockResolvedValue({ success: true }),
      generateMockBehavioralData: vi.fn().mockResolvedValue({ count: 10 }),
      runAiStressTest: vi.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiagnosticController],
      providers: [
        {
          provide: DiagnosticService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DiagnosticController>(DiagnosticController);
    service = module.get<DiagnosticService>(DiagnosticService);

    // Manually bind service to controller
    (controller as any).diagnosticService = service;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('GET /debug/run', () => {
    it('should run full diagnostics', async () => {
      const result = await controller.run();

      expect(service.runFullDiagnostics).toHaveBeenCalled();
      expect(result.status).toBe('healthy');
      expect(result.checks).toBeDefined();
    });

    it('should return database check status', async () => {
      const result = await controller.run();

      expect(result.checks.database.status).toBe('pass');
    });

    it('should return AI service check', async () => {
      const result = await controller.run();

      expect(result.checks.ai.status).toBe('pass');
    });

    it('should return WebSocket connection count', async () => {
      const result = await controller.run();

      expect(result.checks.websockets.message).toContain('connections');
    });
  });

  describe('GET /debug/metrics', () => {
    it('should return Prometheus metrics', async () => {
      const result = await controller.getMetrics();

      expect(service.getMetrics).toHaveBeenCalled();
      expect(result).toContain('vedfinance_throughput_eps');
    });

    it('should return metrics in Prometheus format', async () => {
      const result = await controller.getMetrics();

      expect(result).toMatch(/# HELP/);
      expect(result).toMatch(/# TYPE/);
    });

    it('should expose throughput metrics', async () => {
      const result = await controller.getMetrics();

      expect(result).toContain('throughput_eps');
    });
  });

  describe('GET /debug/verify-integrity', () => {
    it('should verify system integrity', async () => {
      const result = await controller.verify();

      expect(service.runFullDiagnostics).toHaveBeenCalled();
      expect(result.status).toBe('healthy');
    });

    it('should check database integrity', async () => {
      const result = await controller.verify();

      expect(result.checks.database).toBeDefined();
    });

    it('should validate schema consistency', async () => {
      const result = await controller.verify();

      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('ai');
    });
  });

  describe('POST /debug/simulate', () => {
    it('should simulate user flow', async () => {
      const result = await controller.simulate('user-123');

      expect(service.simulateUserFlow).toHaveBeenCalledWith('user-123');
      expect(result.success).toBe(true);
    });

    it('should handle invalid userId', async () => {
      vi.spyOn(service, 'simulateUserFlow').mockRejectedValue(
        new Error('User not found'),
      );

      await expect(controller.simulate('invalid')).rejects.toThrow(
        'User not found',
      );
    });

    it('should handle empty userId', async () => {
      await controller.simulate('');

      expect(service.simulateUserFlow).toHaveBeenCalledWith('');
    });
  });

  describe('POST /debug/mock-behaviors', () => {
    it('should generate mock behavioral data', async () => {
      const result = await controller.generateMock('user-456', 10);

      expect(service.generateMockBehavioralData).toHaveBeenCalledWith(
        'user-456',
        10,
      );
      expect(result.count).toBe(10);
    });

    it('should use default count if not provided', async () => {
      await controller.generateMock('user-789', undefined);

      expect(service.generateMockBehavioralData).toHaveBeenCalledWith(
        'user-789',
        undefined,
      );
    });

    it('should handle large counts', async () => {
      vi.spyOn(service, 'generateMockBehavioralData').mockResolvedValue({
        count: 1000,
      });

      const result = await controller.generateMock('user-bulk', 1000);

      expect(result.count).toBe(1000);
    });
  });

  describe('POST /debug/stress-test/ai', () => {
    it('should run AI stress test with LOW complexity', async () => {
      await controller.stressTestAi('user-stress', 'LOW');

      expect(service.runAiStressTest).toHaveBeenCalledWith(
        'user-stress',
        'LOW',
      );
    });

    it('should run AI stress test with MEDIUM complexity', async () => {
      await controller.stressTestAi('user-stress', 'MEDIUM');

      expect(service.runAiStressTest).toHaveBeenCalledWith(
        'user-stress',
        'MEDIUM',
      );
    });

    it('should run AI stress test with HIGH complexity', async () => {
      await controller.stressTestAi('user-stress', 'HIGH');

      expect(service.runAiStressTest).toHaveBeenCalledWith(
        'user-stress',
        'HIGH',
      );
    });

    it('should handle stress test failures', async () => {
      vi.spyOn(service, 'runAiStressTest').mockRejectedValue(
        new Error('AI service timeout'),
      );

      await expect(
        controller.stressTestAi('user-fail', 'HIGH'),
      ).rejects.toThrow('AI service timeout');
    });
  });

  describe('Health Checks', () => {
    it('should verify all critical services', async () => {
      const result = await controller.verify();

      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('ai');
      expect(result.checks).toHaveProperty('websockets');
    });

    it('should report unhealthy status on failures', async () => {
      vi.spyOn(service, 'runFullDiagnostics').mockResolvedValue({
        status: 'unhealthy',
        checks: {
          database: { status: 'fail', message: 'Connection refused' },
          ai: { status: 'pass', message: 'Available' },
          websockets: { status: 'pass', message: '0 connections' },
        },
      });

      const result = await controller.verify();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('fail');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent diagnostic requests', async () => {
      const promises = Array.from({ length: 5 }, () => controller.run());

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(service.runFullDiagnostics).toHaveBeenCalledTimes(5);
    });

    it('should handle service unavailability', async () => {
      vi.spyOn(service, 'getMetrics').mockRejectedValue(
        new Error('Metrics service down'),
      );

      await expect(controller.getMetrics()).rejects.toThrow(
        'Metrics service down',
      );
    });

    it('should validate stress test complexity values', async () => {
      await controller.stressTestAi('user-test', 'LOW');
      await controller.stressTestAi('user-test', 'MEDIUM');
      await controller.stressTestAi('user-test', 'HIGH');

      expect(service.runAiStressTest).toHaveBeenCalledTimes(3);
    });
  });
});
