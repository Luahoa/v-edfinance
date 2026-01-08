import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

// Helper to create complete User mock
function createMockUser(partial: Partial<User>): Omit<User, 'passwordHash'> {
  return {
    id: partial.id || '1',
    email: partial.email || 'test@example.com',
    name: partial.name || null,
    role: partial.role || 'STUDENT',
    points: partial.points || 0,
    preferredLocale: partial.preferredLocale || 'vi',
    preferredLanguage: partial.preferredLanguage || null,
    dateOfBirth: partial.dateOfBirth || null,
    moderationStrikes: partial.moderationStrikes || 0,
    failedLoginAttempts: partial.failedLoginAttempts || 0,
    lockedUntil: partial.lockedUntil || null,
    stripeCustomerId: partial.stripeCustomerId || null,
    metadata: partial.metadata || null,
    createdAt: partial.createdAt || new Date(),
    updatedAt: partial.updatedAt || new Date(),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let prismaService: any;

  beforeEach(async () => {
    usersService = {
      findOne: vi.fn(),
      create: vi.fn(),
    };
    jwtService = {
      sign: vi.fn().mockReturnValue('mock-token'),
    };
    prismaService = {
      refreshToken: {
        create: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn((cb) => cb(prismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTokens', () => {
    it('should generate tokens and save to DB', async () => {
      prismaService.refreshToken.create.mockResolvedValue({});
      const result = await service.generateTokens(
        '1',
        'test@example.com',
        'USER',
      );
      expect(result).toHaveProperty('access_token');
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user without password if valid', async () => {
      const password = 'password123';
      const passwordHash = await bcrypt.hash(password, 10);
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        name: null,
        role: 'STUDENT',
        points: 0,
        preferredLocale: 'vi',
        preferredLanguage: null,
        dateOfBirth: null,
        moderationStrikes: 0,
        stripeCustomerId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', password);
      expect(result).toEqual({ id: '1', email: 'test@example.com' });
    });

    it('should return null if password invalid', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        name: null,
        role: 'STUDENT',
        points: 0,
        preferredLocale: 'vi',
        preferredLanguage: null,
        dateOfBirth: null,
        moderationStrikes: 0,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findOne.mockResolvedValue(mockUser);

      // VED-IU3: Mock Prisma update to track failed attempts
      prismaService.user = {
        update: vi.fn().mockResolvedValue({
          id: '1',
          email: 'test@example.com',
          passwordHash: 'hash',
          failedLoginAttempts: 1,
          lockedUntil: null,
          name: null,
          role: 'STUDENT',
          points: 0,
          preferredLocale: 'vi',
          preferredLanguage: null,
          dateOfBirth: null,
          stripeCustomerId: null,
          moderationStrikes: 0,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      const result = await service.validateUser(
        'test@example.com',
        'wrong-password',
      );
      expect(result).toBeNull();
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          failedLoginAttempts: 1,
        }),
      });
    });

    it('should return null if user not found', async () => {
      usersService.findOne.mockResolvedValue(null);

      const result = await service.validateUser(
        'notfound@example.com',
        'password',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if validation fails', async () => {
      vi.spyOn(service, 'validateUser').mockResolvedValue(null);
      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return access and refresh tokens on success', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        name: { vi: 'Test User', en: 'Test User', zh: '测试用户' },
        role: 'USER',
        points: 0,
        preferredLocale: 'vi',
        dateOfBirth: null,
        moderationStrikes: 0,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      vi.spyOn(service, 'validateUser').mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.userId).toBe('1');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens correctly', async () => {
      const mockToken = {
        id: 'token-id',
        token: 'hashed-token',
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 10000),
        revoked: false,
        user: createMockUser({ id: 'user-id', email: 'test@example.com', role: 'USER' }),
      };

      prismaService.refreshToken.findUnique = vi
        .fn()
        .mockResolvedValue(mockToken);
      prismaService.refreshToken.update = vi.fn().mockResolvedValue({});
      prismaService.refreshToken.create = vi.fn().mockResolvedValue({});

      const result = await service.refreshToken({
        refreshToken: 'valid-token',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(prismaService.refreshToken.update).toHaveBeenCalled();
    });

    it('should throw if token is expired', async () => {
      const mockToken = {
        expiresAt: new Date(Date.now() - 10000),
        revoked: false,
      };
      prismaService.refreshToken.findUnique = vi
        .fn()
        .mockResolvedValue(mockToken);

      await expect(
        service.refreshToken({ refreshToken: 'expired' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should revoke all tokens if reused', async () => {
      const mockToken = {
        userId: 'user-id',
        revoked: true,
        expiresAt: new Date(Date.now() + 10000),
      };
      prismaService.refreshToken.findUnique = vi
        .fn()
        .mockResolvedValue(mockToken);
      prismaService.refreshToken.updateMany = vi.fn().mockResolvedValue({});

      await expect(
        service.refreshToken({ refreshToken: 'reused' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should create user and return tokens', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password',
        role: 'USER',
      };
      const mockUser = createMockUser({ id: '2', email: 'new@example.com', role: 'USER' });

      usersService.findOne.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      vi.spyOn(service, 'generateTokens').mockResolvedValue({
        access_token: 'at',
        refresh_token: 'rt',
        userId: '2',
        user: mockUser,
      });

      const result = await service.register(registerDto as any);
      expect(result.userId).toBe('2');
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const { ConflictException } = await import('@nestjs/common');
      const registerDto = {
        email: 'existing@example.com',
        password: 'password',
        role: 'USER',
      };

      usersService.findOne.mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
      });

      await expect(service.register(registerDto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should hash password with bcrypt before saving', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'plainPassword123',
        role: 'USER',
      };
      const mockUser = createMockUser({ id: '2', email: 'new@example.com', role: 'USER' });

      usersService.findOne.mockResolvedValue(null);
      usersService.create.mockImplementation((data: any) => {
        expect(data.passwordHash).toBeDefined();
        expect(data.passwordHash).not.toBe('plainPassword123');
        return Promise.resolve(mockUser);
      });

      vi.spyOn(service, 'generateTokens').mockResolvedValue({
        access_token: 'at',
        refresh_token: 'rt',
        userId: '2',
        user: mockUser,
      });

      await service.register(registerDto as any);
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should handle Prisma P2002 error (duplicate email)', async () => {
      const { ConflictException } = await import('@nestjs/common');
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'password',
        role: 'USER',
      };

      usersService.findOne.mockResolvedValue(null);
      usersService.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.register(registerDto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should generate default i18n name from email if name not provided', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password',
        role: 'USER',
      };
      const mockUser = { id: '2', email: 'test@example.com', role: 'USER' };

      usersService.findOne.mockResolvedValue(null);
      usersService.create.mockImplementation((data: any) => {
        expect(data.name).toEqual({
          vi: 'test',
          en: 'test',
          zh: 'test',
        });
        return Promise.resolve(mockUser);
      });

      vi.spyOn(service, 'generateTokens').mockResolvedValue({
        access_token: 'at',
        refresh_token: 'rt',
        userId: '2',
        user: mockUser,
      });

      await service.register(registerDto as any);
    });
  });

  describe('Token Rotation Edge Cases (S001)', () => {
    it('should handle concurrent login requests', async () => {
      const mockUser = createMockUser({ id: 'u1', email: 'concurrent@example.com', role: 'USER' });
      vi.spyOn(service, 'validateUser').mockResolvedValue(mockUser);

      const loginDto = {
        email: 'concurrent@example.com',
        password: 'password',
      };
      const promises = [
        service.login(loginDto),
        service.login(loginDto),
        service.login(loginDto),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(prismaService.refreshToken.create).toHaveBeenCalledTimes(3);
      results.forEach((r) => {
        expect(r).toHaveProperty('access_token');
        expect(r).toHaveProperty('refresh_token');
      });
    });

    it('should handle refresh token near expiry', async () => {
      const nearExpiryDate = new Date(Date.now() + 1000);
      const mockToken = {
        id: 'token-id',
        token: 'hashed-token',
        userId: 'user-id',
        expiresAt: nearExpiryDate,
        revoked: false,
        user: createMockUser({ id: 'user-id', email: 'test@example.com', role: 'USER' }),
      };

      prismaService.refreshToken.findUnique = vi
        .fn()
        .mockResolvedValue(mockToken);
      prismaService.refreshToken.update = vi.fn().mockResolvedValue({});
      prismaService.refreshToken.create = vi.fn().mockResolvedValue({});

      const result = await service.refreshToken({
        refreshToken: 'valid-token',
      });
      expect(result).toHaveProperty('access_token');
    });

    it('should reject refresh token exactly at expiry boundary', async () => {
      const expiredToken = {
        id: 'token-id',
        expiresAt: new Date(Date.now() - 1),
        revoked: false,
        user: createMockUser({ id: 'user-id', email: 'test@example.com', role: 'USER' }),
      };
      prismaService.refreshToken.findUnique = vi
        .fn()
        .mockResolvedValue(expiredToken);
      prismaService.refreshToken.update = vi.fn().mockResolvedValue({});

      await expect(
        service.refreshToken({ refreshToken: 'boundary' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle missing refresh token in database', async () => {
      prismaService.refreshToken.findUnique = vi.fn().mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'non-existent' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Password Reset Race Conditions (S001)', () => {
    it('should handle empty or null password gracefully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hash',
        failedLoginAttempts: 0,
        lockedUntil: null,
      };
      usersService.findOne.mockResolvedValue(mockUser);

      // VED-IU3: Mock Prisma update
      prismaService.user = {
        update: vi.fn().mockResolvedValue({
          id: '1',
          email: 'test@example.com',
          passwordHash: 'hash',
          failedLoginAttempts: 1,
          lockedUntil: null,
          name: null,
          role: 'STUDENT',
          points: 0,
          preferredLocale: 'vi',
          preferredLanguage: null,
          dateOfBirth: null,
          stripeCustomerId: null,
          moderationStrikes: 0,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      const result = await service.validateUser('test@example.com', '');
      expect(result).toBeNull();
    });

    it('should handle concurrent password validation attempts', async () => {
      const password = 'password123';
      const passwordHash = await bcrypt.hash(password, 10);
      const mockUser = {
        id: '1',
        email: 'concurrent@example.com',
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      usersService.findOne.mockResolvedValue(mockUser);

      // VED-IU3: Mock Prisma update for successful login
      prismaService.user = {
        update: vi.fn().mockResolvedValue({
          id: '1',
          email: 'concurrent@example.com',
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
          name: null,
          role: 'STUDENT',
          points: 0,
          preferredLocale: 'vi',
          preferredLanguage: null,
          dateOfBirth: null,
          stripeCustomerId: null,
          moderationStrikes: 0,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      const promises = [
        service.validateUser('concurrent@example.com', password),
        service.validateUser('concurrent@example.com', password),
        service.validateUser('concurrent@example.com', password),
      ];

      const results = await Promise.all(promises);
      expect(results.every((r) => r !== null && r.id === '1')).toBe(true);
    });

    it('should prevent timing attacks on user lookup', async () => {
      usersService.findOne.mockResolvedValue(null);

      const startNonExistent = Date.now();
      await service.validateUser('nonexistent@example.com', 'password');
      const durationNonExistent = Date.now() - startNonExistent;

      const mockUser = {
        id: '1',
        email: 'exists@example.com',
        passwordHash: await bcrypt.hash('correct', 10),
        failedLoginAttempts: 0,
        lockedUntil: null,
      };
      usersService.findOne.mockResolvedValue(mockUser);

      // VED-IU3: Mock Prisma update
      prismaService.user = {
        update: vi.fn().mockResolvedValue({
          id: '1',
          email: 'exists@example.com',
          passwordHash: await bcrypt.hash('correct', 10),
          failedLoginAttempts: 1,
          lockedUntil: null,
          name: null,
          role: 'STUDENT',
          points: 0,
          preferredLocale: 'vi',
          preferredLanguage: null,
          dateOfBirth: null,
          stripeCustomerId: null,
          moderationStrikes: 0,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      const startWrongPassword = Date.now();
      await service.validateUser('exists@example.com', 'wrong');
      const durationWrongPassword = Date.now() - startWrongPassword;

      const timingDiff = Math.abs(durationNonExistent - durationWrongPassword);
      expect(timingDiff).toBeLessThan(500);
    });
  });

  describe('Login Error Handling (S001)', () => {
    it('should handle JWT signing failure gracefully', async () => {
      const mockUser = createMockUser({ id: 'u1', email: 'test@example.com', role: 'USER' });
      vi.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      jwtService.sign = vi.fn().mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow('Could not complete login process');
    });

    it('should handle database errors during token generation', async () => {
      const mockUser = createMockUser({ id: 'u1', email: 'test@example.com', role: 'USER' });
      vi.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      prismaService.refreshToken.create.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow('Could not complete login process');
    });
  });

  describe('Token Security Edge Cases (S001)', () => {
    it('should generate unique refresh tokens for same user', async () => {
      const tokens = new Set();
      for (let i = 0; i < 5; i++) {
        const result = await service.generateTokens(
          'u1',
          'test@example.com',
          'USER',
        );
        tokens.add(result.refresh_token);
      }
      expect(tokens.size).toBe(5);
    });

    it('should hash refresh tokens before storage', async () => {
      await service.generateTokens('u1', 'test@example.com', 'USER');

      expect(prismaService.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: expect.not.stringMatching(/^[0-9a-f]{128}$/),
          }),
        }),
      );
    });

    it('should revoke all user tokens on token reuse detection', async () => {
      const revokedToken = {
        userId: 'u1',
        revoked: true,
        expiresAt: new Date(Date.now() + 10000),
      };
      prismaService.refreshToken.findUnique = vi
        .fn()
        .mockResolvedValue(revokedToken);
      prismaService.refreshToken.updateMany = vi
        .fn()
        .mockResolvedValue({ count: 3 });

      await expect(
        service.refreshToken({ refreshToken: 'reused-token' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          data: { revoked: true },
        }),
      );
    });
  });
});
