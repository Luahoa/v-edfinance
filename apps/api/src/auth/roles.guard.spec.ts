import { type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from './roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    // Manually bind reflector to fix NestJS TestingModule mock binding issue
    (guard as any).reflector = reflector;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const createMockContext = (user: any): ExecutionContext => {
      return {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({ user }),
        }),
      } as any;
    };

    it('should allow access when no roles required', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockContext({ role: 'STUDENT' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role (STUDENT)', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['STUDENT']);
      const context = createMockContext({ role: 'STUDENT' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should allow access when user has required role (TEACHER)', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['TEACHER']);
      const context = createMockContext({ role: 'TEACHER' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role (ADMIN)', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      const context = createMockContext({ role: 'ADMIN' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        'TEACHER',
        'ADMIN',
      ]);
      const context = createMockContext({ role: 'ADMIN' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user lacks required role', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      const context = createMockContext({ role: 'STUDENT' });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access when user has no role', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['STUDENT']);
      const context = createMockContext({});

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should handle multiple required roles (deny if none match)', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        'TEACHER',
        'ADMIN',
      ]);
      const context = createMockContext({ role: 'STUDENT' });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should extract roles from handler and class metadata', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      const context = createMockContext({ role: 'ADMIN' });

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});
