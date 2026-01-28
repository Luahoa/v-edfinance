// Drizzle schema - migrated from Prisma schema
// apps/api/prisma/schema.prisma

import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  jsonb,
  real,
  uniqueIndex,
  index,
  uuid,
} from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

export const roleEnum = pgEnum('role', ['STUDENT', 'TEACHER', 'ADMIN']);
export const levelEnum = pgEnum('level', ['BEGINNER', 'INTERMEDIATE', 'EXPERT']);
export const lessonTypeEnum = pgEnum('lesson_type', ['VIDEO', 'READING', 'QUIZ', 'INTERACTIVE']);
export const progressStatusEnum = pgEnum('progress_status', ['STARTED', 'IN_PROGRESS', 'COMPLETED']);
export const chatRoleEnum = pgEnum('chat_role', ['USER', 'ASSISTANT', 'SYSTEM']);
export const buddyGroupTypeEnum = pgEnum('buddy_group_type', ['LEARNING', 'SAVING', 'INVESTING']);
export const buddyRoleEnum = pgEnum('buddy_role', ['LEADER', 'MEMBER']);
export const postTypeEnum = pgEnum('post_type', ['ACHIEVEMENT', 'MILESTONE', 'NUDGE', 'DISCUSSION']);
export const relationStatusEnum = pgEnum('relation_status', ['FOLLOWING', 'FRIEND_REQUESTED', 'FRIENDS', 'BLOCKED']);
export const questionTypeEnum = pgEnum('question_type', ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'MATCHING']);
export const transactionStatusEnum = pgEnum('transaction_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']);
export const transactionTypeEnum = pgEnum('transaction_type', ['COURSE_PURCHASE', 'SUBSCRIPTION', 'CREDITS', 'DONATION']);

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable(
  'User',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    passwordHash: text('passwordHash').notNull(),
    name: jsonb('name'), // Localized: { vi, en, zh }
    role: roleEnum('role').default('STUDENT').notNull(),
    points: integer('points').default(0).notNull(),
    preferredLocale: text('preferredLocale').default('vi').notNull(),
    preferredLanguage: text('preferredLanguage'),
    dateOfBirth: timestamp('dateOfBirth'),
    moderationStrikes: integer('moderationStrikes').default(0).notNull(),
    failedLoginAttempts: integer('failedLoginAttempts').default(0).notNull(),
    lockedUntil: timestamp('lockedUntil'),
    stripeCustomerId: text('stripeCustomerId').unique(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('User_email_idx').on(table.email),
    roleIdx: index('User_role_idx').on(table.role),
    createdAtIdx: index('User_createdAt_idx').on(table.createdAt),
    pointsIdx: index('User_points_idx').on(table.points),
  })
);

export const usersRelations = relations(users, ({ one, many }) => ({
  investmentProfile: one(investmentProfiles),
  streaks: one(userStreaks),
  virtualPortfolio: one(virtualPortfolios),
  behaviorLogs: many(behaviorLogs),
  buddyMemberships: many(buddyMembers),
  chatThreads: many(chatThreads),
  refreshTokens: many(refreshTokens),
  commitments: many(simulationCommitments),
  simulations: many(simulationScenarios),
  socialPosts: many(socialPosts),
  achievements: many(userAchievements),
  checklists: many(userChecklists),
  progress: many(userProgress),
  moderationLogs: many(moderationLogs, { relationName: 'userLogs' }),
  moderatedLogs: many(moderationLogs, { relationName: 'moderatorLogs' }),
  following: many(userRelationships, { relationName: 'following' }),
  followers: many(userRelationships, { relationName: 'followers' }),
  quizAttempts: many(quizAttempts),
  certificates: many(certificates),
  transactions: many(transactions),
  enrollments: many(enrollments),
}));

// ============================================================================
// COURSES & LESSONS
// ============================================================================

export const courses = pgTable(
  'Course',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').unique().notNull(),
    title: jsonb('title').notNull(), // Localized
    description: jsonb('description').notNull(), // Localized
    thumbnailKey: text('thumbnailKey').notNull(),
    price: integer('price').notNull(),
    level: levelEnum('level').default('BEGINNER').notNull(),
    published: boolean('published').default(false).notNull(),
    instructorId: uuid('instructorId').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index('Course_slug_idx').on(table.slug),
    publishedLevelIdx: index('Course_published_level_idx').on(table.published, table.level),
    instructorIdx: index('Course_instructorId_idx').on(table.instructorId),
  })
);

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
  }),
  lessons: many(lessons),
  certificates: many(certificates),
  transactions: many(transactions),
  enrollments: many(enrollments),
}));

// ============================================================================
// ENROLLMENTS
// ============================================================================

export const enrollments = pgTable(
  'Enrollment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('courseId')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolledAt').defaultNow().notNull(),
    emailSentAt: timestamp('emailSentAt'),
    completedAt: timestamp('completedAt'),
  },
  (table) => ({
    userCourseUnique: uniqueIndex('Enrollment_userId_courseId_key').on(table.userId, table.courseId),
    userIdx: index('Enrollment_userId_idx').on(table.userId),
    courseIdx: index('Enrollment_courseId_idx').on(table.courseId),
  })
);

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const lessons = pgTable(
  'Lesson',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('courseId')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    order: integer('order').notNull(),
    title: jsonb('title').notNull(), // Localized
    content: jsonb('content').notNull(), // Localized
    videoKey: jsonb('videoKey'), // Localized
    type: lessonTypeEnum('type').default('VIDEO').notNull(),
    duration: integer('duration'),
    published: boolean('published').default(false).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    courseOrderUnique: uniqueIndex('Lesson_courseId_order_key').on(table.courseId, table.order),
    coursePublishedIdx: index('Lesson_courseId_published_idx').on(table.courseId, table.published),
  })
);

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  progress: many(userProgress),
  quizzes: many(quizzes),
}));

// ============================================================================
// USER PROGRESS
// ============================================================================

export const userProgress = pgTable(
  'UserProgress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lessonId')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    status: progressStatusEnum('status').default('STARTED').notNull(),
    durationSpent: integer('durationSpent').default(0).notNull(),
    progressPercentage: real('progressPercentage').default(0),
    completedAt: timestamp('completedAt'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    userLessonUnique: uniqueIndex('UserProgress_userId_lessonId_key').on(table.userId, table.lessonId),
    userStatusIdx: index('UserProgress_userId_status_idx').on(table.userId, table.status),
    lessonStatusIdx: index('UserProgress_lessonId_status_idx').on(table.lessonId, table.status),
    userCreatedAtIdx: index('UserProgress_userId_createdAt_idx').on(table.userId, table.createdAt),
    completedAtIdx: index('UserProgress_completedAt_idx').on(table.completedAt),
  })
);

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [userProgress.lessonId],
    references: [lessons.id],
  }),
}));

// ============================================================================
// CHAT SYSTEM
// ============================================================================

export const chatThreads = pgTable(
  'ChatThread',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id),
    title: text('title').notNull(),
    module: text('module'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('ChatThread_userId_idx').on(table.userId),
  })
);

export const chatThreadsRelations = relations(chatThreads, ({ one, many }) => ({
  user: one(users, {
    fields: [chatThreads.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessages = pgTable(
  'ChatMessage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('threadId')
      .notNull()
      .references(() => chatThreads.id),
    role: chatRoleEnum('role').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    threadIdx: index('ChatMessage_threadId_idx').on(table.threadId),
  })
);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  thread: one(chatThreads, {
    fields: [chatMessages.threadId],
    references: [chatThreads.id],
  }),
}));

// ============================================================================
// BEHAVIOR LOGS
// ============================================================================

export const behaviorLogs = pgTable(
  'BehaviorLog',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId').references(() => users.id),
    sessionId: text('sessionId').notNull(),
    path: text('path').notNull(),
    eventType: text('eventType').notNull(),
    actionCategory: text('actionCategory').default('GENERAL'),
    duration: integer('duration').default(0),
    deviceInfo: jsonb('deviceInfo'),
    payload: jsonb('payload'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => ({
    userTimestampIdx: index('BehaviorLog_userId_timestamp_idx').on(table.userId, table.timestamp),
    sessionIdx: index('BehaviorLog_sessionId_idx').on(table.sessionId),
    sessionEventIdx: index('BehaviorLog_sessionId_eventType_idx').on(table.sessionId, table.eventType),
    actionCategoryIdx: index('BehaviorLog_actionCategory_idx').on(table.actionCategory),
    eventTimestampIdx: index('BehaviorLog_eventType_timestamp_idx').on(table.eventType, table.timestamp),
    eventUserIdx: index('BehaviorLog_eventType_userId_idx').on(table.eventType, table.userId),
  })
);

export const behaviorLogsRelations = relations(behaviorLogs, ({ one }) => ({
  user: one(users, {
    fields: [behaviorLogs.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// INVESTMENT & PORTFOLIO
// ============================================================================

export const investmentProfiles = pgTable('InvestmentProfile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .unique()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  riskScore: integer('riskScore').default(50).notNull(),
  investmentPhilosophy: jsonb('investmentPhilosophy').notNull(),
  financialGoals: jsonb('financialGoals').notNull(),
  currentKnowledge: levelEnum('currentKnowledge').default('BEGINNER').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const investmentProfilesRelations = relations(investmentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [investmentProfiles.userId],
    references: [users.id],
  }),
}));

export const virtualPortfolios = pgTable('VirtualPortfolio', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .unique()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').default(10000000).notNull(),
  holdings: jsonb('holdings').default([]).notNull(),
  transactions: jsonb('transactions').default([]).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const virtualPortfoliosRelations = relations(virtualPortfolios, ({ one }) => ({
  user: one(users, {
    fields: [virtualPortfolios.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// GAMIFICATION
// ============================================================================

export const userStreaks = pgTable('UserStreak', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .unique()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('currentStreak').default(0).notNull(),
  longestStreak: integer('longestStreak').default(0).notNull(),
  lastActivityDate: timestamp('lastActivityDate'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(users, {
    fields: [userStreaks.userId],
    references: [users.id],
  }),
}));

export const achievements = pgTable(
  'Achievement',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').unique().notNull(),
    name: jsonb('name').notNull(), // Localized
    description: jsonb('description').notNull(), // Localized
    iconKey: text('iconKey').notNull(),
    criteria: jsonb('criteria').notNull(),
    points: integer('points').default(0).notNull(),
    tier: text('tier').default('BRONZE').notNull(),
    category: text('category').notNull(),
    isActive: boolean('isActive').default(true).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('Achievement_category_idx').on(table.category),
    tierIdx: index('Achievement_tier_idx').on(table.tier),
    isActiveIdx: index('Achievement_isActive_idx').on(table.isActive),
  })
);

export const userAchievements = pgTable(
  'UserAchievement',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    achievementId: uuid('achievementId').notNull(),
    progress: integer('progress').default(0).notNull(),
    earnedAt: timestamp('earnedAt'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    userAchievementUnique: uniqueIndex('UserAchievement_userId_achievementId_key').on(
      table.userId,
      table.achievementId
    ),
    userIdx: index('UserAchievement_userId_idx').on(table.userId),
  })
);

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// BUDDY SYSTEM
// ============================================================================

export const buddyGroups = pgTable('BuddyGroup', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  description: text('description'),
  type: buddyGroupTypeEnum('type').default('LEARNING').notNull(),
  totalPoints: integer('totalPoints').default(0).notNull(),
  streak: integer('streak').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const buddyGroupsRelations = relations(buddyGroups, ({ many }) => ({
  members: many(buddyMembers),
  challenges: many(buddyChallenges),
  feedPosts: many(socialPosts),
}));

export const buddyMembers = pgTable(
  'BuddyMember',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('groupId')
      .notNull()
      .references(() => buddyGroups.id, { onDelete: 'cascade' }),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: buddyRoleEnum('role').default('MEMBER').notNull(),
    joinedAt: timestamp('joinedAt').defaultNow().notNull(),
  },
  (table) => ({
    groupUserUnique: uniqueIndex('BuddyMember_groupId_userId_key').on(table.groupId, table.userId),
    userIdx: index('BuddyMember_userId_idx').on(table.userId),
  })
);

export const buddyMembersRelations = relations(buddyMembers, ({ one }) => ({
  group: one(buddyGroups, {
    fields: [buddyMembers.groupId],
    references: [buddyGroups.id],
  }),
  user: one(users, {
    fields: [buddyMembers.userId],
    references: [users.id],
  }),
}));

export const buddyChallenges = pgTable(
  'BuddyChallenge',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('groupId')
      .notNull()
      .references(() => buddyGroups.id, { onDelete: 'cascade' }),
    title: jsonb('title').notNull(), // Localized
    target: integer('target').notNull(),
    rewardPoints: integer('rewardPoints').notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
  },
  (table) => ({
    groupIdx: index('BuddyChallenge_groupId_idx').on(table.groupId),
  })
);

export const buddyChallengesRelations = relations(buddyChallenges, ({ one }) => ({
  group: one(buddyGroups, {
    fields: [buddyChallenges.groupId],
    references: [buddyGroups.id],
  }),
}));

// ============================================================================
// SOCIAL
// ============================================================================

export const socialPosts = pgTable(
  'SocialPost',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    groupId: uuid('groupId').references(() => buddyGroups.id),
    type: postTypeEnum('type').default('ACHIEVEMENT').notNull(),
    content: jsonb('content'),
    likesCount: integer('likesCount').default(0).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    groupIdx: index('SocialPost_groupId_idx').on(table.groupId),
    userIdx: index('SocialPost_userId_idx').on(table.userId),
  })
);

export const socialPostsRelations = relations(socialPosts, ({ one }) => ({
  user: one(users, {
    fields: [socialPosts.userId],
    references: [users.id],
  }),
  group: one(buddyGroups, {
    fields: [socialPosts.groupId],
    references: [buddyGroups.id],
  }),
}));

export const userRelationships = pgTable(
  'UserRelationship',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    followerId: uuid('followerId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followedId: uuid('followedId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: relationStatusEnum('status').default('FOLLOWING').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    followerFollowedUnique: uniqueIndex('UserRelationship_followerId_followedId_key').on(
      table.followerId,
      table.followedId
    ),
    followerIdx: index('UserRelationship_followerId_idx').on(table.followerId),
    followedIdx: index('UserRelationship_followedId_idx').on(table.followedId),
  })
);

export const userRelationshipsRelations = relations(userRelationships, ({ one }) => ({
  follower: one(users, {
    fields: [userRelationships.followerId],
    references: [users.id],
    relationName: 'following',
  }),
  followed: one(users, {
    fields: [userRelationships.followedId],
    references: [users.id],
    relationName: 'followers',
  }),
}));

// ============================================================================
// SIMULATION
// ============================================================================

export const simulationScenarios = pgTable(
  'SimulationScenario',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: jsonb('title').notNull(), // Localized
    scenarioData: jsonb('scenarioData').notNull(),
    result: jsonb('result'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('SimulationScenario_userId_idx').on(table.userId),
  })
);

export const simulationScenariosRelations = relations(simulationScenarios, ({ one, many }) => ({
  user: one(users, {
    fields: [simulationScenarios.userId],
    references: [users.id],
  }),
  commitments: many(simulationCommitments),
}));

export const simulationCommitments = pgTable(
  'SimulationCommitment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scenarioId: uuid('scenarioId')
      .notNull()
      .references(() => simulationScenarios.id, { onDelete: 'cascade' }),
    commitment: text('commitment').notNull(),
    isCompleted: boolean('isCompleted').default(false).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('SimulationCommitment_userId_idx').on(table.userId),
    scenarioIdx: index('SimulationCommitment_scenarioId_idx').on(table.scenarioId),
  })
);

export const simulationCommitmentsRelations = relations(simulationCommitments, ({ one }) => ({
  user: one(users, {
    fields: [simulationCommitments.userId],
    references: [users.id],
  }),
  scenario: one(simulationScenarios, {
    fields: [simulationCommitments.scenarioId],
    references: [simulationScenarios.id],
  }),
}));

// ============================================================================
// MODERATION
// ============================================================================

export const moderationLogs = pgTable(
  'ModerationLog',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    reason: text('reason').notNull(),
    moderatorId: uuid('moderatorId').references(() => users.id),
    severity: text('severity'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('ModerationLog_userId_idx').on(table.userId),
    createdAtIdx: index('ModerationLog_createdAt_idx').on(table.createdAt),
    actionIdx: index('ModerationLog_action_idx').on(table.action),
  })
);

export const moderationLogsRelations = relations(moderationLogs, ({ one }) => ({
  user: one(users, {
    fields: [moderationLogs.userId],
    references: [users.id],
    relationName: 'userLogs',
  }),
  moderator: one(users, {
    fields: [moderationLogs.moderatorId],
    references: [users.id],
    relationName: 'moderatorLogs',
  }),
}));

// ============================================================================
// QUIZ SYSTEM
// ============================================================================

export const quizzes = pgTable(
  'Quiz',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lessonId')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    title: jsonb('title').notNull(), // Localized
    description: jsonb('description'), // Localized
    published: boolean('published').default(false).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    lessonIdx: index('Quiz_lessonId_idx').on(table.lessonId),
    publishedIdx: index('Quiz_published_idx').on(table.published),
  })
);

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const quizQuestions = pgTable(
  'QuizQuestion',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quizId: uuid('quizId')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    type: questionTypeEnum('type').notNull(),
    question: jsonb('question').notNull(), // Localized
    options: jsonb('options'), // For MULTIPLE_CHOICE, MATCHING
    correctAnswer: jsonb('correctAnswer').notNull(),
    points: integer('points').default(1).notNull(),
    order: integer('order').notNull(),
    explanation: jsonb('explanation'), // Localized
  },
  (table) => ({
    quizOrderUnique: uniqueIndex('QuizQuestion_quizId_order_key').on(table.quizId, table.order),
    quizIdx: index('QuizQuestion_quizId_idx').on(table.quizId),
  })
);

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
}));

export const quizAttempts = pgTable(
  'QuizAttempt',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    quizId: uuid('quizId')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    answers: jsonb('answers').notNull(), // { questionId: userAnswer }
    score: integer('score').notNull(),
    percentage: real('percentage').notNull(),
    startedAt: timestamp('startedAt').defaultNow().notNull(),
    completedAt: timestamp('completedAt'),
  },
  (table) => ({
    userQuizIdx: index('QuizAttempt_userId_quizId_idx').on(table.userId, table.quizId),
    quizIdx: index('QuizAttempt_quizId_idx').on(table.quizId),
    userCompletedIdx: index('QuizAttempt_userId_completedAt_idx').on(table.userId, table.completedAt),
  })
);

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
}));

// ============================================================================
// CERTIFICATE SYSTEM
// ============================================================================

export const certificates = pgTable(
  'Certificate',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('courseId')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    studentName: jsonb('studentName').notNull(), // Localized
    courseTitle: jsonb('courseTitle').notNull(), // Localized
    completedAt: timestamp('completedAt').defaultNow().notNull(),
    pdfUrl: text('pdfUrl'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    userCourseUnique: uniqueIndex('Certificate_userId_courseId_key').on(table.userId, table.courseId),
    userIdx: index('Certificate_userId_idx').on(table.userId),
    courseIdx: index('Certificate_courseId_idx').on(table.courseId),
    completedAtIdx: index('Certificate_completedAt_idx').on(table.completedAt),
  })
);

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, {
    fields: [certificates.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [certificates.courseId],
    references: [courses.id],
  }),
}));

// ============================================================================
// PAYMENT SYSTEM
// ============================================================================

export const transactions = pgTable(
  'Transaction',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('courseId').references(() => courses.id, { onDelete: 'set null' }),
    amount: integer('amount').notNull(),
    currency: text('currency').default('vnd').notNull(),
    status: transactionStatusEnum('status').default('PENDING').notNull(),
    type: transactionTypeEnum('type').default('COURSE_PURCHASE').notNull(),
    stripeSessionId: text('stripeSessionId').unique(),
    stripePaymentIntentId: text('stripePaymentIntentId').unique(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
    completedAt: timestamp('completedAt'),
    failedAt: timestamp('failedAt'),
    refundedAt: timestamp('refundedAt'),
  },
  (table) => ({
    userIdx: index('Transaction_userId_idx').on(table.userId),
    courseIdx: index('Transaction_courseId_idx').on(table.courseId),
    statusIdx: index('Transaction_status_idx').on(table.status),
    stripeSessionIdx: index('Transaction_stripeSessionId_idx').on(table.stripeSessionId),
    stripePaymentIntentIdx: index('Transaction_stripePaymentIntentId_idx').on(table.stripePaymentIntentId),
    createdAtIdx: index('Transaction_createdAt_idx').on(table.createdAt),
  })
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [transactions.courseId],
    references: [courses.id],
  }),
}));

// ============================================================================
// UTILITY TABLES
// ============================================================================

export const userChecklists = pgTable('UserChecklist', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category'),
  items: jsonb('items').notNull(),
  progress: integer('progress').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const userChecklistsRelations = relations(userChecklists, ({ one }) => ({
  user: one(users, {
    fields: [userChecklists.userId],
    references: [users.id],
  }),
}));

export const refreshTokens = pgTable(
  'RefreshToken',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').unique().notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('RefreshToken_userId_idx').on(table.userId),
    tokenIdx: index('RefreshToken_token_idx').on(table.token),
  })
);

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// BETTER-AUTH TABLES
// ============================================================================

export const authUsers = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    email: text('email').unique().notNull(),
    emailVerified: boolean('emailVerified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  }
);

export const authSessions = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt').notNull(),
    token: text('token').unique().notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  }
);

export const authAccounts = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  }
);

export const authVerifications = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow(),
  }
);
