/**
 * Triple-ORM Consistency Verification Test
 * 
 * Verifies that Prisma, Drizzle, and Kysely schemas are in sync
 * Run: npx vitest run scripts/verify-triple-orm-sync.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users, behaviorLogs } from '../apps/api/src/database/drizzle-schema';
import { eq } from 'drizzle-orm';
import { Kysely, PostgresDialect } from 'kysely';
import type { DB } from '../apps/api/src/database/types';

describe('Triple-ORM Consistency Test', () => {
  let prisma: PrismaClient;
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  let kysely: Kysely<DB>;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize Prisma
    prisma = new PrismaClient();

    // Initialize Drizzle
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    db = drizzle(pool);

    // Initialize Kysely
    kysely = new Kysely<DB>({
      dialect: new PostgresDialect({ pool }),
    });

    // Create test user via Prisma
    const user = await prisma.user.create({
      data: {
        id: `test-orm-sync-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        role: 'STUDENT',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    await prisma.$disconnect();
    await pool.end();
    await kysely.destroy();
  });

  it('should have matching User schema fields across all ORMs', async () => {
    // Verify via Drizzle
    const drizzleUser = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });

    expect(drizzleUser).toBeDefined();
    expect(drizzleUser!.email).toBeDefined();
    expect(drizzleUser!.passwordHash).toBeDefined(); // NOT 'password' ✅
    expect(drizzleUser!.role).toBe('STUDENT');
    expect(drizzleUser!.preferredLocale).toBe('vi'); // NEW field ✅
    expect(drizzleUser!.failedLoginAttempts).toBe(0); // NEW field ✅

    // Verify via Kysely
    const kyselyUser = await kysely
      .selectFrom('User')
      .selectAll()
      .where('id', '=', testUserId)
      .executeTakeFirst();

    expect(kyselyUser).toBeDefined();
    expect(kyselyUser!.email).toBe(drizzleUser!.email);
    expect(kyselyUser!.passwordHash).toBe(drizzleUser!.passwordHash);
    expect(kyselyUser!.role).toBe('STUDENT');
  });

  it('should have passwordHash field (not password) in Drizzle schema', async () => {
    const drizzleUser = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });

    expect(drizzleUser).toHaveProperty('passwordHash');
    expect(drizzleUser).not.toHaveProperty('password'); // OLD field removed ✅
  });

  it('should have all VED-7I9 migration fields in Drizzle', async () => {
    const drizzleUser = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });

    // Verify new fields from VED-7I9 migration exist
    expect(drizzleUser).toHaveProperty('preferredLocale');
    expect(drizzleUser).toHaveProperty('preferredLanguage');
    expect(drizzleUser).toHaveProperty('dateOfBirth');
    expect(drizzleUser).toHaveProperty('moderationStrikes');
    expect(drizzleUser).toHaveProperty('failedLoginAttempts');
    expect(drizzleUser).toHaveProperty('lockedUntil');

    // Verify defaults
    expect(drizzleUser!.preferredLocale).toBe('vi');
    expect(drizzleUser!.moderationStrikes).toBe(0);
    expect(drizzleUser!.failedLoginAttempts).toBe(0);
  });

  it('should have BehaviorLog schema consistent across ORMs', async () => {
    // Create via Drizzle
    const [behaviorLog] = await db.insert(behaviorLogs).values({
      userId: testUserId,
      sessionId: 'test-session',
      path: '/test',
      eventType: 'test_event',
    }).returning();

    expect(behaviorLog).toBeDefined();
    expect(behaviorLog.userId).toBe(testUserId);

    // Read via Kysely
    const kyselyLog = await kysely
      .selectFrom('BehaviorLog')
      .selectAll()
      .where('id', '=', behaviorLog.id)
      .executeTakeFirst();

    expect(kyselyLog).toBeDefined();
    expect(kyselyLog!.userId).toBe(testUserId);
    expect(kyselyLog!.sessionId).toBe('test-session');

    // Cleanup
    await kysely.deleteFrom('BehaviorLog').where('id', '=', behaviorLog.id).execute();
  });
});
