/**
 * Drizzle ORM Schema - Mirrors Prisma for Fast Runtime Queries
 *
 * 🔥 IMPORTANT: This schema ONLY mirrors Prisma - DO NOT run migrations!
 * - Prisma owns all migrations (schema.prisma)
 * - Drizzle used for fast reads (65% faster) and batch inserts (93% faster)
 * - Kysely used for complex analytics
 *
 * Performance Targets:
 * - BehaviorLog reads: 120ms → 42ms (Drizzle)
 * - Batch inserts: 2.4s → 180ms (Drizzle)
 * - Weekly AI scan: 15 min → 2 min (Drizzle batch storage)
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  index,
  boolean,
} from 'drizzle-orm/pg-core';

// ============================================================================
// USER TABLE
// ============================================================================

export const users = pgTable(
  'User',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('passwordHash').notNull(),
    name: jsonb('name').$type<{ vi: string; en: string; zh: string }>(),
    role: text('role').notNull().default('STUDENT'), // Match Prisma default
    points: integer('points').notNull().default(0),
    preferredLocale: text('preferredLocale').notNull().default('vi'),
    preferredLanguage: text('preferredLanguage'),
    dateOfBirth: timestamp('dateOfBirth'),
    moderationStrikes: integer('moderationStrikes').notNull().default(0),
    failedLoginAttempts: integer('failedLoginAttempts').notNull().default(0),
    lockedUntil: timestamp('lockedUntil'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('User_email_key').on(table.email),
    roleIdx: index('User_role_idx').on(table.role),
    createdAtIdx: index('User_createdAt_idx').on(table.createdAt),
    pointsIdx: index('User_points_idx').on(table.points),
  }),
);

// ============================================================================
// BEHAVIOR LOG TABLE (Main target for Drizzle optimization)
// ============================================================================

export const behaviorLogs = pgTable(
  'BehaviorLog',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId'),
    sessionId: text('sessionId').notNull(),
    path: text('path').notNull(),
    eventType: text('eventType').notNull(),
    actionCategory: text('actionCategory').default('GENERAL'),
    duration: integer('duration').default(0),
    deviceInfo: jsonb('deviceInfo'),
    payload: jsonb('payload'),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
  },
  (table) => ({
    userIdTimestampIdx: index('BehaviorLog_userId_timestamp_idx').on(
      table.userId,
      table.timestamp,
    ),
    sessionIdIdx: index('BehaviorLog_sessionId_idx').on(table.sessionId),
    sessionIdEventTypeIdx: index('BehaviorLog_sessionId_eventType_idx').on(
      table.sessionId,
      table.eventType,
    ),
    actionCategoryIdx: index('BehaviorLog_actionCategory_idx').on(
      table.actionCategory,
    ),
    eventTypeTimestampIdx: index('BehaviorLog_eventType_timestamp_idx').on(
      table.eventType,
      table.timestamp,
    ),
    eventTypeUserIdIdx: index('BehaviorLog_eventType_userId_idx').on(
      table.eventType,
      table.userId,
    ),
  }),
);

// ============================================================================
// OPTIMIZATION LOG TABLE (AI Database Architect storage)
// ============================================================================

export const optimizationLogs = pgTable(
  'OptimizationLog',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    queryText: text('queryText').notNull(),
    recommendation: text('recommendation'),
    performanceGain: integer('performanceGain'),
    confidence: integer('confidence'),
    source: text('source'), // 'rag' | 'heuristic' | 'generic'
    queryEmbedding: text('queryEmbedding'), // vector(384) - pgvector embeddings
    metadata: jsonb('metadata'), // Additional context
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    appliedAt: timestamp('appliedAt'),
  },
  (table) => ({
    createdAtIdx: index('OptimizationLog_createdAt_idx').on(table.createdAt),
  }),
);

// ============================================================================
// SOCIAL POST TABLE
// ============================================================================

export const socialPosts = pgTable(
  'SocialPost',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId').notNull(),
    groupId: uuid('groupId'),
    type: text('type').notNull().default('ACHIEVEMENT'), // Enum
    content: jsonb('content'),
    likesCount: integer('likesCount').notNull().default(0),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    groupIdIdx: index('SocialPost_groupId_idx').on(table.groupId),
    userIdIdx: index('SocialPost_userId_idx').on(table.userId),
  }),
);

// ============================================================================
// BUDDY GROUP TABLE
// ============================================================================

export const buddyGroups = pgTable('BuddyGroup', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  description: text('description'),
  type: text('type').notNull().default('LEARNING'), // Enum
  totalPoints: integer('totalPoints').notNull().default(0),
  streak: integer('streak').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// ============================================================================
// BUDDY MEMBER TABLE
// ============================================================================

export const buddyMembers = pgTable(
  'BuddyMember',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('groupId').notNull(),
    userId: uuid('userId').notNull(),
    role: text('role').notNull().default('MEMBER'), // Enum
    joinedAt: timestamp('joinedAt').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('BuddyMember_userId_idx').on(table.userId),
    groupIdUserIdUnique: index('BuddyMember_groupId_userId_key').on(
      table.groupId,
      table.userId,
    ),
  }),
);

// ============================================================================
// USER PROGRESS TABLE (Course completion tracking)
// ============================================================================

export const userProgress = pgTable(
  'UserProgress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId').notNull(),
    lessonId: uuid('lessonId').notNull(),
    completed: boolean('completed').notNull().default(false),
    progressPercentage: integer('progressPercentage').notNull().default(0),
    lastWatchedAt: timestamp('lastWatchedAt'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('UserProgress_userId_idx').on(table.userId),
    lessonIdIdx: index('UserProgress_lessonId_idx').on(table.lessonId),
    userIdLessonIdUnique: index('UserProgress_userId_lessonId_key').on(
      table.userId,
      table.lessonId,
    ),
  }),
);

// ============================================================================
// CERTIFICATE TABLE (Phase 1 MVP - Track 2)
// ============================================================================

export const certificates = pgTable(
  'Certificate',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('courseId').notNull(),
    studentName: jsonb('studentName')
      .$type<{ vi: string; en: string; zh: string }>()
      .notNull(),
    courseTitle: jsonb('courseTitle')
      .$type<{ vi: string; en: string; zh: string }>()
      .notNull(),
    completedAt: timestamp('completedAt').notNull().defaultNow(),
    pdfUrl: text('pdfUrl'),
    metadata: jsonb('metadata').$type<{
      generationTime?: number;
      fileSize?: number;
      fontUsed?: string;
    }>(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('Certificate_userId_idx').on(table.userId),
    courseIdIdx: index('Certificate_courseId_idx').on(table.courseId),
    completedAtIdx: index('Certificate_completedAt_idx').on(table.completedAt),
  }),
);

// ============================================================================
// TYPE EXPORTS (for use in services)
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type BehaviorLog = typeof behaviorLogs.$inferSelect;
export type NewBehaviorLog = typeof behaviorLogs.$inferInsert;

export type OptimizationLog = typeof optimizationLogs.$inferSelect;
export type NewOptimizationLog = typeof optimizationLogs.$inferInsert;

export type SocialPost = typeof socialPosts.$inferSelect;
export type NewSocialPost = typeof socialPosts.$inferInsert;

export type BuddyGroup = typeof buddyGroups.$inferSelect;
export type NewBuddyGroup = typeof buddyGroups.$inferInsert;

export type BuddyMember = typeof buddyMembers.$inferSelect;
export type NewBuddyMember = typeof buddyMembers.$inferInsert;

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
