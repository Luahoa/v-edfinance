import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagnosticService } from './diagnostic.service';

describe('DiagnosticService', () => {
  let service: DiagnosticService;
  let mockPrisma: any;
  let mockAi: any;
  let mockSocial: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      $queryRaw: vi.fn(),
      behaviorLog: {
        count: vi.fn(),
        create: vi.fn(),
      },
      course: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      user: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
      },
      chatThread: {
        findFirst: vi.fn(),
      },
    };
    mockAi = {
      createThread: vi.fn(),
      generateResponse: vi.fn(),
    };
    mockSocial = {
      connectedClients: new Map(),
      getConnectedClientsCount: vi.fn().mockReturnValue(0),
    };
    service = new DiagnosticService(mockPrisma, mockAi, mockSocial);
  });

  describe('runFullDiagnostics', () => {
    it('should run all diagnostic checks', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([1]);
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);
      mockPrisma.user.upsert.mockResolvedValue({ id: 'test-id' });
      mockPrisma.behaviorLog.create.mockResolvedValue({ eventType: 'MOCK' });

      const results = await service.runFullDiagnostics();

      expect(results).toHaveProperty('database');
      expect(results).toHaveProperty('aiModel');
      expect(results).toHaveProperty('integrity');
      expect(results.database.status).toBe('OK');
    });
  });

  describe('generateMockBehavioralData', () => {
    it('should generate requested number of logs', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log' });
      const logs = await service.generateMockBehavioralData('user-1', 5);
      expect(logs).toHaveLength(5);
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledTimes(5);
    });
  });
});
