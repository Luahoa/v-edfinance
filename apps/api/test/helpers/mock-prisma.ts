import { type PrismaClient } from '@prisma/client';
import { vi } from 'vitest';

export type MockPrismaClient = {
  [K in keyof PrismaClient]: PrismaClient[K] extends object
    ? {
        [M in keyof PrismaClient[K]]: PrismaClient[K][M] extends (
          ...args: any[]
        ) => any
          ? ReturnType<typeof vi.fn>
          : PrismaClient[K][M];
      }
    : PrismaClient[K];
};

/**
 * Create a deep mock of Prisma client for unit testing.
 * Use this when you want to mock database operations without hitting the real DB.
 * @returns Deep mock proxy of PrismaClient
 */
export function createMockPrismaClient(): MockPrismaClient {
  return new Proxy({} as MockPrismaClient, {
    get: (_target, prop) => {
      if (typeof prop === 'string') {
        return new Proxy(
          {},
          {
            get: (_modelTarget, method) => {
              return vi.fn();
            },
          },
        );
      }
      return undefined;
    },
  });
}

/**
 * Mock factory for common Prisma queries.
 * Use these to quickly set up mock responses for common database operations.
 */
export const mockPrismaQueries = {
  /**
   * Mock a successful findUnique operation.
   */
  findUnique: <T>(data: T) => {
    return Promise.resolve(data);
  },

  /**
   * Mock a findUnique that returns null (not found).
   */
  findUniqueNull: () => {
    return Promise.resolve(null);
  },

  /**
   * Mock a successful findMany operation.
   */
  findMany: <T>(data: T[]) => {
    return Promise.resolve(data);
  },

  /**
   * Mock a successful create operation.
   */
  create: <T>(data: T) => {
    return Promise.resolve(data);
  },

  /**
   * Mock a successful update operation.
   */
  update: <T>(data: T) => {
    return Promise.resolve(data);
  },

  /**
   * Mock a successful delete operation.
   */
  delete: <T>(data: T) => {
    return Promise.resolve(data);
  },

  /**
   * Mock a count operation.
   */
  count: (count: number) => {
    return Promise.resolve(count);
  },

  /**
   * Mock an aggregate operation.
   */
  aggregate: <T>(data: T) => {
    return Promise.resolve(data);
  },
};

/**
 * Helper to set up mock responses for a specific Prisma model.
 * @example
 * const mockPrisma = createMockPrismaClient();
 * setupModelMocks(mockPrisma.user, {
 *   findUnique: mockUsers[0],
 *   findMany: mockUsers,
 * });
 */
export function setupModelMocks<T>(
  model: any,
  mocks: {
    findUnique?: T | null;
    findMany?: T[];
    create?: T;
    update?: T;
    delete?: T;
    count?: number;
  },
): void {
  if (mocks.findUnique !== undefined) {
    model.findUnique.mockResolvedValue(mocks.findUnique);
  }
  if (mocks.findMany !== undefined) {
    model.findMany.mockResolvedValue(mocks.findMany);
  }
  if (mocks.create !== undefined) {
    model.create.mockResolvedValue(mocks.create);
  }
  if (mocks.update !== undefined) {
    model.update.mockResolvedValue(mocks.update);
  }
  if (mocks.delete !== undefined) {
    model.delete.mockResolvedValue(mocks.delete);
  }
  if (mocks.count !== undefined) {
    model.count.mockResolvedValue(mocks.count);
  }
}
