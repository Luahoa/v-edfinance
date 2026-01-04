import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { PrismaModule } from './../src/prisma/prisma.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    console.log('🚀 Starting beforeAll...');
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          // Chỉ load các module tối thiểu thay vì toàn bộ AppModule
          ConfigModule.forRoot({ isGlobal: true }),
          PrismaModule,
        ],
        controllers: [AppController],
        providers: [
          {
            provide: AppService,
            useValue: {
              getHello: () => 'Hello World!',
            },
          },
        ],
      })
        .overrideProvider(PrismaService)
        .useValue({
          $connect: vi.fn(),
          $disconnect: vi.fn(),
          onModuleInit: vi.fn(),
          onModuleDestroy: vi.fn(),
          systemSettings: { findMany: vi.fn().mockResolvedValue([]) },
          user: { count: vi.fn().mockResolvedValue(0) },
          behaviorLog: { count: vi.fn().mockResolvedValue(0) },
        })
        .compile();

      console.log('📦 Module compiled');
      app = moduleFixture.createNestApplication();
      console.log('🏗️ App created');
      await app.init();
      console.log('✅ App initialized');
    } catch (error) {
      console.error('❌ Error in beforeAll:', error);
      throw error;
    }
  }, 120000);

  afterAll(async () => {
    console.log('🧹 Starting afterAll...');
    if (app) {
      await app.close();
      console.log('🛑 App closed');
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
