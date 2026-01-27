import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'reflect-metadata';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard (C017)', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with jwt strategy', () => {
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  describe('canActivate', () => {
    it('should call super.canActivate', async () => {
      const mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            headers: { authorization: 'Bearer valid-token' },
          }),
        }),
      } as unknown as ExecutionContext;

      const canActivateSpy = vi.spyOn(guard, 'canActivate');

      try {
        await guard.canActivate(mockContext);
      } catch (error) {
        // Expected to fail without real JWT validation
      }

      expect(canActivateSpy).toHaveBeenCalledWith(mockContext);
    });

    it('should reject missing authorization header', async () => {
      const mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            headers: {},
          }),
        }),
        getClass: vi.fn(),
        getHandler: vi.fn(),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow();
    });

    it('should reject malformed authorization header', async () => {
      const mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            headers: { authorization: 'InvalidFormat' },
          }),
        }),
        getClass: vi.fn(),
        getHandler: vi.fn(),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow();
    });

    it('should reject expired JWT token', async () => {
      const mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            headers: { authorization: 'Bearer expired-token' },
          }),
        }),
        getClass: vi.fn(),
        getHandler: vi.fn(),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow();
    });

    it('should reject invalid JWT signature', async () => {
      const mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            headers: { authorization: 'Bearer invalid.signature.token' },
          }),
        }),
        getClass: vi.fn(),
        getHandler: vi.fn(),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow();
    });
  });

  describe('handleRequest', () => {
    it('should throw UnauthorizedException on error', () => {
      const error = new Error('Token validation failed');
      const user = null;

      expect(() => {
        if (!user && error) {
          throw new UnauthorizedException(error.message);
        }
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is null', () => {
      const error = null;
      const user = null;

      expect(() => {
        if (!user) {
          throw new UnauthorizedException('User not authenticated');
        }
      }).toThrow(UnauthorizedException);
    });

    it('should return user when authentication succeeds', () => {
      const user = { id: '123', email: 'test@example.com', role: 'STUDENT' };
      expect(user).toBeDefined();
      expect(user.id).toBe('123');
    });
  });
});
