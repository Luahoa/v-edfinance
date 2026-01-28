import { vi, type MockInstance } from 'vitest';
import type { Context } from '../context';
import { appRouter } from '../router';
import { createCallerFactory } from '../trpc';

interface MockUser {
  id: string;
  email: string;
  name: Record<string, string> | null;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  points: number;
  preferredLocale: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockSession {
  id: string;
  userId: string;
  expiresAt: Date;
}

interface MockDbQuery {
  findFirst: MockInstance;
  findMany: MockInstance;
}

interface MockDb {
  query: {
    users: MockDbQuery;
    courses: MockDbQuery;
    lessons: MockDbQuery;
    userProgress: MockDbQuery;
    userStreaks: MockDbQuery;
    behaviorLogs: MockDbQuery;
    quizzes: MockDbQuery;
    quizAttempts: MockDbQuery;
    achievements: MockDbQuery;
    userAchievements: MockDbQuery;
    certificates: MockDbQuery;
    socialPosts: MockDbQuery;
    userRelationships: MockDbQuery;
    notifications: MockDbQuery;
    transactions: MockDbQuery;
    chatThreads: MockDbQuery;
    simulationScenarios: MockDbQuery;
    leaderboardEntries: MockDbQuery;
  };
  select: MockInstance;
  insert: MockInstance;
  update: MockInstance;
  delete: MockInstance;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: { vi: 'Người dùng Test', en: 'Test User' },
    role: 'STUDENT',
    points: 100,
    preferredLocale: 'vi',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function createMockSession(userId: string = 'test-user-id'): MockSession {
  return {
    id: 'test-session-id',
    userId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

export function createMockDb(): MockDb {
  const mockQuery = (): MockDbQuery => ({
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
  });

  const chainableMock = () => {
    const mock: Record<string, MockInstance> = {};
    mock.from = vi.fn().mockReturnValue(mock);
    mock.where = vi.fn().mockReturnValue(mock);
    mock.innerJoin = vi.fn().mockReturnValue(mock);
    mock.leftJoin = vi.fn().mockReturnValue(mock);
    mock.groupBy = vi.fn().mockReturnValue(mock);
    mock.orderBy = vi.fn().mockReturnValue(mock);
    mock.limit = vi.fn().mockReturnValue(mock);
    mock.offset = vi.fn().mockReturnValue(mock);
    mock.returning = vi.fn().mockResolvedValue([]);
    mock.values = vi.fn().mockReturnValue(mock);
    mock.set = vi.fn().mockReturnValue(mock);
    mock.then = vi.fn().mockImplementation((resolve) => resolve([]));
    return mock;
  };

  return {
    query: {
      users: mockQuery(),
      courses: mockQuery(),
      lessons: mockQuery(),
      userProgress: mockQuery(),
      userStreaks: mockQuery(),
      behaviorLogs: mockQuery(),
      quizzes: mockQuery(),
      quizAttempts: mockQuery(),
      achievements: mockQuery(),
      userAchievements: mockQuery(),
      certificates: mockQuery(),
      socialPosts: mockQuery(),
      userRelationships: mockQuery(),
      notifications: mockQuery(),
      transactions: mockQuery(),
      chatThreads: mockQuery(),
      simulationScenarios: mockQuery(),
      leaderboardEntries: mockQuery(),
    },
    select: vi.fn().mockReturnValue(chainableMock()),
    insert: vi.fn().mockReturnValue(chainableMock()),
    update: vi.fn().mockReturnValue(chainableMock()),
    delete: vi.fn().mockReturnValue(chainableMock()),
  };
}

interface CreateTestContextOptions {
  user?: MockUser | null;
  session?: MockSession | null;
  db?: MockDb;
}

export function createTestContext(options: CreateTestContextOptions = {}): Context {
  const mockDb = options.db ?? createMockDb();
  const user = options.user ?? null;
  const session = options.session ?? (user ? createMockSession(user.id) : null);

  return {
    db: mockDb as unknown as Context['db'],
    session,
    user,
    req: new Request('http://localhost:3000'),
  };
}

export function createAuthenticatedContext(
  userOverrides: Partial<MockUser> = {},
  db?: MockDb
): Context {
  const user = createMockUser(userOverrides);
  const session = createMockSession(user.id);
  return createTestContext({ user, session, db });
}

export function createUnauthenticatedContext(db?: MockDb): Context {
  return createTestContext({ user: null, session: null, db });
}

const createCaller = createCallerFactory(appRouter);

export function createTestCaller(ctx: Context) {
  return createCaller(ctx);
}

export { vi };
