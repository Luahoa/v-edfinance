/**
 * Centralized Prisma Mock Helper
 *
 * Provides reusable mock factories for all Prisma models with standard CRUD operations.
 * Reduces boilerplate in test files and ensures consistency across test suite.
 *
 * Usage:
 * ```ts
 * const mockPrisma = createMockPrismaService();
 *
 * // Override specific methods
 * mockPrisma.user.findUnique.mockResolvedValue(mockUser);
 * ```
 */

import { vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Creates a full PrismaClient mock with all base methods for every model.
 * Each method is a vi.fn() spy that can be configured with mockResolvedValue/mockRejectedValue.
 */
export function createMockPrismaService(): jest.Mocked<PrismaService> {
  // Base CRUD operations that every Prisma model has
  const createModelMock = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
    updateMany: vi.fn(),
  });

  return {
    // Social Models
    buddyGroup: createModelMock(),
    buddyMember: createModelMock(),
    buddyChallenge: createModelMock(),
    socialPost: createModelMock(),

    // User & Auth Models
    user: createModelMock(),
    refreshToken: createModelMock(),
    userRelationship: createModelMock(),

    // Course Models
    course: createModelMock(),
    lesson: createModelMock(),
    lessonBlock: createModelMock(),
    userProgress: createModelMock(),
    userChecklist: createModelMock(),

    // Gamification Models
    achievement: createModelMock(),
    userAchievement: createModelMock(),
    userStreak: createModelMock(),
    nudgeTrigger: createModelMock(),
    nudgeHistory: createModelMock(),

    // Investment Simulation Models
    simulationScenario: createModelMock(),
    simulationEvent: createModelMock(),
    simulationCommitment: createModelMock(),
    investmentProfile: createModelMock(),
    virtualPortfolio: createModelMock(),
    portfolioAsset: createModelMock(),
    portfolioTransaction: createModelMock(),

    // Behavioral Analytics Models
    behaviorLog: createModelMock(),
    analyticsPersona: createModelMock(),

    // Chat Models
    chatThread: createModelMock(),
    chatMessage: createModelMock(),

    // Config Models
    systemSettings: createModelMock(),

    // Storage Models
    storageFile: createModelMock(),

    // Moderation Models (NEW)
    moderationLog: createModelMock(),

    // Prisma client methods (not model-specific)
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $executeRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    $transaction: vi.fn((callback) => callback({} as any)),

    // Special methods
    $on: vi.fn(),
    $use: vi.fn(),
  } as any;
}

/**
 * Helper to create a minimal valid User object for tests
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    passwordHash: 'hashed',
    name: { vi: 'Test User', en: 'Test User', zh: 'Test User' },
    role: 'STUDENT',
    points: 0,
    preferredLocale: 'vi',
    preferredLanguage: 'vi',
    dateOfBirth: null,
    moderationStrikes: 0,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Helper to create a minimal valid Course object for tests
 */
export function createMockCourse(overrides: Partial<any> = {}) {
  return {
    id: 'course-' + Math.random().toString(36).substr(2, 9),
    title: { vi: 'Test Course', en: 'Test Course', zh: 'Test Course' },
    description: { vi: 'Description', en: 'Description', zh: 'Description' },
    level: 'BEGINNER',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    estimatedHours: 10,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Helper to create a minimal valid Achievement object for tests
 */
export function createMockAchievement(overrides: Partial<any> = {}) {
  return {
    id: 'achievement-' + Math.random().toString(36).substr(2, 9),
    name: {
      vi: 'Test Achievement',
      en: 'Test Achievement',
      zh: 'Test Achievement',
    },
    description: { vi: 'Description', en: 'Description', zh: 'Description' },
    iconKey: 'trophy',
    pointsRequired: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Helper to create a minimal valid BehaviorLog object for tests
 */
export function createMockBehaviorLog(overrides: Partial<any> = {}) {
  return {
    id: 'log-' + Math.random().toString(36).substr(2, 9),
    userId: 'user-123',
    actionType: 'LESSON_COMPLETE',
    actionData: {},
    metadata: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Helper to simulate Prisma error responses
 */
export function createPrismaError(code: string, message: string) {
  const error = new Error(message) as any;
  error.code = code;
  error.meta = {};
  return error;
}

/**
 * Common Prisma error codes for testing
 */
export const PrismaErrorCodes = {
  NOT_FOUND: 'P2025',
  UNIQUE_CONSTRAINT: 'P2002',
  FOREIGN_KEY_CONSTRAINT: 'P2003',
  CONNECTION_ERROR: 'P1001',
  TIMEOUT: 'P1008',
  DATABASE_ERROR: 'P2010',
} as const;

/**
 * Helper to mock a Prisma transaction
 * Usage:
 * ```ts
 * mockPrisma.$transaction.mockImplementation(mockPrismaTransaction([
 *   { model: 'user', method: 'create', result: mockUser },
 *   { model: 'behaviorLog', method: 'create', result: mockLog },
 * ]));
 * ```
 */
export function mockPrismaTransaction(
  operations: Array<{ model: string; method: string; result: any }>,
) {
  return async (callback: Function) => {
    const txClient: any = {};

    // Populate transaction client with mocked models
    for (const op of operations) {
      if (!txClient[op.model]) {
        txClient[op.model] = {};
      }
      txClient[op.model][op.method] = vi.fn().mockResolvedValue(op.result);
    }

    return callback(txClient);
  };
}
