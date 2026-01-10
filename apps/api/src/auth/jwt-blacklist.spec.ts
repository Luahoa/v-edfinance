import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { JwtBlacklistService } from './jwt-blacklist.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

describe('JWT Blacklist (Logout Functionality)', () => {
  let authService: AuthService;
  let jwtBlacklistService: JwtBlacklistService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  const mockUsersService = {
    findOne: vi.fn(),
    create: vi.fn(),
  };

  const mockJwtService = {
    sign: vi.fn(() => 'mock.jwt.token'),
    decode: vi.fn(() => ({ exp: Math.floor(Date.now() / 1000) + 900 })),
  };

  const mockJwtBlacklistService = {
    trackUserToken: vi.fn(),
    blacklistToken: vi.fn(),
    isTokenBlacklisted: vi.fn(() => Promise.resolve(false)),
    removeUserToken: vi.fn(),
    blacklistAllUserTokens: vi.fn(),
    getUserTokens: vi.fn(() => Promise.resolve([])),
  };

  const mockConfigService = {
    get: vi.fn((key: string, defaultValue?: any) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_EXPIRATION_SECONDS') return 900;
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: JwtBlacklistService, useValue: mockJwtBlacklistService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtBlacklistService = module.get<JwtBlacklistService>(JwtBlacklistService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('logout', () => {
    it('should blacklist the current token', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer mock.jwt.token',
        },
        user: { id: 'user-123' },
      } as any;

      const result = await authService.logout(mockRequest);

      expect(result).toEqual({ message: 'Logout successful' });
      expect(jwtBlacklistService.blacklistToken).toHaveBeenCalledWith(
        'mock.jwt.token',
        expect.any(Number),
      );
      expect(jwtBlacklistService.removeUserToken).toHaveBeenCalledWith(
        'user-123',
        'mock.jwt.token',
      );
    });

    it('should throw UnauthorizedException if token is missing', async () => {
      const mockRequest = {
        headers: {},
        user: { id: 'user-123' },
      } as any;

      await expect(authService.logout(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.logout(mockRequest)).rejects.toThrow(
        'Token not found',
      );
    });
  });

  describe('logoutAll', () => {
    it('should blacklist all user tokens and revoke refresh tokens', async () => {
      const mockRequest = {
        user: { id: 'user-123' },
      } as any;

      mockJwtBlacklistService.getUserTokens.mockResolvedValue([
        'token1',
        'token2',
      ]);

      const result = await authService.logoutAll(mockRequest);

      expect(result).toEqual({ message: 'Logged out from all devices' });
      expect(jwtBlacklistService.blacklistAllUserTokens).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: { revoked: true },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const mockRequest = {
        user: null,
      } as any;

      await expect(authService.logoutAll(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.logoutAll(mockRequest)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('generateTokens', () => {
    it('should track access token when generating tokens', async () => {
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'refresh-token-id',
        token: 'hashed-token',
        userId: 'user-123',
        expiresAt: new Date(),
        revoked: false,
      });

      const result = await authService.generateTokens(
        'user-123',
        'test@example.com',
        'student',
      );

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(jwtBlacklistService.trackUserToken).toHaveBeenCalledWith(
        'user-123',
        'mock.jwt.token',
        900,
      );
    });
  });

  describe('JwtBlacklistService', () => {
    let blacklistService: JwtBlacklistService;
    let mockCacheManager: any;

    beforeEach(async () => {
      mockCacheManager = {
        set: vi.fn(),
        get: vi.fn(),
        del: vi.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JwtBlacklistService,
          { provide: 'CACHE_MANAGER', useValue: mockCacheManager },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      blacklistService = module.get<JwtBlacklistService>(JwtBlacklistService);
      
      // Manual binding to ensure mocks are properly injected
      (blacklistService as any).cacheManager = mockCacheManager;
      (blacklistService as any).configService = mockConfigService;
      
      vi.clearAllMocks();
    });

    it('should blacklist a token with TTL', async () => {
      await blacklistService.blacklistToken('test-token', 900);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'jwt:blacklist:test-token',
        'revoked',
        900000, // 900 seconds * 1000 ms
      );
    });

    it('should detect blacklisted tokens', async () => {
      mockCacheManager.get.mockResolvedValue('revoked');

      const result = await blacklistService.isTokenBlacklisted('test-token');

      expect(result).toBe(true);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        'jwt:blacklist:test-token',
      );
    });

    it('should return false for non-blacklisted tokens', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await blacklistService.isTokenBlacklisted('test-token');

      expect(result).toBe(false);
    });

    it('should track user tokens', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      await blacklistService.trackUserToken('user-123', 'token-1', 900);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'jwt:user:user-123',
        JSON.stringify(['token-1']),
        900000,
      );
    });

    it('should blacklist all user tokens', async () => {
      mockCacheManager.get.mockResolvedValue(
        JSON.stringify(['token-1', 'token-2']),
      );

      await blacklistService.blacklistAllUserTokens('user-123');

      // Should call set 2 times (once for each token blacklist)
      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
      // Should delete user token list
      expect(mockCacheManager.del).toHaveBeenCalledWith('jwt:user:user-123');
    });
  });
});
