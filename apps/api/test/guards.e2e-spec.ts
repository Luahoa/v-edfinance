import type { INestApplication } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthModule } from '../src/auth/auth.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { UsersController } from '../src/users/users.controller';
import { UsersModule } from '../src/users/users.module';
import { UsersService } from '../src/users/users.service';

describe('Guards (Integration)', () => {
  let app: INestApplication;
  const mockUsersService = {
    findById: vi
      .fn()
      .mockResolvedValue({ id: 'test-id', email: 'test@example.com' }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          if (req.headers.authorization === 'Bearer valid-token') {
            req.user = { userId: 'test-id' };
            return true;
          }
          return false;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Fix injection manually for test
    const usersController = app.get(UsersController);
    usersController.usersService = mockUsersService;
  });

  afterEach(async () => {
    await app.close();
  });

  it('/users/profile (GET) - should fail without token', () => {
    return request(app.getHttpServer()).get('/users/profile').expect(403);
  });

  it('/users/profile (GET) - should succeed with valid token', () => {
    return request(app.getHttpServer())
      .get('/users/profile')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);
  });
});
