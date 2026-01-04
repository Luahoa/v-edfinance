import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import type { ModuleMetadata } from '@nestjs/common';

const prisma = new PrismaClient();

/**
 * Create a NestJS testing module with common configuration.
 * @param metadata Module metadata (imports, providers, controllers)
 * @returns Testing module
 */
export async function createTestModule(
  metadata: ModuleMetadata,
): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule(metadata).compile();
  return moduleRef;
}

/**
 * Create and configure a full NestJS application for E2E testing.
 * @param moduleRef Testing module reference
 * @returns Configured INestApplication
 */
export async function createTestApp(
  moduleRef: TestingModule,
): Promise<INestApplication> {
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

/**
 * Clean up the database by deleting all records.
 * Tables are cleaned in reverse dependency order to avoid FK constraints.
 */
export async function cleanupDatabase(): Promise<void> {
  await prisma.$transaction([
    // Delete child records first
    prisma.chatMessage.deleteMany(),
    prisma.userProgress.deleteMany(),
    prisma.behaviorLog.deleteMany(),
    prisma.userAchievement.deleteMany(),
    prisma.userChecklist.deleteMany(),
    prisma.userStreak.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.buddyMember.deleteMany(),
    prisma.buddyChallenge.deleteMany(),
    prisma.socialPost.deleteMany(),
    prisma.virtualPortfolio.deleteMany(),
    prisma.simulationScenario.deleteMany(),
    prisma.simulationCommitment.deleteMany(),
    prisma.investmentProfile.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.chatThread.deleteMany(),

    // Delete parent records
    prisma.buddyGroup.deleteMany(),
    prisma.course.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/**
 * Async sleep utility for testing delays and timing.
 * @param ms Milliseconds to wait
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random email for testing.
 */
export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate a random UUID-like string for testing.
 */
export function randomUuid(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Wait for a condition to become true with timeout.
 * @param condition Function that returns true when condition is met
 * @param timeout Maximum time to wait in ms
 * @param interval Check interval in ms
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await sleep(interval);
  }
  throw new Error('Timeout waiting for condition');
}

/**
 * Get Prisma client for direct database operations in tests.
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}

/**
 * Disconnect Prisma client after tests.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
