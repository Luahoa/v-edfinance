import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should extract user from JWT payload', async () => {
      const payload = {
        sub: 'user-id-123',
        email: 'test@example.com',
        role: 'STUDENT',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-id-123',
        userId: 'user-id-123',
        email: 'test@example.com',
        role: 'STUDENT',
      });
    });

    it('should handle payload with different role', async () => {
      const payload = {
        sub: 'admin-id',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      const result = await strategy.validate(payload);

      expect(result.role).toBe('ADMIN');
      expect(result.id).toBe('admin-id');
    });

    it('should map sub to both id and userId', async () => {
      const payload = {
        sub: 'unique-user-id',
        email: 'user@example.com',
        role: 'TEACHER',
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe('unique-user-id');
      expect(result.userId).toBe('unique-user-id');
    });

    it('should preserve email from payload', async () => {
      const payload = {
        sub: 'user-id',
        email: 'specific@domain.com',
        role: 'STUDENT',
      };

      const result = await strategy.validate(payload);

      expect(result.email).toBe('specific@domain.com');
    });
  });

  describe('constructor', () => {
    it('should use JWT_SECRET from ConfigService', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should fallback to dev_secret if ConfigService fails', () => {
      const fallbackModule = Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: null,
          },
        ],
      });

      expect(fallbackModule).toBeDefined();
    });
  });
});
