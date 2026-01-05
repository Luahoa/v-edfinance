import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { DynamicConfigService } from './dynamic-config.service';

describe('DynamicConfigService', () => {
  let service: DynamicConfigService;
  let prismaService: PrismaService;

  const mockSystemSettings = [
    {
      key: 'app.maintenance_mode',
      value: 'false',
      description: null,
      updatedAt: new Date(),
    },
    {
      key: 'app.max_file_size',
      value: '10485760',
      description: null,
      updatedAt: new Date(),
    },
    {
      key: 'feature.ai_nudges',
      value: 'true',
      description: null,
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockPrismaService = {
      systemSettings: {
        findMany: vi.fn().mockResolvedValue(mockSystemSettings),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicConfigService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DynamicConfigService>(DynamicConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should load config on module init in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalVitest = process.env.VITEST;
      process.env.NODE_ENV = 'production';
      delete process.env.VITEST; // Remove VITEST env var to simulate production

      await service.onModuleInit();

      expect(prismaService.systemSettings.findMany).toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
      if (originalVitest) process.env.VITEST = originalVitest;
    });

    it('should skip loading config in test environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      vi.clearAllMocks();
      await service.onModuleInit();

      expect(prismaService.systemSettings.findMany).not.toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
    });

    it('should skip loading config when VITEST is set', async () => {
      const originalVitest = process.env.VITEST;
      process.env.VITEST = 'true';

      vi.clearAllMocks();
      await service.onModuleInit();

      expect(prismaService.systemSettings.findMany).not.toHaveBeenCalled();
      process.env.VITEST = originalVitest;
    });
  });

  describe('loadConfig', () => {
    it('should load settings from database', async () => {
      await service.loadConfig();

      expect(prismaService.systemSettings.findMany).toHaveBeenCalled();
    });

    it('should cache loaded settings', async () => {
      await service.loadConfig();

      expect(service.get('app.maintenance_mode')).toBe('false');
      expect(service.get('app.max_file_size')).toBe('10485760');
      expect(service.get('feature.ai_nudges')).toBe('true');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(prismaService.systemSettings.findMany).mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.loadConfig()).resolves.not.toThrow();
    });

    it('should log error when database fails', async () => {
      const loggerSpy = vi.spyOn(service['logger'], 'error');
      vi.mocked(prismaService.systemSettings.findMany).mockRejectedValue(
        new Error('Database error'),
      );

      await service.loadConfig();

      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      await service.loadConfig();
    });

    it('should retrieve cached config value', () => {
      const value = service.get('app.maintenance_mode');

      expect(value).toBe('false');
    });

    it('should return default value when key not found', () => {
      const value = service.get('non.existent.key', 'default_value');

      expect(value).toBe('default_value');
    });

    it('should return empty string when no default provided', () => {
      const value = service.get('non.existent.key');

      expect(value).toBe('');
    });

    it('should handle multiple sequential gets', () => {
      expect(service.get('app.maintenance_mode')).toBe('false');
      expect(service.get('app.max_file_size')).toBe('10485760');
      expect(service.get('feature.ai_nudges')).toBe('true');
    });
  });

  describe('Config Updates', () => {
    it('should reflect new values after reload', async () => {
      await service.loadConfig();
      expect(service.get('app.maintenance_mode')).toBe('false');

      const updatedSettings = [
        { key: mockSystemSettings[0].key, value: 'true', description: null, updatedAt: mockSystemSettings[0].updatedAt },
        mockSystemSettings[1],
        mockSystemSettings[2],
      ];
      vi.mocked(prismaService.systemSettings.findMany).mockResolvedValue(
        updatedSettings,
      );

      await service.loadConfig();
      expect(service.get('app.maintenance_mode')).toBe('true');
    });

    it('should handle empty settings array', async () => {
      vi.mocked(prismaService.systemSettings.findMany).mockResolvedValue([]);

      await service.loadConfig();

      expect(service.get('any.key', 'default')).toBe('default');
    });
  });

  describe('Edge Cases', () => {
    it('should handle settings with special characters', async () => {
      const specialSettings = [
        {
          key: 'app.special!@#$%',
          value: 'test_value',
          description: null,
          updatedAt: new Date(),
        },
      ];
      vi.mocked(prismaService.systemSettings.findMany).mockResolvedValue(
        specialSettings,
      );

      await service.loadConfig();

      expect(service.get('app.special!@#$%')).toBe('test_value');
    });

    it('should handle settings with empty values', async () => {
      const emptySettings = [
        {
          key: 'app.empty',
          value: '',
          description: null,
          updatedAt: new Date(),
        },
      ];
      vi.mocked(prismaService.systemSettings.findMany).mockResolvedValue(
        emptySettings,
      );

      await service.loadConfig();

      expect(service.get('app.empty')).toBe('');
    });

    it('should handle very long setting values', async () => {
      const longValue = 'x'.repeat(10000);
      const longSettings = [
        {
          key: 'app.long',
          value: longValue,
          description: null,
          updatedAt: new Date(),
        },
      ];
      vi.mocked(prismaService.systemSettings.findMany).mockResolvedValue(
        longSettings,
      );

      await service.loadConfig();

      expect(service.get('app.long')).toBe(longValue);
    });
  });
});
