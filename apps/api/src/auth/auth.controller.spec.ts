import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: vi.fn(),
            register: vi.fn(),
            refreshToken: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    // @ts-ignore
    controller.authService = service;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should call authService.login', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      vi.spyOn(service, 'login').mockResolvedValue({} as any);
      await controller.signIn(dto);
      expect(service.login).toHaveBeenCalledWith(dto);
    });

    it('should return access_token, refresh_token, and user object', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        userId: 'user-id-123',
        user: { id: 'user-id-123', email: 'test@example.com', role: 'STUDENT' },
      };
      vi.spyOn(service, 'login').mockResolvedValue(mockResponse);

      const result = await controller.signIn(dto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('Validation (Integration)', () => {
    it('should fail if email is invalid', async () => {
      const { validate } = await import('class-validator');
      const dto = new LoginDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should fail if password is too short in RegisterDto', async () => {
      const { validate } = await import('class-validator');
      const dto = new RegisterDto();
      dto.email = 'test@example.com';
      dto.password = '123';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });
  });

  describe('signUp', () => {
    it('should call authService.register', async () => {
      const dto = { email: 't@e.com', password: 'p', name: 'T' } as any;
      vi.spyOn(service, 'register').mockResolvedValue({} as any);
      await controller.signUp(dto);
      expect(service.register).toHaveBeenCalledWith(dto);
    });

    it('should return tokens and user on successful registration', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password123',
        role: 'STUDENT',
      } as any;
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        userId: 'new-user-id',
        user: { id: 'new-user-id', email: 'new@example.com', role: 'STUDENT' },
      };
      vi.spyOn(service, 'register').mockResolvedValue(mockResponse);

      const result = await controller.signUp(dto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.userId).toBe('new-user-id');
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken', async () => {
      const dto = { refreshToken: 'token' };
      vi.spyOn(service, 'refreshToken').mockResolvedValue({} as any);
      await controller.refresh(dto);
      expect(service.refreshToken).toHaveBeenCalledWith(dto);
    });

    it('should return new tokens on successful refresh', async () => {
      const dto = { refreshToken: 'valid-refresh-token' };
      const mockResponse = {
        access_token: 'refreshed-access-token',
        refresh_token: 'new-refresh-token',
        userId: 'user-id',
        user: { id: 'user-id', email: 'user@example.com', role: 'STUDENT' },
      };
      vi.spyOn(service, 'refreshToken').mockResolvedValue(mockResponse);

      const result = await controller.refresh(dto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.access_token).toBe('refreshed-access-token');
    });
  });

  describe('Guards', () => {
    it('should have JwtAuthGuard on profile-related endpoints in UsersController', async () => {
      const { UsersController } = await import('../users/users.controller');
      const { JwtAuthGuard } = await import('./jwt-auth.guard');
      const guards = Reflect.getMetadata(
        '__guards__',
        UsersController.prototype.getProfile,
      );
      expect(guards).toContain(JwtAuthGuard);
    });
  });

  describe('Edge Cases: Expired Tokens', () => {
    it('should reject expired refresh token', async () => {
      const dto = { refreshToken: 'expired-token' };
      const error = new (require('@nestjs/common').UnauthorizedException)(
        'Invalid or expired refresh token',
      );
      vi.spyOn(service, 'refreshToken').mockRejectedValue(error);

      await expect(controller.refresh(dto)).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });

    it('should handle missing refresh token', async () => {
      const dto = { refreshToken: '' };

      try {
        await controller.refresh(dto);
        expect.fail('Should have thrown BadRequestException');
      } catch (error: any) {
        expect(error.message).toContain('Refresh token is required');
      }
    });
  });

  describe('Edge Cases: Password Reset Flow', () => {
    it('should reject login with invalid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'wrong-password' };
      const error = new (require('@nestjs/common').UnauthorizedException)(
        'Invalid email or password',
      );
      vi.spyOn(service, 'login').mockRejectedValue(error);

      await expect(controller.signIn(dto)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should reject login with non-existent email', async () => {
      const dto = { email: 'nonexistent@example.com', password: 'password123' };
      const error = new (require('@nestjs/common').UnauthorizedException)(
        'Invalid email or password',
      );
      vi.spyOn(service, 'login').mockRejectedValue(error);

      await expect(controller.signIn(dto)).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });

  describe('Edge Cases: JWT Refresh Race Conditions', () => {
    it('should handle token reuse detection', async () => {
      const dto = { refreshToken: 'reused-token' };
      const error = new (require('@nestjs/common').UnauthorizedException)(
        'Invalid or expired refresh token',
      );
      vi.spyOn(service, 'refreshToken').mockRejectedValue(error);

      await expect(controller.refresh(dto)).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });

    it('should generate new tokens on valid refresh', async () => {
      const dto = { refreshToken: 'valid-token' };
      const mockResponse = {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        userId: 'user-123',
        user: { id: 'user-123', email: 'test@example.com', role: 'STUDENT' },
      };
      vi.spyOn(service, 'refreshToken').mockResolvedValue(mockResponse);

      const result = await controller.refresh(dto);

      expect(result.access_token).not.toBe(dto.refreshToken);
      expect(result.refresh_token).not.toBe(dto.refreshToken);
    });
  });

  describe('Edge Cases: Registration Conflicts', () => {
    it('should reject duplicate email registration', async () => {
      const dto = {
        email: 'existing@example.com',
        password: 'password123',
        role: 'STUDENT',
      } as any;
      const error = new (require('@nestjs/common').ConflictException)(
        'Email already in use',
      );
      vi.spyOn(service, 'register').mockRejectedValue(error);

      await expect(controller.signUp(dto)).rejects.toThrow(
        'Email already in use',
      );
    });
  });
});
