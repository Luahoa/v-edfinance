var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/index.ts
import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// src/trpc/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof Error ? error.cause.message : null
      }
    };
  }
});
var router = t.router;
var publicProcedure = t.procedure;
var createCallerFactory = t.createCallerFactory;
var protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user
    }
  });
});

// src/trpc/routers/user.ts
import { z } from "zod";
import { eq } from "drizzle-orm";

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  achievements: () => achievements,
  behaviorLogs: () => behaviorLogs,
  behaviorLogsRelations: () => behaviorLogsRelations,
  buddyChallenges: () => buddyChallenges,
  buddyChallengesRelations: () => buddyChallengesRelations,
  buddyGroupTypeEnum: () => buddyGroupTypeEnum,
  buddyGroups: () => buddyGroups,
  buddyGroupsRelations: () => buddyGroupsRelations,
  buddyMembers: () => buddyMembers,
  buddyMembersRelations: () => buddyMembersRelations,
  buddyRoleEnum: () => buddyRoleEnum,
  certificates: () => certificates,
  certificatesRelations: () => certificatesRelations,
  chatMessages: () => chatMessages,
  chatMessagesRelations: () => chatMessagesRelations,
  chatRoleEnum: () => chatRoleEnum,
  chatThreads: () => chatThreads,
  chatThreadsRelations: () => chatThreadsRelations,
  courses: () => courses,
  coursesRelations: () => coursesRelations,
  investmentProfiles: () => investmentProfiles,
  investmentProfilesRelations: () => investmentProfilesRelations,
  lessonTypeEnum: () => lessonTypeEnum,
  lessons: () => lessons,
  lessonsRelations: () => lessonsRelations,
  levelEnum: () => levelEnum,
  moderationLogs: () => moderationLogs,
  moderationLogsRelations: () => moderationLogsRelations,
  postTypeEnum: () => postTypeEnum,
  progressStatusEnum: () => progressStatusEnum,
  questionTypeEnum: () => questionTypeEnum,
  quizAttempts: () => quizAttempts,
  quizAttemptsRelations: () => quizAttemptsRelations,
  quizQuestions: () => quizQuestions,
  quizQuestionsRelations: () => quizQuestionsRelations,
  quizzes: () => quizzes,
  quizzesRelations: () => quizzesRelations,
  refreshTokens: () => refreshTokens,
  refreshTokensRelations: () => refreshTokensRelations,
  relationStatusEnum: () => relationStatusEnum,
  roleEnum: () => roleEnum,
  simulationCommitments: () => simulationCommitments,
  simulationCommitmentsRelations: () => simulationCommitmentsRelations,
  simulationScenarios: () => simulationScenarios,
  simulationScenariosRelations: () => simulationScenariosRelations,
  socialPosts: () => socialPosts,
  socialPostsRelations: () => socialPostsRelations,
  transactionStatusEnum: () => transactionStatusEnum,
  transactionTypeEnum: () => transactionTypeEnum,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  userAchievements: () => userAchievements,
  userAchievementsRelations: () => userAchievementsRelations,
  userChecklists: () => userChecklists,
  userChecklistsRelations: () => userChecklistsRelations,
  userProgress: () => userProgress,
  userProgressRelations: () => userProgressRelations,
  userRelationships: () => userRelationships,
  userRelationshipsRelations: () => userRelationshipsRelations,
  userStreaks: () => userStreaks,
  userStreaksRelations: () => userStreaksRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  virtualPortfolios: () => virtualPortfolios,
  virtualPortfoliosRelations: () => virtualPortfoliosRelations
});
import { relations } from "drizzle-orm";
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
  uuid
} from "drizzle-orm/pg-core";
var roleEnum = pgEnum("role", ["STUDENT", "TEACHER", "ADMIN"]);
var levelEnum = pgEnum("level", ["BEGINNER", "INTERMEDIATE", "EXPERT"]);
var lessonTypeEnum = pgEnum("lesson_type", ["VIDEO", "READING", "QUIZ", "INTERACTIVE"]);
var progressStatusEnum = pgEnum("progress_status", ["STARTED", "IN_PROGRESS", "COMPLETED"]);
var chatRoleEnum = pgEnum("chat_role", ["USER", "ASSISTANT", "SYSTEM"]);
var buddyGroupTypeEnum = pgEnum("buddy_group_type", ["LEARNING", "SAVING", "INVESTING"]);
var buddyRoleEnum = pgEnum("buddy_role", ["LEADER", "MEMBER"]);
var postTypeEnum = pgEnum("post_type", ["ACHIEVEMENT", "MILESTONE", "NUDGE", "DISCUSSION"]);
var relationStatusEnum = pgEnum("relation_status", ["FOLLOWING", "FRIEND_REQUESTED", "FRIENDS", "BLOCKED"]);
var questionTypeEnum = pgEnum("question_type", ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "MATCHING"]);
var transactionStatusEnum = pgEnum("transaction_status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"]);
var transactionTypeEnum = pgEnum("transaction_type", ["COURSE_PURCHASE", "SUBSCRIPTION", "CREDITS", "DONATION"]);
var users = pgTable(
  "User",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").unique().notNull(),
    passwordHash: text("passwordHash").notNull(),
    name: jsonb("name"),
    // Localized: { vi, en, zh }
    role: roleEnum("role").default("STUDENT").notNull(),
    points: integer("points").default(0).notNull(),
    preferredLocale: text("preferredLocale").default("vi").notNull(),
    preferredLanguage: text("preferredLanguage"),
    dateOfBirth: timestamp("dateOfBirth"),
    moderationStrikes: integer("moderationStrikes").default(0).notNull(),
    failedLoginAttempts: integer("failedLoginAttempts").default(0).notNull(),
    lockedUntil: timestamp("lockedUntil"),
    stripeCustomerId: text("stripeCustomerId").unique(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull()
  },
  (table) => ({
    emailIdx: index("User_email_idx").on(table.email),
    roleIdx: index("User_role_idx").on(table.role),
    createdAtIdx: index("User_createdAt_idx").on(table.createdAt),
    pointsIdx: index("User_points_idx").on(table.points)
  })
);
var usersRelations = relations(users, ({ one, many }) => ({
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
  moderationLogs: many(moderationLogs, { relationName: "userLogs" }),
  moderatedLogs: many(moderationLogs, { relationName: "moderatorLogs" }),
  following: many(userRelationships, { relationName: "following" }),
  followers: many(userRelationships, { relationName: "followers" }),
  quizAttempts: many(quizAttempts),
  certificates: many(certificates),
  transactions: many(transactions)
}));
var courses = pgTable(
  "Course",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").unique().notNull(),
    title: jsonb("title").notNull(),
    // Localized
    description: jsonb("description").notNull(),
    // Localized
    thumbnailKey: text("thumbnailKey").notNull(),
    price: integer("price").notNull(),
    level: levelEnum("level").default("BEGINNER").notNull(),
    published: boolean("published").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull()
  },
  (table) => ({
    slugIdx: index("Course_slug_idx").on(table.slug),
    publishedLevelIdx: index("Course_published_level_idx").on(table.published, table.level)
  })
);
var coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
  certificates: many(certificates),
  transactions: many(transactions)
}));
var lessons = pgTable(
  "Lesson",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    title: jsonb("title").notNull(),
    // Localized
    content: jsonb("content").notNull(),
    // Localized
    videoKey: jsonb("videoKey"),
    // Localized
    type: lessonTypeEnum("type").default("VIDEO").notNull(),
    duration: integer("duration"),
    published: boolean("published").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull()
  },
  (table) => ({
    courseOrderUnique: uniqueIndex("Lesson_courseId_order_key").on(table.courseId, table.order),
    coursePublishedIdx: index("Lesson_courseId_published_idx").on(table.courseId, table.published)
  })
);
var lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id]
  }),
  progress: many(userProgress),
  quizzes: many(quizzes)
}));
var userProgress = pgTable(
  "UserProgress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lessonId").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    status: progressStatusEnum("status").default("STARTED").notNull(),
    durationSpent: integer("durationSpent").default(0).notNull(),
    progressPercentage: real("progressPercentage").default(0),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull()
  },
  (table) => ({
    userLessonUnique: uniqueIndex("UserProgress_userId_lessonId_key").on(table.userId, table.lessonId),
    userStatusIdx: index("UserProgress_userId_status_idx").on(table.userId, table.status),
    lessonStatusIdx: index("UserProgress_lessonId_status_idx").on(table.lessonId, table.status),
    userCreatedAtIdx: index("UserProgress_userId_createdAt_idx").on(table.userId, table.createdAt),
    completedAtIdx: index("UserProgress_completedAt_idx").on(table.completedAt)
  })
);
var userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id]
  }),
  lesson: one(lessons, {
    fields: [userProgress.lessonId],
    references: [lessons.id]
  })
}));
var chatThreads = pgTable(
  "ChatThread",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull().references(() => users.id),
    title: text("title").notNull(),
    module: text("module"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull()
  },
  (table) => ({
    userIdx: index("ChatThread_userId_idx").on(table.userId)
  })
);
var chatThreadsRelations = relations(chatThreads, ({ one, many }) => ({
  user: one(users, {
    fields: [chatThreads.userId],
    references: [users.id]
  }),
  messages: many(chatMessages)
}));
var chatMessages = pgTable(
  "ChatMessage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("threadId").notNull().references(() => chatThreads.id),
    role: chatRoleEnum("role").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => ({
    threadIdx: index("ChatMessage_threadId_idx").on(table.threadId)
  })
);
var chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  thread: one(chatThreads, {
    fields: [chatMessages.threadId],
    references: [chatThreads.id]
  })
}));
var behaviorLogs = pgTable(
  "BehaviorLog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").references(() => users.id),
    sessionId: text("sessionId").notNull(),
    path: text("path").notNull(),
    eventType: text("eventType").notNull(),
    actionCategory: text("actionCategory").default("GENERAL"),
    duration: integer("duration").default(0),
    deviceInfo: jsonb("deviceInfo"),
    payload: jsonb("payload"),
    timestamp: timestamp("timestamp").defaultNow().notNull()
  },
  (table) => ({
    userTimestampIdx: index("BehaviorLog_userId_timestamp_idx").on(table.userId, table.timestamp),
    sessionIdx: index("BehaviorLog_sessionId_idx").on(table.sessionId),
    sessionEventIdx: index("BehaviorLog_sessionId_eventType_idx").on(table.sessionId, table.eventType),
    actionCategoryIdx: index("BehaviorLog_actionCategory_idx").on(table.actionCategory),
    eventTimestampIdx: index("BehaviorLog_eventType_timestamp_idx").on(table.eventType, table.timestamp),
    eventUserIdx: index("BehaviorLog_eventType_userId_idx").on(table.eventType, table.userId)
  })
);
var behaviorLogsRelations = relations(behaviorLogs, ({ one }) => ({
  user: one(users, {
    fields: [behaviorLogs.userId],
    references: [users.id]
  })
}));
var investmentProfiles = pgTable("InvestmentProfile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  riskScore: integer("riskScore").default(50).notNull(),
  investmentPhilosophy: jsonb("investmentPhilosophy").notNull(),
  financialGoals: jsonb("financialGoals").notNull(),
  currentKnowledge: levelEnum("currentKnowledge").default("BEGINNER").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var investmentProfilesRelations = relations(investmentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [investmentProfiles.userId],
    references: [users.id]
  })
}));
var virtualPortfolios = pgTable("VirtualPortfolio", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").default(1e7).notNull(),
  holdings: jsonb("holdings").default([]).notNull(),
  transactions: jsonb("transactions").default([]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var virtualPortfoliosRelations = relations(virtualPortfolios, ({ one }) => ({
  user: one(users, {
    fields: [virtualPortfolios.userId],
    references: [users.id]
  })
}));
var userStreaks = pgTable("UserStreak", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("currentStreak").default(0).notNull(),
  longestStreak: integer("longestStreak").default(0).notNull(),
  lastActivityDate: timestamp("lastActivityDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(users, {
    fields: [userStreaks.userId],
    references: [users.id]
  })
}));
var achievements = pgTable(
  "Achievement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").unique().notNull(),
    name: jsonb("name").notNull(),
    // Localized
    description: jsonb("description").notNull(),
    // Localized
    iconKey: text("iconKey").notNull(),
    criteria: jsonb("criteria").notNull(),
    points: integer("points").default(0).notNull(),
    tier: text("tier").default("BRONZE").notNull(),
    category: text("category").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull()
  },
  (table) => ({
    categoryIdx: index("Achievement_category_idx").on(table.category),
    tierIdx: index("Achievement_tier_idx").on(table.tier),
    isActiveIdx: index("Achievement_isActive_idx").on(table.isActive)
  })
);
var userAchievements = pgTable(
  "UserAchievement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievementId").notNull(),
    progress: integer("progress").default(0).notNull(),
    earnedAt: timestamp("earnedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => ({
    userAchievementUnique: uniqueIndex("UserAchievement_userId_achievementId_key").on(
      table.userId,
      table.achievementId
    ),
    userIdx: index("UserAchievement_userId_idx").on(table.userId)
  })
);
var userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id]
  })
}));
var buddyGroups = pgTable("BuddyGroup", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  description: text("description"),
  type: buddyGroupTypeEnum("type").default("LEARNING").notNull(),
  totalPoints: integer("totalPoints").default(0).notNull(),
  streak: integer("streak").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var buddyGroupsRelations = relations(buddyGroups, ({ many }) => ({
  members: many(buddyMembers),
  challenges: many(buddyChallenges),
  feedPosts: many(socialPosts)
}));
var buddyMembers = pgTable(
  "BuddyMember",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("groupId").notNull().references(() => buddyGroups.id, { onDelete: "cascade" }),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: buddyRoleEnum("role").default("MEMBER").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull()
  },
  (table) => ({
    groupUserUnique: uniqueIndex("BuddyMember_groupId_userId_key").on(table.groupId, table.userId),
    userIdx: index("BuddyMember_userId_idx").on(table.userId)
  })
);
var buddyMembersRelations = relations(buddyMembers, ({ one }) => ({
  group: one(buddyGroups, {
    fields: [buddyMembers.groupId],
    references: [buddyGroups.id]
  }),
  user: one(users, {
    fields: [buddyMembers.userId],
    references: [users.id]
  })
}));
var buddyChallenges = pgTable(
  "BuddyChallenge",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("groupId").notNull().references(() => buddyGroups.id, { onDelete: "cascade" }),
    title: jsonb("title").notNull(),
    // Localized
    target: integer("target").notNull(),
    rewardPoints: integer("rewardPoints").notNull(),
    expiresAt: timestamp("expiresAt").notNull()
  },
  (table) => ({
    groupIdx: index("BuddyChallenge_groupId_idx").on(table.groupId)
  })
);
var buddyChallengesRelations = relations(buddyChallenges, ({ one }) => ({
  group: one(buddyGroups, {
    fields: [buddyChallenges.groupId],
    references: [buddyGroups.id]
  })
}));
var socialPosts = pgTable(
  "SocialPost",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    groupId: uuid("groupId").references(() => buddyGroups.id),
    type: postTypeEnum("type").default("ACHIEVEMENT").notNull(),
    content: jsonb("content"),
    likesCount: integer("likesCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => ({
    groupIdx: index("SocialPost_groupId_idx").on(table.groupId),
    userIdx: index("SocialPost_userId_idx").on(table.userId)
  })
);
var socialPostsRelations = relations(socialPosts, ({ one }) => ({
  user: one(users, {
    fields: [socialPosts.userId],
    references: [users.id]
  }),
  group: one(buddyGroups, {
    fields: [socialPosts.groupId],
    references: [buddyGroups.id]
  })
}));
var userRelationships = pgTable(
  "UserRelationship",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: uuid("followerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    followedId: uuid("followedId").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: relationStatusEnum("status").default("FOLLOWING").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull()
  },
  (table) => ({
    followerFollowedUnique: uniqueIndex("UserRelationship_followerId_followedId_key").on(
      table.followerId,
      table.followedId
    ),
    followerIdx: index("UserRelationship_followerId_idx").on(table.followerId),
    followedIdx: index("UserRelationship_followedId_idx").on(table.followedId)
  })
);
var userRelationshipsRelations = relations(userRelationships, ({ one }) => ({
  follower: one(users, {
    fields: [userRelationships.followerId],
    references: [users.id],
    relationName: "following"
  }),
  followed: one(users, {
    fields: [userRelationships.followedId],
    references: [users.id],
    relationName: "followers"
  })
}));
var simulationScenarios = pgTable(
  "SimulationScenario",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: jsonb("title").notNull(),
    // Localized
    scenarioData: jsonb("scenarioData").notNull(),
    result: jsonb("result"),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => ({
    userIdx: index("SimulationScenario_userId_idx").on(table.userId)
  })
);
var simulationScenariosRelations = relations(simulationScenarios, ({ one, many }) => ({
  user: one(users, {
    fields: [simulationScenarios.userId],
    references: [users.id]
  }),
  commitments: many(simulationCommitments)
}));
var simulationCommitments = pgTable(
  "SimulationCommitment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    scenarioId: uuid("scenarioId").notNull().references(() => simulationScenarios.id, { onDelete: "cascade" }),
    commitment: text("commitment").notNull(),
    isCompleted: boolean("isCompleted").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => ({
    userIdx: index("SimulationCommitment_userId_idx").on(table.userId),
    scenarioIdx: index("SimulationCommitment_scenarioId_idx").on(table.scenarioId)
  })
);
var simulationCommitmentsRelations = relations(simulationCommitments, ({ one }) => ({
  user: one(users, {
    fields: [simulationCommitments.userId],
    references: [users.id]
  }),
  scenario: one(simulationScenarios, {
    fields: [simulationCommitments.scenarioId],
    references: [simulationScenarios.id]
  })
}));
var moderationLogs = pgTable(
  "ModerationLog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    reason: text("reason").notNull(),
    moderatorId: uuid("moderatorId").references(() => users.id),
    severity: text("severity"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => ({
    userIdx: index("ModerationLog_userId_idx").on(table.userId),
    createdAtIdx: index("ModerationLog_createdAt_idx").on(table.createdAt),
    actionIdx: index("ModerationLog_action_idx").on(table.action)
  })
);
var moderationLogsRelations = relations(moderationLogs, ({ one }) => ({
  user: one(users, {
    fields: [moderationLogs.userId],
    references: [users.id],
    relationName: "userLogs"
  }),
  moderator: one(users, {
    fields: [moderationLogs.moderatorId],
    references: [users.id],
    relationName: "moderatorLogs"
  })
}));
var quizzes = pgTable(
  "Quiz",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lessonId: uuid("lessonId").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    title: jsonb("title").notNull(),
    // Localized
    description: jsonb("description"),
    // Localized
    published: boolean("published").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull()
  },
  (table) => ({
    lessonIdx: index("Quiz_lessonId_idx").on(table.lessonId),
    publishedIdx: index("Quiz_published_idx").on(table.published)
  })
);
var quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id]
  }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts)
}));
var quizQuestions = pgTable(
  "QuizQuestion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quizId").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    type: questionTypeEnum("type").notNull(),
    question: jsonb("question").notNull(),
    // Localized
    options: jsonb("options"),
    // For MULTIPLE_CHOICE, MATCHING
    correctAnswer: jsonb("correctAnswer").notNull(),
    points: integer("points").default(1).notNull(),
    order: integer("order").notNull(),
    explanation: jsonb("explanation")
    // Localized
  },
  (table) => ({
    quizOrderUnique: uniqueIndex("QuizQuestion_quizId_order_key").on(table.quizId, table.order),
    quizIdx: index("QuizQuestion_quizId_idx").on(table.quizId)
  })
);
var quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id]
  })
}));
var quizAttempts = pgTable(
  "QuizAttempt",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    quizId: uuid("quizId").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    answers: jsonb("answers").notNull(),
    // { questionId: userAnswer }
    score: integer("score").notNull(),
    percentage: real("percentage").notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt")
  },
  (table) => ({
    userQuizIdx: index("QuizAttempt_userId_quizId_idx").on(table.userId, table.quizId),
    quizIdx: index("QuizAttempt_quizId_idx").on(table.quizId),
    userCompletedIdx: index("QuizAttempt_userId_completedAt_idx").on(table.userId, table.completedAt)
  })
);
var quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id]
  }),
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id]
  })
}));
var certificates = pgTable(
  "Certificate",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
    studentName: jsonb("studentName").notNull(),
    // Localized
    courseTitle: jsonb("courseTitle").notNull(),
    // Localized
    completedAt: timestamp("completedAt").defaultNow().notNull(),
    pdfUrl: text("pdfUrl"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => ({
    userCourseUnique: uniqueIndex("Certificate_userId_courseId_key").on(table.userId, table.courseId),
    userIdx: index("Certificate_userId_idx").on(table.userId),
    courseIdx: index("Certificate_courseId_idx").on(table.courseId),
    completedAtIdx: index("Certificate_completedAt_idx").on(table.completedAt)
  })
);
var certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, {
    fields: [certificates.userId],
    references: [users.id]
  }),
  course: one(courses, {
    fields: [certificates.courseId],
    references: [courses.id]
  })
}));
var transactions = pgTable(
  "Transaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("courseId").references(() => courses.id, { onDelete: "set null" }),
    amount: integer("amount").notNull(),
    currency: text("currency").default("vnd").notNull(),
    status: transactionStatusEnum("status").default("PENDING").notNull(),
    type: transactionTypeEnum("type").default("COURSE_PURCHASE").notNull(),
    stripeSessionId: text("stripeSessionId").unique(),
    stripePaymentIntentId: text("stripePaymentIntentId").unique(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    failedAt: timestamp("failedAt"),
    refundedAt: timestamp("refundedAt")
  },
  (table) => ({
    userIdx: index("Transaction_userId_idx").on(table.userId),
    courseIdx: index("Transaction_courseId_idx").on(table.courseId),
    statusIdx: index("Transaction_status_idx").on(table.status),
    stripeSessionIdx: index("Transaction_stripeSessionId_idx").on(table.stripeSessionId),
    stripePaymentIntentIdx: index("Transaction_stripePaymentIntentId_idx").on(table.stripePaymentIntentId),
    createdAtIdx: index("Transaction_createdAt_idx").on(table.createdAt)
  })
);
var transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
  }),
  course: one(courses, {
    fields: [transactions.courseId],
    references: [courses.id]
  })
}));
var userChecklists = pgTable("UserChecklist", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category"),
  items: jsonb("items").notNull(),
  progress: integer("progress").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var userChecklistsRelations = relations(userChecklists, ({ one }) => ({
  user: one(users, {
    fields: [userChecklists.userId],
    references: [users.id]
  })
}));
var refreshTokens = pgTable(
  "RefreshToken",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").unique().notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => ({
    userIdx: index("RefreshToken_userId_idx").on(table.userId),
    tokenIdx: index("RefreshToken_token_idx").on(table.token)
  })
);
var refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id]
  })
}));

// src/trpc/routers/user.ts
var userRouter = router({
  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id)
    });
    return user;
  }),
  // Get user by ID (public)
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, input.id),
      columns: {
        id: true,
        name: true,
        role: true,
        points: true,
        createdAt: true
      }
    });
    return user;
  }),
  // Update profile
  updateProfile: protectedProcedure.input(
    z.object({
      name: z.record(z.string(), z.string()).optional(),
      preferredLocale: z.enum(["vi", "en", "zh"]).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const updated = await ctx.db.update(users).set({
      ...input.name && { name: input.name },
      ...input.preferredLocale && { preferredLocale: input.preferredLocale },
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, ctx.user.id)).returning();
    return updated[0];
  })
});

// src/trpc/routers/course.ts
import { z as z2 } from "zod";
import { eq as eq2, and, desc } from "drizzle-orm";
var courseRouter = router({
  // List published courses
  list: publicProcedure.input(
    z2.object({
      level: z2.enum(["BEGINNER", "INTERMEDIATE", "EXPERT"]).optional(),
      limit: z2.number().min(1).max(50).default(20),
      offset: z2.number().min(0).default(0)
    })
  ).query(async ({ ctx, input }) => {
    const whereConditions = [eq2(courses.published, true)];
    if (input.level) {
      whereConditions.push(eq2(courses.level, input.level));
    }
    const result = await ctx.db.query.courses.findMany({
      where: and(...whereConditions),
      limit: input.limit,
      offset: input.offset,
      orderBy: desc(courses.createdAt)
    });
    return result;
  }),
  // Get course by slug with lessons
  getBySlug: publicProcedure.input(z2.object({ slug: z2.string() })).query(async ({ ctx, input }) => {
    const course = await ctx.db.query.courses.findFirst({
      where: eq2(courses.slug, input.slug),
      with: {
        lessons: {
          where: eq2(lessons.published, true),
          orderBy: lessons.order
        }
      }
    });
    return course;
  }),
  // Get user progress for a course
  getProgress: protectedProcedure.input(z2.object({ courseId: z2.string() })).query(async ({ ctx, input }) => {
    const progress = await ctx.db.query.userProgress.findMany({
      where: and(
        eq2(userProgress.userId, ctx.user.id)
        // Join with lessons to filter by courseId
      ),
      with: {
        lesson: true
      }
    });
    return progress;
  }),
  // Update lesson progress
  updateProgress: protectedProcedure.input(
    z2.object({
      lessonId: z2.string(),
      status: z2.enum(["STARTED", "IN_PROGRESS", "COMPLETED"]),
      durationSpent: z2.number().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.query.userProgress.findFirst({
      where: and(
        eq2(userProgress.userId, ctx.user.id),
        eq2(userProgress.lessonId, input.lessonId)
      )
    });
    if (existing) {
      const updated = await ctx.db.update(userProgress).set({
        status: input.status,
        durationSpent: input.durationSpent ?? existing.durationSpent,
        completedAt: input.status === "COMPLETED" ? /* @__PURE__ */ new Date() : null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(userProgress.id, existing.id)).returning();
      return updated[0];
    }
    const created = await ctx.db.insert(userProgress).values({
      userId: ctx.user.id,
      lessonId: input.lessonId,
      status: input.status,
      durationSpent: input.durationSpent ?? 0
    }).returning();
    return created[0];
  })
});

// src/trpc/routers/quiz.ts
import { z as z3 } from "zod";
import { eq as eq3, and as and2, desc as desc2 } from "drizzle-orm";
var quizRouter = router({
  // Get quiz by ID with questions
  getById: protectedProcedure.input(z3.object({ id: z3.string() })).query(async ({ ctx, input }) => {
    const quiz = await ctx.db.query.quizzes.findFirst({
      where: eq3(quizzes.id, input.id),
      with: {
        questions: {
          orderBy: quizQuestions.order
        }
      }
    });
    return quiz;
  }),
  // Get quizzes for a lesson
  getByLesson: protectedProcedure.input(z3.object({ lessonId: z3.string() })).query(async ({ ctx, input }) => {
    const lessonQuizzes = await ctx.db.query.quizzes.findMany({
      where: and2(
        eq3(quizzes.lessonId, input.lessonId),
        eq3(quizzes.published, true)
      )
    });
    return lessonQuizzes;
  }),
  // Submit quiz attempt
  submit: protectedProcedure.input(
    z3.object({
      quizId: z3.string(),
      answers: z3.record(z3.string(), z3.unknown())
      // questionId -> answer
    })
  ).mutation(async ({ ctx, input }) => {
    const quiz = await ctx.db.query.quizzes.findFirst({
      where: eq3(quizzes.id, input.quizId),
      with: {
        questions: true
      }
    });
    if (!quiz) {
      throw new Error("Quiz not found");
    }
    let score = 0;
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    for (const question of quiz.questions) {
      const userAnswer = input.answers[question.id];
      if (JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)) {
        score += question.points;
      }
    }
    const percentage = totalPoints > 0 ? score / totalPoints * 100 : 0;
    const [attempt] = await ctx.db.insert(quizAttempts).values({
      userId: ctx.user.id,
      quizId: input.quizId,
      answers: input.answers,
      score,
      percentage,
      completedAt: /* @__PURE__ */ new Date()
    }).returning();
    return attempt;
  }),
  // Get user's attempts for a quiz
  getAttempts: protectedProcedure.input(z3.object({ quizId: z3.string() })).query(async ({ ctx, input }) => {
    const attempts = await ctx.db.query.quizAttempts.findMany({
      where: and2(
        eq3(quizAttempts.userId, ctx.user.id),
        eq3(quizAttempts.quizId, input.quizId)
      ),
      orderBy: desc2(quizAttempts.startedAt)
    });
    return attempts;
  })
});

// src/trpc/routers/gamification.ts
import { z as z4 } from "zod";
import { eq as eq4, desc as desc3, sql } from "drizzle-orm";
var gamificationRouter = router({
  // Get leaderboard
  leaderboard: publicProcedure.input(
    z4.object({
      limit: z4.number().min(1).max(100).default(10),
      period: z4.enum(["all", "weekly", "monthly"]).default("all")
    })
  ).query(async ({ ctx, input }) => {
    const topUsers = await ctx.db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        points: true,
        role: true
      },
      orderBy: desc3(users.points),
      limit: input.limit
    });
    return topUsers;
  }),
  // Get user's streak
  getStreak: protectedProcedure.query(async ({ ctx }) => {
    const streak = await ctx.db.query.userStreaks.findFirst({
      where: eq4(userStreaks.userId, ctx.user.id)
    });
    return streak || { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
  }),
  // Update streak (called on daily activity)
  updateStreak: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.db.query.userStreaks.findFirst({
      where: eq4(userStreaks.userId, ctx.user.id)
    });
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    if (existing) {
      const lastActivity = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
      if (lastActivity) {
        lastActivity.setHours(0, 0, 0, 0);
        const diffDays = Math.floor(
          (today.getTime() - lastActivity.getTime()) / (1e3 * 60 * 60 * 24)
        );
        if (diffDays === 0) {
          return existing;
        }
        if (diffDays === 1) {
          const newStreak = existing.currentStreak + 1;
          const [updated2] = await ctx.db.update(userStreaks).set({
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, existing.longestStreak),
            lastActivityDate: today,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq4(userStreaks.id, existing.id)).returning();
          return updated2;
        }
        const [updated] = await ctx.db.update(userStreaks).set({
          currentStreak: 1,
          lastActivityDate: today,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq4(userStreaks.id, existing.id)).returning();
        return updated;
      }
    }
    const [created] = await ctx.db.insert(userStreaks).values({
      userId: ctx.user.id,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today
    }).returning();
    return created;
  }),
  // Get user's achievements
  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    const userAchievementsList = await ctx.db.query.userAchievements.findMany({
      where: eq4(userAchievements.userId, ctx.user.id)
    });
    return userAchievementsList;
  }),
  // Add points to user
  addPoints: protectedProcedure.input(
    z4.object({
      points: z4.number().min(1).max(1e3),
      reason: z4.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db.update(users).set({
      points: sql`${users.points} + ${input.points}`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(users.id, ctx.user.id)).returning();
    return updated;
  })
});

// src/trpc/routers/certificate.ts
import { z as z5 } from "zod";
import { eq as eq5, desc as desc4, and as and4 } from "drizzle-orm";
var certificateRouter = router({
  // Get user's certificates
  list: protectedProcedure.query(async ({ ctx }) => {
    const userCertificates = await ctx.db.query.certificates.findMany({
      where: eq5(certificates.userId, ctx.user.id),
      with: {
        course: true
      },
      orderBy: desc4(certificates.completedAt)
    });
    return userCertificates;
  }),
  // Get certificate by ID
  getById: protectedProcedure.input(z5.object({ id: z5.string() })).query(async ({ ctx, input }) => {
    const certificate = await ctx.db.query.certificates.findFirst({
      where: and4(
        eq5(certificates.id, input.id),
        eq5(certificates.userId, ctx.user.id)
      ),
      with: {
        course: true
      }
    });
    return certificate;
  }),
  // Check eligibility for course certificate
  checkEligibility: protectedProcedure.input(z5.object({ courseId: z5.string() })).query(async ({ ctx, input }) => {
    const course = await ctx.db.query.courses.findFirst({
      where: eq5(courses.id, input.courseId),
      with: {
        lessons: {
          where: eq5(lessons.published, true)
        }
      }
    });
    if (!course) {
      return { eligible: false, reason: "Course not found" };
    }
    const existingCert = await ctx.db.query.certificates.findFirst({
      where: and4(
        eq5(certificates.userId, ctx.user.id),
        eq5(certificates.courseId, input.courseId)
      )
    });
    if (existingCert) {
      return { eligible: false, reason: "Certificate already issued", certificate: existingCert };
    }
    const lessonIds = course.lessons.map((l) => l.id);
    const progress = await ctx.db.query.userProgress.findMany({
      where: and4(
        eq5(userProgress.userId, ctx.user.id),
        eq5(userProgress.status, "COMPLETED")
      )
    });
    const completedLessonIds = new Set(progress.map((p) => p.lessonId));
    const allCompleted = lessonIds.every((id) => completedLessonIds.has(id));
    if (!allCompleted) {
      const completedCount = lessonIds.filter((id) => completedLessonIds.has(id)).length;
      return {
        eligible: false,
        reason: `Complete all lessons first (${completedCount}/${lessonIds.length})`,
        progress: {
          completed: completedCount,
          total: lessonIds.length
        }
      };
    }
    return { eligible: true };
  }),
  // Generate certificate
  generate: protectedProcedure.input(z5.object({ courseId: z5.string() })).mutation(async ({ ctx, input }) => {
    const course = await ctx.db.query.courses.findFirst({
      where: eq5(courses.id, input.courseId)
    });
    if (!course) {
      throw new Error("Course not found");
    }
    const existingCert = await ctx.db.query.certificates.findFirst({
      where: and4(
        eq5(certificates.userId, ctx.user.id),
        eq5(certificates.courseId, input.courseId)
      )
    });
    if (existingCert) {
      return existingCert;
    }
    const user = await ctx.db.query.users.findFirst({
      where: eq5(ctx.db.users.id, ctx.user.id)
    });
    const [certificate] = await ctx.db.insert(certificates).values({
      userId: ctx.user.id,
      courseId: input.courseId,
      studentName: user?.name || { vi: "H\u1ECDc vi\xEAn", en: "Student", zh: "\u5B66\u751F" },
      courseTitle: course.title,
      completedAt: /* @__PURE__ */ new Date()
    }).returning();
    return certificate;
  })
});

// src/trpc/routers/social.ts
import { z as z6 } from "zod";
import { eq as eq6, desc as desc5, and as and5 } from "drizzle-orm";
var socialRouter = router({
  // Get social feed
  feed: protectedProcedure.input(
    z6.object({
      limit: z6.number().min(1).max(50).default(20),
      offset: z6.number().min(0).default(0)
    })
  ).query(async ({ ctx, input }) => {
    const posts = await ctx.db.query.socialPosts.findMany({
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: desc5(socialPosts.createdAt),
      limit: input.limit,
      offset: input.offset
    });
    return posts;
  }),
  // Create post
  createPost: protectedProcedure.input(
    z6.object({
      type: z6.enum(["ACHIEVEMENT", "MILESTONE", "NUDGE", "DISCUSSION"]),
      content: z6.record(z6.string(), z6.unknown()).optional(),
      groupId: z6.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const [post] = await ctx.db.insert(socialPosts).values({
      userId: ctx.user.id,
      type: input.type,
      content: input.content,
      groupId: input.groupId
    }).returning();
    return post;
  }),
  // Get user's groups
  myGroups: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.buddyMembers.findMany({
      where: eq6(buddyMembers.userId, ctx.user.id),
      with: {
        group: true
      }
    });
    return memberships.map((m) => ({ ...m.group, role: m.role }));
  }),
  // Get group by ID
  getGroup: protectedProcedure.input(z6.object({ id: z6.string() })).query(async ({ ctx, input }) => {
    const group = await ctx.db.query.buddyGroups.findFirst({
      where: eq6(buddyGroups.id, input.id),
      with: {
        members: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                role: true,
                points: true
              }
            }
          }
        },
        feedPosts: {
          orderBy: desc5(socialPosts.createdAt),
          limit: 20
        }
      }
    });
    return group;
  }),
  // Join group
  joinGroup: protectedProcedure.input(z6.object({ groupId: z6.string() })).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.query.buddyMembers.findFirst({
      where: and5(
        eq6(buddyMembers.groupId, input.groupId),
        eq6(buddyMembers.userId, ctx.user.id)
      )
    });
    if (existing) {
      return existing;
    }
    const [member] = await ctx.db.insert(buddyMembers).values({
      groupId: input.groupId,
      userId: ctx.user.id,
      role: "MEMBER"
    }).returning();
    return member;
  }),
  // Leave group
  leaveGroup: protectedProcedure.input(z6.object({ groupId: z6.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(buddyMembers).where(
      and5(
        eq6(buddyMembers.groupId, input.groupId),
        eq6(buddyMembers.userId, ctx.user.id)
      )
    );
    return { success: true };
  }),
  // Follow user
  follow: protectedProcedure.input(z6.object({ userId: z6.string() })).mutation(async ({ ctx, input }) => {
    if (input.userId === ctx.user.id) {
      throw new Error("Cannot follow yourself");
    }
    const existing = await ctx.db.query.userRelationships.findFirst({
      where: and5(
        eq6(userRelationships.followerId, ctx.user.id),
        eq6(userRelationships.followedId, input.userId)
      )
    });
    if (existing) {
      return existing;
    }
    const [relationship] = await ctx.db.insert(userRelationships).values({
      followerId: ctx.user.id,
      followedId: input.userId,
      status: "FOLLOWING"
    }).returning();
    return relationship;
  }),
  // Unfollow user
  unfollow: protectedProcedure.input(z6.object({ userId: z6.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(userRelationships).where(
      and5(
        eq6(userRelationships.followerId, ctx.user.id),
        eq6(userRelationships.followedId, input.userId)
      )
    );
    return { success: true };
  })
});

// src/trpc/router.ts
var appRouter = router({
  user: userRouter,
  course: courseRouter,
  quiz: quizRouter,
  gamification: gamificationRouter,
  certificate: certificateRouter,
  social: socialRouter
});

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// src/lib/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
var connectionString = process.env.DATABASE_URL;
var queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});
var db = drizzle(queryClient, { schema: schema_exports });

// src/lib/auth.ts
var auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg"
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    // 7 days
    updateAge: 60 * 60 * 24,
    // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5
      // 5 minutes
    }
  },
  trustedOrigins: ["http://localhost:3000", "https://vedfinance.com"]
});

// src/trpc/context.ts
async function createContext({ req }) {
  const session = await auth.api.getSession({
    headers: req.headers
  });
  return {
    db,
    session: session?.session ?? null,
    user: session?.user ?? null,
    req
  };
}

// src/index.ts
var app = new Hono();
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://vedfinance.com"],
    credentials: true
  })
);
app.get("/health", (c) => c.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext
  })
);
var port = Number(process.env.PORT) || 4e3;
console.log(`\u{1F680} Server starting on http://localhost:${port}`);
serve({
  fetch: app.fetch,
  port
});
var index_default = app;
export {
  index_default as default
};
