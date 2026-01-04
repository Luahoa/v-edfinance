import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  createTestApp,
  cleanupDatabase,
  generateAuthHeader,
  disconnectPrisma,
} from './helpers';
import { mockUsers, mockCourses } from './mocks';
import { Role } from '@prisma/client';

/**
 * Example E2E test demonstrating usage of test helpers.
 * This shows how to:
 * - Set up a test application
 * - Use authentication helpers
 * - Clean up database between tests
 * - Use mock data
 */
describe.skip('Example: Test Helpers Usage (E2E) [REQUIRES_DB]', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await createTestApp(moduleRef);
  });

  beforeEach(async () => {
    // Clean database before each test for isolation
    await cleanupDatabase();
  });

  afterAll(async () => {
    await app.close();
    await disconnectPrisma();
  });

  describe('Authentication Examples', () => {
    it('should generate valid JWT token', () => {
      const studentId = mockUsers[0].id;
      const authHeader = generateAuthHeader(studentId, Role.STUDENT);

      expect(authHeader).toHaveProperty('Authorization');
      expect(authHeader.Authorization).toMatch(/^Bearer /);
    });

    it('should authenticate requests with generated token', async () => {
      const adminHeader = generateAuthHeader('user-admin-001', Role.ADMIN);

      return request(app.getHttpServer())
        .get('/users/profile')
        .set(adminHeader)
        .expect(200);
    });
  });

  describe('Mock Data Examples', () => {
    it('should use mock users data', () => {
      expect(mockUsers).toHaveLength(10);
      expect(mockUsers[0]).toHaveProperty('email');
      expect(mockUsers[0]).toHaveProperty('name');
      expect(mockUsers[0].name).toHaveProperty('vi');
      expect(mockUsers[0].name).toHaveProperty('en');
      expect(mockUsers[0].name).toHaveProperty('zh');
    });

    it('should use mock courses data', () => {
      expect(mockCourses).toHaveLength(5);
      expect(mockCourses[0].title).toHaveProperty('vi');
      expect(mockCourses[0].description).toHaveProperty('en');
    });
  });

  describe('Database Cleanup Examples', () => {
    it('should successfully clean up database', async () => {
      // This test just verifies cleanup function works without error
      await cleanupDatabase();
      expect(true).toBe(true);
    });
  });
});
