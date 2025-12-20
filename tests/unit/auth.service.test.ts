import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../apps/api/src/auth/auth.service';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockImplementation((pass, hash) => {
    if (pass === 'password123' && hash === 'hashed_password') return true;
    return false;
  }),
}));

// Simple Mocks
const mockUsersService = {
  findOne: async (email: string) => {
    if (email === 'exists@example.com') {
      return {
        id: '1',
        email: 'exists@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
        role: 'USER',
      };
    }
    return null;
  },
};

const mockJwtService = {
  sign: () => 'mock-jwt-token',
};

const mockPrisma = {
  refreshToken: {
    create: async () => ({}),
  },
};

let authService: AuthService;

beforeEach(() => {
  authService = new AuthService(
    mockUsersService as any,
    mockJwtService as any,
    mockPrisma as any
  );
  vi.clearAllMocks();
});

describe('AuthService', () => {
  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      const result = await authService.validateUser(
        'exists@example.com',
        'password123'
      );

      expect(result).toBeTruthy();
      expect(result?.email).toBe('exists@example.com');
    });

    it('should return null for non-existent user', async () => {
      const result = await authService.validateUser(
        'nonexistent@example.com',
        'password123'
      );

      expect(result).toBeNull();
    });

    it('should return null for wrong password', async () => {
      const result = await authService.validateUser(
        'exists@example.com',
        'wrongpassword'
      );

      expect(result).toBeNull();
    });
  });

  describe('generateTokens', () => {
    it('should create secure tokens', async () => {
      const tokens = await authService.generateTokens(
        '1',
        'test@example.com',
        'USER'
      );

      expect(tokens.access_token).toBeTruthy();
      expect(tokens.refresh_token).toBeTruthy();
      expect(tokens.refresh_token.length).toBe(128); // 64 bytes hex = 128 chars
    });
  });
});
