import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { JwtStrategy } from './jwt.strategy';
import { JwtBlacklistService } from './jwt-blacklist.service';

describe('JwtStrategy', () => {
  const mockJwtBlacklistService = {
    isTokenBlacklisted: vi.fn().mockResolvedValue(false),
    addToBlacklist: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn().mockReturnValue('test-secret-key-for-jwt-testing'),
  };

  // Create strategy directly without NestJS DI
  const strategy = new JwtStrategy(
    mockConfigService as unknown as ConfigService,
    mockJwtBlacklistService as unknown as JwtBlacklistService,
  );

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer test-token',
      },
    };

    it('should extract user from JWT payload', async () => {
      const payload = {
        sub: 'user-id-123',
        email: 'test@example.com',
        role: 'STUDENT',
      };

      const result = await strategy.validate(mockRequest as any, payload);

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

      const result = await strategy.validate(mockRequest as any, payload);

      expect(result.role).toBe('ADMIN');
      expect(result.id).toBe('admin-id');
    });

    it('should map sub to both id and userId', async () => {
      const payload = {
        sub: 'unique-user-id',
        email: 'user@example.com',
        role: 'TEACHER',
      };

      const result = await strategy.validate(mockRequest as any, payload);

      expect(result.id).toBe('unique-user-id');
      expect(result.userId).toBe('unique-user-id');
    });

    it('should preserve email from payload', async () => {
      const payload = {
        sub: 'user-id',
        email: 'specific@domain.com',
        role: 'STUDENT',
      };

      const result = await strategy.validate(mockRequest as any, payload);

      expect(result.email).toBe('specific@domain.com');
    });

    it('should throw UnauthorizedException for blacklisted token', async () => {
      mockJwtBlacklistService.isTokenBlacklisted.mockResolvedValueOnce(true);

      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: 'STUDENT',
      };

      await expect(strategy.validate(mockRequest as any, payload)).rejects.toThrow(
        'Token has been revoked',
      );
    });
  });

  describe('constructor', () => {
    it('should use JWT_SECRET from ConfigService', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should throw error when JWT_SECRET is missing', () => {
      const configWithNoSecret = {
        get: vi.fn().mockReturnValue(undefined),
      };

      expect(() => {
        new JwtStrategy(
          configWithNoSecret as unknown as ConfigService,
          mockJwtBlacklistService as unknown as JwtBlacklistService,
        );
      }).toThrow('CRITICAL SECURITY ERROR');
    });
  });
});
