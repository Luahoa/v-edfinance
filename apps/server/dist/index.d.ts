import * as hono_types from 'hono/types';
import { Hono } from 'hono';
import * as _trpc_server from '@trpc/server';
import * as postgres from 'postgres';
import * as drizzle_orm_postgres_js from 'drizzle-orm/postgres-js';
import * as drizzle_orm from 'drizzle-orm';
import * as drizzle_orm_pg_core from 'drizzle-orm/pg-core';

declare const roleEnum: drizzle_orm_pg_core.PgEnum<["STUDENT", "TEACHER", "ADMIN"]>;
declare const levelEnum: drizzle_orm_pg_core.PgEnum<["BEGINNER", "INTERMEDIATE", "EXPERT"]>;
declare const lessonTypeEnum: drizzle_orm_pg_core.PgEnum<["VIDEO", "READING", "QUIZ", "INTERACTIVE"]>;
declare const progressStatusEnum: drizzle_orm_pg_core.PgEnum<["STARTED", "IN_PROGRESS", "COMPLETED"]>;
declare const chatRoleEnum: drizzle_orm_pg_core.PgEnum<["USER", "ASSISTANT", "SYSTEM"]>;
declare const buddyGroupTypeEnum: drizzle_orm_pg_core.PgEnum<["LEARNING", "SAVING", "INVESTING"]>;
declare const buddyRoleEnum: drizzle_orm_pg_core.PgEnum<["LEADER", "MEMBER"]>;
declare const postTypeEnum: drizzle_orm_pg_core.PgEnum<["ACHIEVEMENT", "MILESTONE", "NUDGE", "DISCUSSION"]>;
declare const relationStatusEnum: drizzle_orm_pg_core.PgEnum<["FOLLOWING", "FRIEND_REQUESTED", "FRIENDS", "BLOCKED"]>;
declare const questionTypeEnum: drizzle_orm_pg_core.PgEnum<["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "MATCHING"]>;
declare const transactionStatusEnum: drizzle_orm_pg_core.PgEnum<["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"]>;
declare const transactionTypeEnum: drizzle_orm_pg_core.PgEnum<["COURSE_PURCHASE", "SUBSCRIPTION", "CREDITS", "DONATION"]>;
declare const users: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "User";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "User";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        email: drizzle_orm_pg_core.PgColumn<{
            name: "email";
            tableName: "User";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        passwordHash: drizzle_orm_pg_core.PgColumn<{
            name: "passwordHash";
            tableName: "User";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        name: drizzle_orm_pg_core.PgColumn<{
            name: "name";
            tableName: "User";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        role: drizzle_orm_pg_core.PgColumn<{
            name: "role";
            tableName: "User";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "STUDENT" | "TEACHER" | "ADMIN";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["STUDENT", "TEACHER", "ADMIN"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        points: drizzle_orm_pg_core.PgColumn<{
            name: "points";
            tableName: "User";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        preferredLocale: drizzle_orm_pg_core.PgColumn<{
            name: "preferredLocale";
            tableName: "User";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        preferredLanguage: drizzle_orm_pg_core.PgColumn<{
            name: "preferredLanguage";
            tableName: "User";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        dateOfBirth: drizzle_orm_pg_core.PgColumn<{
            name: "dateOfBirth";
            tableName: "User";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        moderationStrikes: drizzle_orm_pg_core.PgColumn<{
            name: "moderationStrikes";
            tableName: "User";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        failedLoginAttempts: drizzle_orm_pg_core.PgColumn<{
            name: "failedLoginAttempts";
            tableName: "User";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        lockedUntil: drizzle_orm_pg_core.PgColumn<{
            name: "lockedUntil";
            tableName: "User";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        stripeCustomerId: drizzle_orm_pg_core.PgColumn<{
            name: "stripeCustomerId";
            tableName: "User";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        metadata: drizzle_orm_pg_core.PgColumn<{
            name: "metadata";
            tableName: "User";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "User";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "User";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const usersRelations: drizzle_orm.Relations<"User", {
    investmentProfile: drizzle_orm.One<"InvestmentProfile", false>;
    streaks: drizzle_orm.One<"UserStreak", false>;
    virtualPortfolio: drizzle_orm.One<"VirtualPortfolio", false>;
    behaviorLogs: drizzle_orm.Many<"BehaviorLog">;
    buddyMemberships: drizzle_orm.Many<"BuddyMember">;
    chatThreads: drizzle_orm.Many<"ChatThread">;
    refreshTokens: drizzle_orm.Many<"RefreshToken">;
    commitments: drizzle_orm.Many<"SimulationCommitment">;
    simulations: drizzle_orm.Many<"SimulationScenario">;
    socialPosts: drizzle_orm.Many<"SocialPost">;
    achievements: drizzle_orm.Many<"UserAchievement">;
    checklists: drizzle_orm.Many<"UserChecklist">;
    progress: drizzle_orm.Many<"UserProgress">;
    moderationLogs: drizzle_orm.Many<"ModerationLog">;
    moderatedLogs: drizzle_orm.Many<"ModerationLog">;
    following: drizzle_orm.Many<"UserRelationship">;
    followers: drizzle_orm.Many<"UserRelationship">;
    quizAttempts: drizzle_orm.Many<"QuizAttempt">;
    certificates: drizzle_orm.Many<"Certificate">;
    transactions: drizzle_orm.Many<"Transaction">;
}>;
declare const courses: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "Course";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "Course";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        slug: drizzle_orm_pg_core.PgColumn<{
            name: "slug";
            tableName: "Course";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        title: drizzle_orm_pg_core.PgColumn<{
            name: "title";
            tableName: "Course";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        description: drizzle_orm_pg_core.PgColumn<{
            name: "description";
            tableName: "Course";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        thumbnailKey: drizzle_orm_pg_core.PgColumn<{
            name: "thumbnailKey";
            tableName: "Course";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        price: drizzle_orm_pg_core.PgColumn<{
            name: "price";
            tableName: "Course";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        level: drizzle_orm_pg_core.PgColumn<{
            name: "level";
            tableName: "Course";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["BEGINNER", "INTERMEDIATE", "EXPERT"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        published: drizzle_orm_pg_core.PgColumn<{
            name: "published";
            tableName: "Course";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "Course";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "Course";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const coursesRelations: drizzle_orm.Relations<"Course", {
    lessons: drizzle_orm.Many<"Lesson">;
    certificates: drizzle_orm.Many<"Certificate">;
    transactions: drizzle_orm.Many<"Transaction">;
}>;
declare const lessons: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "Lesson";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "Lesson";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        courseId: drizzle_orm_pg_core.PgColumn<{
            name: "courseId";
            tableName: "Lesson";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        order: drizzle_orm_pg_core.PgColumn<{
            name: "order";
            tableName: "Lesson";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        title: drizzle_orm_pg_core.PgColumn<{
            name: "title";
            tableName: "Lesson";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        content: drizzle_orm_pg_core.PgColumn<{
            name: "content";
            tableName: "Lesson";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        videoKey: drizzle_orm_pg_core.PgColumn<{
            name: "videoKey";
            tableName: "Lesson";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        type: drizzle_orm_pg_core.PgColumn<{
            name: "type";
            tableName: "Lesson";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "VIDEO" | "READING" | "QUIZ" | "INTERACTIVE";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["VIDEO", "READING", "QUIZ", "INTERACTIVE"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        duration: drizzle_orm_pg_core.PgColumn<{
            name: "duration";
            tableName: "Lesson";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        published: drizzle_orm_pg_core.PgColumn<{
            name: "published";
            tableName: "Lesson";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "Lesson";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "Lesson";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const lessonsRelations: drizzle_orm.Relations<"Lesson", {
    course: drizzle_orm.One<"Course", true>;
    progress: drizzle_orm.Many<"UserProgress">;
    quizzes: drizzle_orm.Many<"Quiz">;
}>;
declare const userProgress: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "UserProgress";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "UserProgress";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "UserProgress";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        lessonId: drizzle_orm_pg_core.PgColumn<{
            name: "lessonId";
            tableName: "UserProgress";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        status: drizzle_orm_pg_core.PgColumn<{
            name: "status";
            tableName: "UserProgress";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "STARTED" | "IN_PROGRESS" | "COMPLETED";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["STARTED", "IN_PROGRESS", "COMPLETED"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        durationSpent: drizzle_orm_pg_core.PgColumn<{
            name: "durationSpent";
            tableName: "UserProgress";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        progressPercentage: drizzle_orm_pg_core.PgColumn<{
            name: "progressPercentage";
            tableName: "UserProgress";
            dataType: "number";
            columnType: "PgReal";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        completedAt: drizzle_orm_pg_core.PgColumn<{
            name: "completedAt";
            tableName: "UserProgress";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "UserProgress";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "UserProgress";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const userProgressRelations: drizzle_orm.Relations<"UserProgress", {
    user: drizzle_orm.One<"User", true>;
    lesson: drizzle_orm.One<"Lesson", true>;
}>;
declare const chatThreads: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "ChatThread";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "ChatThread";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "ChatThread";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        title: drizzle_orm_pg_core.PgColumn<{
            name: "title";
            tableName: "ChatThread";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        module: drizzle_orm_pg_core.PgColumn<{
            name: "module";
            tableName: "ChatThread";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "ChatThread";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "ChatThread";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const chatThreadsRelations: drizzle_orm.Relations<"ChatThread", {
    user: drizzle_orm.One<"User", true>;
    messages: drizzle_orm.Many<"ChatMessage">;
}>;
declare const chatMessages: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "ChatMessage";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "ChatMessage";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        threadId: drizzle_orm_pg_core.PgColumn<{
            name: "threadId";
            tableName: "ChatMessage";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        role: drizzle_orm_pg_core.PgColumn<{
            name: "role";
            tableName: "ChatMessage";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "USER" | "ASSISTANT" | "SYSTEM";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["USER", "ASSISTANT", "SYSTEM"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        content: drizzle_orm_pg_core.PgColumn<{
            name: "content";
            tableName: "ChatMessage";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        metadata: drizzle_orm_pg_core.PgColumn<{
            name: "metadata";
            tableName: "ChatMessage";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "ChatMessage";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const chatMessagesRelations: drizzle_orm.Relations<"ChatMessage", {
    thread: drizzle_orm.One<"ChatThread", true>;
}>;
declare const behaviorLogs: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "BehaviorLog";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "BehaviorLog";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "BehaviorLog";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        sessionId: drizzle_orm_pg_core.PgColumn<{
            name: "sessionId";
            tableName: "BehaviorLog";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        path: drizzle_orm_pg_core.PgColumn<{
            name: "path";
            tableName: "BehaviorLog";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        eventType: drizzle_orm_pg_core.PgColumn<{
            name: "eventType";
            tableName: "BehaviorLog";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        actionCategory: drizzle_orm_pg_core.PgColumn<{
            name: "actionCategory";
            tableName: "BehaviorLog";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        duration: drizzle_orm_pg_core.PgColumn<{
            name: "duration";
            tableName: "BehaviorLog";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        deviceInfo: drizzle_orm_pg_core.PgColumn<{
            name: "deviceInfo";
            tableName: "BehaviorLog";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        payload: drizzle_orm_pg_core.PgColumn<{
            name: "payload";
            tableName: "BehaviorLog";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        timestamp: drizzle_orm_pg_core.PgColumn<{
            name: "timestamp";
            tableName: "BehaviorLog";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const behaviorLogsRelations: drizzle_orm.Relations<"BehaviorLog", {
    user: drizzle_orm.One<"User", false>;
}>;
declare const investmentProfiles: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "InvestmentProfile";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "InvestmentProfile";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "InvestmentProfile";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        riskScore: drizzle_orm_pg_core.PgColumn<{
            name: "riskScore";
            tableName: "InvestmentProfile";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        investmentPhilosophy: drizzle_orm_pg_core.PgColumn<{
            name: "investmentPhilosophy";
            tableName: "InvestmentProfile";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        financialGoals: drizzle_orm_pg_core.PgColumn<{
            name: "financialGoals";
            tableName: "InvestmentProfile";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        currentKnowledge: drizzle_orm_pg_core.PgColumn<{
            name: "currentKnowledge";
            tableName: "InvestmentProfile";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["BEGINNER", "INTERMEDIATE", "EXPERT"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "InvestmentProfile";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "InvestmentProfile";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const investmentProfilesRelations: drizzle_orm.Relations<"InvestmentProfile", {
    user: drizzle_orm.One<"User", true>;
}>;
declare const virtualPortfolios: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "VirtualPortfolio";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "VirtualPortfolio";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "VirtualPortfolio";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        balance: drizzle_orm_pg_core.PgColumn<{
            name: "balance";
            tableName: "VirtualPortfolio";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        holdings: drizzle_orm_pg_core.PgColumn<{
            name: "holdings";
            tableName: "VirtualPortfolio";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        transactions: drizzle_orm_pg_core.PgColumn<{
            name: "transactions";
            tableName: "VirtualPortfolio";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "VirtualPortfolio";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "VirtualPortfolio";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const virtualPortfoliosRelations: drizzle_orm.Relations<"VirtualPortfolio", {
    user: drizzle_orm.One<"User", true>;
}>;
declare const userStreaks: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "UserStreak";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "UserStreak";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "UserStreak";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        currentStreak: drizzle_orm_pg_core.PgColumn<{
            name: "currentStreak";
            tableName: "UserStreak";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        longestStreak: drizzle_orm_pg_core.PgColumn<{
            name: "longestStreak";
            tableName: "UserStreak";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        lastActivityDate: drizzle_orm_pg_core.PgColumn<{
            name: "lastActivityDate";
            tableName: "UserStreak";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "UserStreak";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "UserStreak";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const userStreaksRelations: drizzle_orm.Relations<"UserStreak", {
    user: drizzle_orm.One<"User", true>;
}>;
declare const achievements: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "Achievement";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "Achievement";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        key: drizzle_orm_pg_core.PgColumn<{
            name: "key";
            tableName: "Achievement";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        name: drizzle_orm_pg_core.PgColumn<{
            name: "name";
            tableName: "Achievement";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        description: drizzle_orm_pg_core.PgColumn<{
            name: "description";
            tableName: "Achievement";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        iconKey: drizzle_orm_pg_core.PgColumn<{
            name: "iconKey";
            tableName: "Achievement";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        criteria: drizzle_orm_pg_core.PgColumn<{
            name: "criteria";
            tableName: "Achievement";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        points: drizzle_orm_pg_core.PgColumn<{
            name: "points";
            tableName: "Achievement";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        tier: drizzle_orm_pg_core.PgColumn<{
            name: "tier";
            tableName: "Achievement";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        category: drizzle_orm_pg_core.PgColumn<{
            name: "category";
            tableName: "Achievement";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        isActive: drizzle_orm_pg_core.PgColumn<{
            name: "isActive";
            tableName: "Achievement";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "Achievement";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "Achievement";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const userAchievements: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "UserAchievement";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "UserAchievement";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "UserAchievement";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        achievementId: drizzle_orm_pg_core.PgColumn<{
            name: "achievementId";
            tableName: "UserAchievement";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        progress: drizzle_orm_pg_core.PgColumn<{
            name: "progress";
            tableName: "UserAchievement";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        earnedAt: drizzle_orm_pg_core.PgColumn<{
            name: "earnedAt";
            tableName: "UserAchievement";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "UserAchievement";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const userAchievementsRelations: drizzle_orm.Relations<"UserAchievement", {
    user: drizzle_orm.One<"User", true>;
}>;
declare const buddyGroups: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "BuddyGroup";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "BuddyGroup";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        name: drizzle_orm_pg_core.PgColumn<{
            name: "name";
            tableName: "BuddyGroup";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        description: drizzle_orm_pg_core.PgColumn<{
            name: "description";
            tableName: "BuddyGroup";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        type: drizzle_orm_pg_core.PgColumn<{
            name: "type";
            tableName: "BuddyGroup";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "LEARNING" | "SAVING" | "INVESTING";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["LEARNING", "SAVING", "INVESTING"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        totalPoints: drizzle_orm_pg_core.PgColumn<{
            name: "totalPoints";
            tableName: "BuddyGroup";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        streak: drizzle_orm_pg_core.PgColumn<{
            name: "streak";
            tableName: "BuddyGroup";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "BuddyGroup";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "BuddyGroup";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const buddyGroupsRelations: drizzle_orm.Relations<"BuddyGroup", {
    members: drizzle_orm.Many<"BuddyMember">;
    challenges: drizzle_orm.Many<"BuddyChallenge">;
    feedPosts: drizzle_orm.Many<"SocialPost">;
}>;
declare const buddyMembers: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "BuddyMember";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "BuddyMember";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        groupId: drizzle_orm_pg_core.PgColumn<{
            name: "groupId";
            tableName: "BuddyMember";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "BuddyMember";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        role: drizzle_orm_pg_core.PgColumn<{
            name: "role";
            tableName: "BuddyMember";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "LEADER" | "MEMBER";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["LEADER", "MEMBER"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        joinedAt: drizzle_orm_pg_core.PgColumn<{
            name: "joinedAt";
            tableName: "BuddyMember";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const buddyMembersRelations: drizzle_orm.Relations<"BuddyMember", {
    group: drizzle_orm.One<"BuddyGroup", true>;
    user: drizzle_orm.One<"User", true>;
}>;
declare const buddyChallenges: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "BuddyChallenge";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "BuddyChallenge";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        groupId: drizzle_orm_pg_core.PgColumn<{
            name: "groupId";
            tableName: "BuddyChallenge";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        title: drizzle_orm_pg_core.PgColumn<{
            name: "title";
            tableName: "BuddyChallenge";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        target: drizzle_orm_pg_core.PgColumn<{
            name: "target";
            tableName: "BuddyChallenge";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        rewardPoints: drizzle_orm_pg_core.PgColumn<{
            name: "rewardPoints";
            tableName: "BuddyChallenge";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        expiresAt: drizzle_orm_pg_core.PgColumn<{
            name: "expiresAt";
            tableName: "BuddyChallenge";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const buddyChallengesRelations: drizzle_orm.Relations<"BuddyChallenge", {
    group: drizzle_orm.One<"BuddyGroup", true>;
}>;
declare const socialPosts: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "SocialPost";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "SocialPost";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "SocialPost";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        groupId: drizzle_orm_pg_core.PgColumn<{
            name: "groupId";
            tableName: "SocialPost";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        type: drizzle_orm_pg_core.PgColumn<{
            name: "type";
            tableName: "SocialPost";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "ACHIEVEMENT" | "MILESTONE" | "NUDGE" | "DISCUSSION";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["ACHIEVEMENT", "MILESTONE", "NUDGE", "DISCUSSION"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        content: drizzle_orm_pg_core.PgColumn<{
            name: "content";
            tableName: "SocialPost";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        likesCount: drizzle_orm_pg_core.PgColumn<{
            name: "likesCount";
            tableName: "SocialPost";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "SocialPost";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const socialPostsRelations: drizzle_orm.Relations<"SocialPost", {
    user: drizzle_orm.One<"User", true>;
    group: drizzle_orm.One<"BuddyGroup", false>;
}>;
declare const userRelationships: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "UserRelationship";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "UserRelationship";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        followerId: drizzle_orm_pg_core.PgColumn<{
            name: "followerId";
            tableName: "UserRelationship";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        followedId: drizzle_orm_pg_core.PgColumn<{
            name: "followedId";
            tableName: "UserRelationship";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        status: drizzle_orm_pg_core.PgColumn<{
            name: "status";
            tableName: "UserRelationship";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "FOLLOWING" | "FRIEND_REQUESTED" | "FRIENDS" | "BLOCKED";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["FOLLOWING", "FRIEND_REQUESTED", "FRIENDS", "BLOCKED"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "UserRelationship";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "UserRelationship";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const userRelationshipsRelations: drizzle_orm.Relations<"UserRelationship", {
    follower: drizzle_orm.One<"User", true>;
    followed: drizzle_orm.One<"User", true>;
}>;
declare const simulationScenarios: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "SimulationScenario";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "SimulationScenario";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "SimulationScenario";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        title: drizzle_orm_pg_core.PgColumn<{
            name: "title";
            tableName: "SimulationScenario";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        scenarioData: drizzle_orm_pg_core.PgColumn<{
            name: "scenarioData";
            tableName: "SimulationScenario";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        result: drizzle_orm_pg_core.PgColumn<{
            name: "result";
            tableName: "SimulationScenario";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "SimulationScenario";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const simulationScenariosRelations: drizzle_orm.Relations<"SimulationScenario", {
    user: drizzle_orm.One<"User", true>;
    commitments: drizzle_orm.Many<"SimulationCommitment">;
}>;
declare const simulationCommitments: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "SimulationCommitment";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "SimulationCommitment";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "SimulationCommitment";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        scenarioId: drizzle_orm_pg_core.PgColumn<{
            name: "scenarioId";
            tableName: "SimulationCommitment";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        commitment: drizzle_orm_pg_core.PgColumn<{
            name: "commitment";
            tableName: "SimulationCommitment";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        isCompleted: drizzle_orm_pg_core.PgColumn<{
            name: "isCompleted";
            tableName: "SimulationCommitment";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "SimulationCommitment";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const simulationCommitmentsRelations: drizzle_orm.Relations<"SimulationCommitment", {
    user: drizzle_orm.One<"User", true>;
    scenario: drizzle_orm.One<"SimulationScenario", true>;
}>;
declare const moderationLogs: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "ModerationLog";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "ModerationLog";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "ModerationLog";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        action: drizzle_orm_pg_core.PgColumn<{
            name: "action";
            tableName: "ModerationLog";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        reason: drizzle_orm_pg_core.PgColumn<{
            name: "reason";
            tableName: "ModerationLog";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        moderatorId: drizzle_orm_pg_core.PgColumn<{
            name: "moderatorId";
            tableName: "ModerationLog";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        severity: drizzle_orm_pg_core.PgColumn<{
            name: "severity";
            tableName: "ModerationLog";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        metadata: drizzle_orm_pg_core.PgColumn<{
            name: "metadata";
            tableName: "ModerationLog";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "ModerationLog";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const moderationLogsRelations: drizzle_orm.Relations<"ModerationLog", {
    user: drizzle_orm.One<"User", true>;
    moderator: drizzle_orm.One<"User", false>;
}>;
declare const quizzes: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "Quiz";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "Quiz";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        lessonId: drizzle_orm_pg_core.PgColumn<{
            name: "lessonId";
            tableName: "Quiz";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        title: drizzle_orm_pg_core.PgColumn<{
            name: "title";
            tableName: "Quiz";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        description: drizzle_orm_pg_core.PgColumn<{
            name: "description";
            tableName: "Quiz";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        published: drizzle_orm_pg_core.PgColumn<{
            name: "published";
            tableName: "Quiz";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "Quiz";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "Quiz";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const quizzesRelations: drizzle_orm.Relations<"Quiz", {
    lesson: drizzle_orm.One<"Lesson", true>;
    questions: drizzle_orm.Many<"QuizQuestion">;
    attempts: drizzle_orm.Many<"QuizAttempt">;
}>;
declare const quizQuestions: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "QuizQuestion";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "QuizQuestion";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        quizId: drizzle_orm_pg_core.PgColumn<{
            name: "quizId";
            tableName: "QuizQuestion";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        type: drizzle_orm_pg_core.PgColumn<{
            name: "type";
            tableName: "QuizQuestion";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "MATCHING";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "MATCHING"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        question: drizzle_orm_pg_core.PgColumn<{
            name: "question";
            tableName: "QuizQuestion";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        options: drizzle_orm_pg_core.PgColumn<{
            name: "options";
            tableName: "QuizQuestion";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        correctAnswer: drizzle_orm_pg_core.PgColumn<{
            name: "correctAnswer";
            tableName: "QuizQuestion";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        points: drizzle_orm_pg_core.PgColumn<{
            name: "points";
            tableName: "QuizQuestion";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        order: drizzle_orm_pg_core.PgColumn<{
            name: "order";
            tableName: "QuizQuestion";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        explanation: drizzle_orm_pg_core.PgColumn<{
            name: "explanation";
            tableName: "QuizQuestion";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const quizQuestionsRelations: drizzle_orm.Relations<"QuizQuestion", {
    quiz: drizzle_orm.One<"Quiz", true>;
}>;
declare const quizAttempts: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "QuizAttempt";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "QuizAttempt";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "QuizAttempt";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        quizId: drizzle_orm_pg_core.PgColumn<{
            name: "quizId";
            tableName: "QuizAttempt";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        answers: drizzle_orm_pg_core.PgColumn<{
            name: "answers";
            tableName: "QuizAttempt";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        score: drizzle_orm_pg_core.PgColumn<{
            name: "score";
            tableName: "QuizAttempt";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        percentage: drizzle_orm_pg_core.PgColumn<{
            name: "percentage";
            tableName: "QuizAttempt";
            dataType: "number";
            columnType: "PgReal";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        startedAt: drizzle_orm_pg_core.PgColumn<{
            name: "startedAt";
            tableName: "QuizAttempt";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        completedAt: drizzle_orm_pg_core.PgColumn<{
            name: "completedAt";
            tableName: "QuizAttempt";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const quizAttemptsRelations: drizzle_orm.Relations<"QuizAttempt", {
    user: drizzle_orm.One<"User", true>;
    quiz: drizzle_orm.One<"Quiz", true>;
}>;
declare const certificates: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "Certificate";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "Certificate";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "Certificate";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        courseId: drizzle_orm_pg_core.PgColumn<{
            name: "courseId";
            tableName: "Certificate";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        studentName: drizzle_orm_pg_core.PgColumn<{
            name: "studentName";
            tableName: "Certificate";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        courseTitle: drizzle_orm_pg_core.PgColumn<{
            name: "courseTitle";
            tableName: "Certificate";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        completedAt: drizzle_orm_pg_core.PgColumn<{
            name: "completedAt";
            tableName: "Certificate";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        pdfUrl: drizzle_orm_pg_core.PgColumn<{
            name: "pdfUrl";
            tableName: "Certificate";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        metadata: drizzle_orm_pg_core.PgColumn<{
            name: "metadata";
            tableName: "Certificate";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "Certificate";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const certificatesRelations: drizzle_orm.Relations<"Certificate", {
    user: drizzle_orm.One<"User", true>;
    course: drizzle_orm.One<"Course", true>;
}>;
declare const transactions: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "Transaction";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "Transaction";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "Transaction";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        courseId: drizzle_orm_pg_core.PgColumn<{
            name: "courseId";
            tableName: "Transaction";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        amount: drizzle_orm_pg_core.PgColumn<{
            name: "amount";
            tableName: "Transaction";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        currency: drizzle_orm_pg_core.PgColumn<{
            name: "currency";
            tableName: "Transaction";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        status: drizzle_orm_pg_core.PgColumn<{
            name: "status";
            tableName: "Transaction";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "COMPLETED" | "PENDING" | "PROCESSING" | "FAILED" | "REFUNDED" | "CANCELLED";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        type: drizzle_orm_pg_core.PgColumn<{
            name: "type";
            tableName: "Transaction";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "COURSE_PURCHASE" | "SUBSCRIPTION" | "CREDITS" | "DONATION";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["COURSE_PURCHASE", "SUBSCRIPTION", "CREDITS", "DONATION"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        stripeSessionId: drizzle_orm_pg_core.PgColumn<{
            name: "stripeSessionId";
            tableName: "Transaction";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        stripePaymentIntentId: drizzle_orm_pg_core.PgColumn<{
            name: "stripePaymentIntentId";
            tableName: "Transaction";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        metadata: drizzle_orm_pg_core.PgColumn<{
            name: "metadata";
            tableName: "Transaction";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "Transaction";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "Transaction";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        completedAt: drizzle_orm_pg_core.PgColumn<{
            name: "completedAt";
            tableName: "Transaction";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        failedAt: drizzle_orm_pg_core.PgColumn<{
            name: "failedAt";
            tableName: "Transaction";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        refundedAt: drizzle_orm_pg_core.PgColumn<{
            name: "refundedAt";
            tableName: "Transaction";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const transactionsRelations: drizzle_orm.Relations<"Transaction", {
    user: drizzle_orm.One<"User", true>;
    course: drizzle_orm.One<"Course", false>;
}>;
declare const userChecklists: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "UserChecklist";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "UserChecklist";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "UserChecklist";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        title: drizzle_orm_pg_core.PgColumn<{
            name: "title";
            tableName: "UserChecklist";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        category: drizzle_orm_pg_core.PgColumn<{
            name: "category";
            tableName: "UserChecklist";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        items: drizzle_orm_pg_core.PgColumn<{
            name: "items";
            tableName: "UserChecklist";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        progress: drizzle_orm_pg_core.PgColumn<{
            name: "progress";
            tableName: "UserChecklist";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "UserChecklist";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: drizzle_orm_pg_core.PgColumn<{
            name: "updatedAt";
            tableName: "UserChecklist";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const userChecklistsRelations: drizzle_orm.Relations<"UserChecklist", {
    user: drizzle_orm.One<"User", true>;
}>;
declare const refreshTokens: drizzle_orm_pg_core.PgTableWithColumns<{
    name: "RefreshToken";
    schema: undefined;
    columns: {
        id: drizzle_orm_pg_core.PgColumn<{
            name: "id";
            tableName: "RefreshToken";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: drizzle_orm_pg_core.PgColumn<{
            name: "userId";
            tableName: "RefreshToken";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        token: drizzle_orm_pg_core.PgColumn<{
            name: "token";
            tableName: "RefreshToken";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        expiresAt: drizzle_orm_pg_core.PgColumn<{
            name: "expiresAt";
            tableName: "RefreshToken";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: drizzle_orm_pg_core.PgColumn<{
            name: "createdAt";
            tableName: "RefreshToken";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
declare const refreshTokensRelations: drizzle_orm.Relations<"RefreshToken", {
    user: drizzle_orm.One<"User", true>;
}>;

declare const ______drizzle_schema_achievements: typeof achievements;
declare const ______drizzle_schema_behaviorLogs: typeof behaviorLogs;
declare const ______drizzle_schema_behaviorLogsRelations: typeof behaviorLogsRelations;
declare const ______drizzle_schema_buddyChallenges: typeof buddyChallenges;
declare const ______drizzle_schema_buddyChallengesRelations: typeof buddyChallengesRelations;
declare const ______drizzle_schema_buddyGroupTypeEnum: typeof buddyGroupTypeEnum;
declare const ______drizzle_schema_buddyGroups: typeof buddyGroups;
declare const ______drizzle_schema_buddyGroupsRelations: typeof buddyGroupsRelations;
declare const ______drizzle_schema_buddyMembers: typeof buddyMembers;
declare const ______drizzle_schema_buddyMembersRelations: typeof buddyMembersRelations;
declare const ______drizzle_schema_buddyRoleEnum: typeof buddyRoleEnum;
declare const ______drizzle_schema_certificates: typeof certificates;
declare const ______drizzle_schema_certificatesRelations: typeof certificatesRelations;
declare const ______drizzle_schema_chatMessages: typeof chatMessages;
declare const ______drizzle_schema_chatMessagesRelations: typeof chatMessagesRelations;
declare const ______drizzle_schema_chatRoleEnum: typeof chatRoleEnum;
declare const ______drizzle_schema_chatThreads: typeof chatThreads;
declare const ______drizzle_schema_chatThreadsRelations: typeof chatThreadsRelations;
declare const ______drizzle_schema_courses: typeof courses;
declare const ______drizzle_schema_coursesRelations: typeof coursesRelations;
declare const ______drizzle_schema_investmentProfiles: typeof investmentProfiles;
declare const ______drizzle_schema_investmentProfilesRelations: typeof investmentProfilesRelations;
declare const ______drizzle_schema_lessonTypeEnum: typeof lessonTypeEnum;
declare const ______drizzle_schema_lessons: typeof lessons;
declare const ______drizzle_schema_lessonsRelations: typeof lessonsRelations;
declare const ______drizzle_schema_levelEnum: typeof levelEnum;
declare const ______drizzle_schema_moderationLogs: typeof moderationLogs;
declare const ______drizzle_schema_moderationLogsRelations: typeof moderationLogsRelations;
declare const ______drizzle_schema_postTypeEnum: typeof postTypeEnum;
declare const ______drizzle_schema_progressStatusEnum: typeof progressStatusEnum;
declare const ______drizzle_schema_questionTypeEnum: typeof questionTypeEnum;
declare const ______drizzle_schema_quizAttempts: typeof quizAttempts;
declare const ______drizzle_schema_quizAttemptsRelations: typeof quizAttemptsRelations;
declare const ______drizzle_schema_quizQuestions: typeof quizQuestions;
declare const ______drizzle_schema_quizQuestionsRelations: typeof quizQuestionsRelations;
declare const ______drizzle_schema_quizzes: typeof quizzes;
declare const ______drizzle_schema_quizzesRelations: typeof quizzesRelations;
declare const ______drizzle_schema_refreshTokens: typeof refreshTokens;
declare const ______drizzle_schema_refreshTokensRelations: typeof refreshTokensRelations;
declare const ______drizzle_schema_relationStatusEnum: typeof relationStatusEnum;
declare const ______drizzle_schema_roleEnum: typeof roleEnum;
declare const ______drizzle_schema_simulationCommitments: typeof simulationCommitments;
declare const ______drizzle_schema_simulationCommitmentsRelations: typeof simulationCommitmentsRelations;
declare const ______drizzle_schema_simulationScenarios: typeof simulationScenarios;
declare const ______drizzle_schema_simulationScenariosRelations: typeof simulationScenariosRelations;
declare const ______drizzle_schema_socialPosts: typeof socialPosts;
declare const ______drizzle_schema_socialPostsRelations: typeof socialPostsRelations;
declare const ______drizzle_schema_transactionStatusEnum: typeof transactionStatusEnum;
declare const ______drizzle_schema_transactionTypeEnum: typeof transactionTypeEnum;
declare const ______drizzle_schema_transactions: typeof transactions;
declare const ______drizzle_schema_transactionsRelations: typeof transactionsRelations;
declare const ______drizzle_schema_userAchievements: typeof userAchievements;
declare const ______drizzle_schema_userAchievementsRelations: typeof userAchievementsRelations;
declare const ______drizzle_schema_userChecklists: typeof userChecklists;
declare const ______drizzle_schema_userChecklistsRelations: typeof userChecklistsRelations;
declare const ______drizzle_schema_userProgress: typeof userProgress;
declare const ______drizzle_schema_userProgressRelations: typeof userProgressRelations;
declare const ______drizzle_schema_userRelationships: typeof userRelationships;
declare const ______drizzle_schema_userRelationshipsRelations: typeof userRelationshipsRelations;
declare const ______drizzle_schema_userStreaks: typeof userStreaks;
declare const ______drizzle_schema_userStreaksRelations: typeof userStreaksRelations;
declare const ______drizzle_schema_users: typeof users;
declare const ______drizzle_schema_usersRelations: typeof usersRelations;
declare const ______drizzle_schema_virtualPortfolios: typeof virtualPortfolios;
declare const ______drizzle_schema_virtualPortfoliosRelations: typeof virtualPortfoliosRelations;
declare namespace ______drizzle_schema {
  export { ______drizzle_schema_achievements as achievements, ______drizzle_schema_behaviorLogs as behaviorLogs, ______drizzle_schema_behaviorLogsRelations as behaviorLogsRelations, ______drizzle_schema_buddyChallenges as buddyChallenges, ______drizzle_schema_buddyChallengesRelations as buddyChallengesRelations, ______drizzle_schema_buddyGroupTypeEnum as buddyGroupTypeEnum, ______drizzle_schema_buddyGroups as buddyGroups, ______drizzle_schema_buddyGroupsRelations as buddyGroupsRelations, ______drizzle_schema_buddyMembers as buddyMembers, ______drizzle_schema_buddyMembersRelations as buddyMembersRelations, ______drizzle_schema_buddyRoleEnum as buddyRoleEnum, ______drizzle_schema_certificates as certificates, ______drizzle_schema_certificatesRelations as certificatesRelations, ______drizzle_schema_chatMessages as chatMessages, ______drizzle_schema_chatMessagesRelations as chatMessagesRelations, ______drizzle_schema_chatRoleEnum as chatRoleEnum, ______drizzle_schema_chatThreads as chatThreads, ______drizzle_schema_chatThreadsRelations as chatThreadsRelations, ______drizzle_schema_courses as courses, ______drizzle_schema_coursesRelations as coursesRelations, ______drizzle_schema_investmentProfiles as investmentProfiles, ______drizzle_schema_investmentProfilesRelations as investmentProfilesRelations, ______drizzle_schema_lessonTypeEnum as lessonTypeEnum, ______drizzle_schema_lessons as lessons, ______drizzle_schema_lessonsRelations as lessonsRelations, ______drizzle_schema_levelEnum as levelEnum, ______drizzle_schema_moderationLogs as moderationLogs, ______drizzle_schema_moderationLogsRelations as moderationLogsRelations, ______drizzle_schema_postTypeEnum as postTypeEnum, ______drizzle_schema_progressStatusEnum as progressStatusEnum, ______drizzle_schema_questionTypeEnum as questionTypeEnum, ______drizzle_schema_quizAttempts as quizAttempts, ______drizzle_schema_quizAttemptsRelations as quizAttemptsRelations, ______drizzle_schema_quizQuestions as quizQuestions, ______drizzle_schema_quizQuestionsRelations as quizQuestionsRelations, ______drizzle_schema_quizzes as quizzes, ______drizzle_schema_quizzesRelations as quizzesRelations, ______drizzle_schema_refreshTokens as refreshTokens, ______drizzle_schema_refreshTokensRelations as refreshTokensRelations, ______drizzle_schema_relationStatusEnum as relationStatusEnum, ______drizzle_schema_roleEnum as roleEnum, ______drizzle_schema_simulationCommitments as simulationCommitments, ______drizzle_schema_simulationCommitmentsRelations as simulationCommitmentsRelations, ______drizzle_schema_simulationScenarios as simulationScenarios, ______drizzle_schema_simulationScenariosRelations as simulationScenariosRelations, ______drizzle_schema_socialPosts as socialPosts, ______drizzle_schema_socialPostsRelations as socialPostsRelations, ______drizzle_schema_transactionStatusEnum as transactionStatusEnum, ______drizzle_schema_transactionTypeEnum as transactionTypeEnum, ______drizzle_schema_transactions as transactions, ______drizzle_schema_transactionsRelations as transactionsRelations, ______drizzle_schema_userAchievements as userAchievements, ______drizzle_schema_userAchievementsRelations as userAchievementsRelations, ______drizzle_schema_userChecklists as userChecklists, ______drizzle_schema_userChecklistsRelations as userChecklistsRelations, ______drizzle_schema_userProgress as userProgress, ______drizzle_schema_userProgressRelations as userProgressRelations, ______drizzle_schema_userRelationships as userRelationships, ______drizzle_schema_userRelationshipsRelations as userRelationshipsRelations, ______drizzle_schema_userStreaks as userStreaks, ______drizzle_schema_userStreaksRelations as userStreaksRelations, ______drizzle_schema_users as users, ______drizzle_schema_usersRelations as usersRelations, ______drizzle_schema_virtualPortfolios as virtualPortfolios, ______drizzle_schema_virtualPortfoliosRelations as virtualPortfoliosRelations };
}

declare const appRouter: _trpc_server.TRPCBuiltRouter<{
    ctx: {
        db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
            $client: postgres.Sql<{}>;
        };
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined | undefined;
            userAgent?: string | null | undefined | undefined;
        } | null;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined | undefined;
        } | null;
        req: Request;
    };
    meta: object;
    errorShape: {
        data: {
            zodError: string | null;
            code: _trpc_server.TRPC_ERROR_CODE_KEY;
            httpStatus: number;
            path?: string;
            stack?: string;
        };
        message: string;
        code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
    };
    transformer: true;
}, _trpc_server.TRPCDecorateCreateRouterOptions<{
    user: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        me: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                role: "STUDENT" | "TEACHER" | "ADMIN";
                id: string;
                name: unknown;
                email: string;
                passwordHash: string;
                points: number;
                preferredLocale: string;
                preferredLanguage: string | null;
                dateOfBirth: Date | null;
                moderationStrikes: number;
                failedLoginAttempts: number;
                lockedUntil: Date | null;
                stripeCustomerId: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            } | undefined;
            meta: object;
        }>;
        getById: _trpc_server.TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                role: "STUDENT" | "TEACHER" | "ADMIN";
                id: string;
                name: unknown;
                points: number;
                createdAt: Date;
            } | undefined;
            meta: object;
        }>;
        updateProfile: _trpc_server.TRPCMutationProcedure<{
            input: {
                name?: Record<string, string> | undefined;
                preferredLocale?: "vi" | "en" | "zh" | undefined;
            };
            output: {
                id: string;
                email: string;
                passwordHash: string;
                name: unknown;
                role: "STUDENT" | "TEACHER" | "ADMIN";
                points: number;
                preferredLocale: string;
                preferredLanguage: string | null;
                dateOfBirth: Date | null;
                moderationStrikes: number;
                failedLoginAttempts: number;
                lockedUntil: Date | null;
                stripeCustomerId: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
    }>>;
    course: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        list: _trpc_server.TRPCQueryProcedure<{
            input: {
                level?: "BEGINNER" | "INTERMEDIATE" | "EXPERT" | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: unknown;
                title: unknown;
                slug: string;
                thumbnailKey: string;
                price: number;
                published: boolean;
            }[];
            meta: object;
        }>;
        getBySlug: _trpc_server.TRPCQueryProcedure<{
            input: {
                slug: string;
            };
            output: {
                level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: unknown;
                title: unknown;
                slug: string;
                thumbnailKey: string;
                price: number;
                published: boolean;
                lessons: {
                    duration: number | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "VIDEO" | "READING" | "QUIZ" | "INTERACTIVE";
                    title: unknown;
                    content: unknown;
                    courseId: string;
                    published: boolean;
                    order: number;
                    videoKey: unknown;
                }[];
            } | undefined;
            meta: object;
        }>;
        getProgress: _trpc_server.TRPCQueryProcedure<{
            input: {
                courseId: string;
            };
            output: {
                status: "STARTED" | "IN_PROGRESS" | "COMPLETED";
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                lessonId: string;
                durationSpent: number;
                progressPercentage: number | null;
                completedAt: Date | null;
                lesson: {
                    duration: number | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "VIDEO" | "READING" | "QUIZ" | "INTERACTIVE";
                    title: unknown;
                    content: unknown;
                    courseId: string;
                    published: boolean;
                    order: number;
                    videoKey: unknown;
                };
            }[];
            meta: object;
        }>;
        updateProgress: _trpc_server.TRPCMutationProcedure<{
            input: {
                lessonId: string;
                status: "STARTED" | "IN_PROGRESS" | "COMPLETED";
                durationSpent?: number | undefined;
            };
            output: {
                status: "STARTED" | "IN_PROGRESS" | "COMPLETED";
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                lessonId: string;
                durationSpent: number;
                progressPercentage: number | null;
                completedAt: Date | null;
            };
            meta: object;
        }>;
    }>>;
    quiz: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        getById: _trpc_server.TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: unknown;
                title: unknown;
                lessonId: string;
                published: boolean;
                questions: {
                    id: string;
                    points: number;
                    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "MATCHING";
                    order: number;
                    quizId: string;
                    question: unknown;
                    options: unknown;
                    correctAnswer: unknown;
                    explanation: unknown;
                }[];
            } | undefined;
            meta: object;
        }>;
        getByLesson: _trpc_server.TRPCQueryProcedure<{
            input: {
                lessonId: string;
            };
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: unknown;
                title: unknown;
                lessonId: string;
                published: boolean;
            }[];
            meta: object;
        }>;
        submit: _trpc_server.TRPCMutationProcedure<{
            input: {
                quizId: string;
                answers: Record<string, unknown>;
            };
            output: {
                id: string;
                userId: string;
                completedAt: Date | null;
                quizId: string;
                answers: unknown;
                score: number;
                percentage: number;
                startedAt: Date;
            };
            meta: object;
        }>;
        getAttempts: _trpc_server.TRPCQueryProcedure<{
            input: {
                quizId: string;
            };
            output: {
                id: string;
                userId: string;
                completedAt: Date | null;
                quizId: string;
                answers: unknown;
                score: number;
                percentage: number;
                startedAt: Date;
            }[];
            meta: object;
        }>;
    }>>;
    gamification: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        leaderboard: _trpc_server.TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                period?: "all" | "weekly" | "monthly" | undefined;
            };
            output: {
                role: "STUDENT" | "TEACHER" | "ADMIN";
                id: string;
                name: unknown;
                points: number;
            }[];
            meta: object;
        }>;
        getStreak: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                currentStreak: number;
                longestStreak: number;
                lastActivityDate: Date | null;
            } | {
                currentStreak: number;
                longestStreak: number;
                lastActivityDate: null;
            };
            meta: object;
        }>;
        updateStreak: _trpc_server.TRPCMutationProcedure<{
            input: void;
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                currentStreak: number;
                longestStreak: number;
                lastActivityDate: Date | null;
            };
            meta: object;
        }>;
        getAchievements: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                createdAt: Date;
                userId: string;
                achievementId: string;
                progress: number;
                earnedAt: Date | null;
            }[];
            meta: object;
        }>;
        addPoints: _trpc_server.TRPCMutationProcedure<{
            input: {
                points: number;
                reason?: string | undefined;
            };
            output: {
                id: string;
                email: string;
                passwordHash: string;
                name: unknown;
                role: "STUDENT" | "TEACHER" | "ADMIN";
                points: number;
                preferredLocale: string;
                preferredLanguage: string | null;
                dateOfBirth: Date | null;
                moderationStrikes: number;
                failedLoginAttempts: number;
                lockedUntil: Date | null;
                stripeCustomerId: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
    }>>;
    certificate: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        list: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                metadata: unknown;
                createdAt: Date;
                userId: string;
                courseId: string;
                completedAt: Date;
                studentName: unknown;
                courseTitle: unknown;
                pdfUrl: string | null;
                course: {
                    level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: unknown;
                    title: unknown;
                    slug: string;
                    thumbnailKey: string;
                    price: number;
                    published: boolean;
                };
            }[];
            meta: object;
        }>;
        getById: _trpc_server.TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                metadata: unknown;
                createdAt: Date;
                userId: string;
                courseId: string;
                completedAt: Date;
                studentName: unknown;
                courseTitle: unknown;
                pdfUrl: string | null;
                course: {
                    level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: unknown;
                    title: unknown;
                    slug: string;
                    thumbnailKey: string;
                    price: number;
                    published: boolean;
                };
            } | undefined;
            meta: object;
        }>;
        checkEligibility: _trpc_server.TRPCQueryProcedure<{
            input: {
                courseId: string;
            };
            output: {
                eligible: boolean;
                reason: string;
                certificate?: undefined;
                progress?: undefined;
            } | {
                eligible: boolean;
                reason: string;
                certificate: {
                    id: string;
                    metadata: unknown;
                    createdAt: Date;
                    userId: string;
                    courseId: string;
                    completedAt: Date;
                    studentName: unknown;
                    courseTitle: unknown;
                    pdfUrl: string | null;
                };
                progress?: undefined;
            } | {
                eligible: boolean;
                reason: string;
                progress: {
                    completed: number;
                    total: number;
                };
                certificate?: undefined;
            } | {
                eligible: boolean;
                reason?: undefined;
                certificate?: undefined;
                progress?: undefined;
            };
            meta: object;
        }>;
        generate: _trpc_server.TRPCMutationProcedure<{
            input: {
                courseId: string;
            };
            output: {
                id: string;
                metadata: unknown;
                createdAt: Date;
                userId: string;
                courseId: string;
                completedAt: Date;
                studentName: unknown;
                courseTitle: unknown;
                pdfUrl: string | null;
            };
            meta: object;
        }>;
    }>>;
    social: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        feed: _trpc_server.TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                id: string;
                createdAt: Date;
                userId: string;
                groupId: string | null;
                type: "ACHIEVEMENT" | "MILESTONE" | "NUDGE" | "DISCUSSION";
                content: unknown;
                likesCount: number;
                user: {
                    role: "STUDENT" | "TEACHER" | "ADMIN";
                    id: string;
                    name: unknown;
                };
            }[];
            meta: object;
        }>;
        createPost: _trpc_server.TRPCMutationProcedure<{
            input: {
                type: "ACHIEVEMENT" | "MILESTONE" | "NUDGE" | "DISCUSSION";
                content?: Record<string, unknown> | undefined;
                groupId?: string | undefined;
            };
            output: {
                id: string;
                createdAt: Date;
                userId: string;
                groupId: string | null;
                type: "ACHIEVEMENT" | "MILESTONE" | "NUDGE" | "DISCUSSION";
                content: unknown;
                likesCount: number;
            };
            meta: object;
        }>;
        myGroups: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                role: "LEADER" | "MEMBER";
                id: string;
                name: string | null;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                type: "LEARNING" | "SAVING" | "INVESTING";
                totalPoints: number;
                streak: number;
            }[];
            meta: object;
        }>;
        getGroup: _trpc_server.TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                name: string | null;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                type: "LEARNING" | "SAVING" | "INVESTING";
                totalPoints: number;
                streak: number;
                members: {
                    role: "LEADER" | "MEMBER";
                    id: string;
                    userId: string;
                    groupId: string;
                    joinedAt: Date;
                    user: {
                        role: "STUDENT" | "TEACHER" | "ADMIN";
                        id: string;
                        name: unknown;
                        points: number;
                    };
                }[];
                feedPosts: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    groupId: string | null;
                    type: "ACHIEVEMENT" | "MILESTONE" | "NUDGE" | "DISCUSSION";
                    content: unknown;
                    likesCount: number;
                }[];
            } | undefined;
            meta: object;
        }>;
        joinGroup: _trpc_server.TRPCMutationProcedure<{
            input: {
                groupId: string;
            };
            output: {
                role: "LEADER" | "MEMBER";
                id: string;
                userId: string;
                groupId: string;
                joinedAt: Date;
            };
            meta: object;
        }>;
        leaveGroup: _trpc_server.TRPCMutationProcedure<{
            input: {
                groupId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        follow: _trpc_server.TRPCMutationProcedure<{
            input: {
                userId: string;
            };
            output: {
                status: "FOLLOWING" | "FRIEND_REQUESTED" | "FRIENDS" | "BLOCKED";
                id: string;
                createdAt: Date;
                updatedAt: Date;
                followerId: string;
                followedId: string;
            };
            meta: object;
        }>;
        unfollow: _trpc_server.TRPCMutationProcedure<{
            input: {
                userId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    lesson: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        getById: _trpc_server.TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                duration: number | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                type: "VIDEO" | "READING" | "QUIZ" | "INTERACTIVE";
                title: unknown;
                content: unknown;
                courseId: string;
                published: boolean;
                order: number;
                videoKey: unknown;
                course: {
                    level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: unknown;
                    title: unknown;
                    slug: string;
                    thumbnailKey: string;
                    price: number;
                    published: boolean;
                };
            } | undefined;
            meta: object;
        }>;
        getByCourse: _trpc_server.TRPCQueryProcedure<{
            input: {
                courseId: string;
            };
            output: {
                duration: number | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                type: "VIDEO" | "READING" | "QUIZ" | "INTERACTIVE";
                title: unknown;
                content: unknown;
                courseId: string;
                published: boolean;
                order: number;
                videoKey: unknown;
            }[];
            meta: object;
        }>;
        getProgress: _trpc_server.TRPCQueryProcedure<{
            input: {
                lessonId: string;
            };
            output: {
                status: "STARTED" | "IN_PROGRESS" | "COMPLETED";
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                lessonId: string;
                durationSpent: number;
                progressPercentage: number | null;
                completedAt: Date | null;
            } | undefined;
            meta: object;
        }>;
        markComplete: _trpc_server.TRPCMutationProcedure<{
            input: {
                lessonId: string;
            };
            output: {
                status: "STARTED" | "IN_PROGRESS" | "COMPLETED";
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                lessonId: string;
                durationSpent: number;
                progressPercentage: number | null;
                completedAt: Date | null;
            };
            meta: object;
        }>;
        updateWatchTime: _trpc_server.TRPCMutationProcedure<{
            input: {
                lessonId: string;
                durationSpent: number;
                progressPercentage?: number | undefined;
            };
            output: {
                status: "STARTED" | "IN_PROGRESS" | "COMPLETED";
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                lessonId: string;
                durationSpent: number;
                progressPercentage: number | null;
                completedAt: Date | null;
            };
            meta: object;
        }>;
    }>>;
    simulation: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        listScenarios: _trpc_server.TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                id: string;
                createdAt: Date;
                userId: string;
                title: unknown;
                scenarioData: unknown;
                result: unknown;
            }[];
            meta: object;
        }>;
        getScenario: _trpc_server.TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                createdAt: Date;
                userId: string;
                title: unknown;
                scenarioData: unknown;
                result: unknown;
                commitments: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    scenarioId: string;
                    commitment: string;
                    isCompleted: boolean;
                }[];
            } | undefined;
            meta: object;
        }>;
        createCommitment: _trpc_server.TRPCMutationProcedure<{
            input: {
                scenarioId: string;
                commitment: string;
            };
            output: {
                id: string;
                createdAt: Date;
                userId: string;
                scenarioId: string;
                commitment: string;
                isCompleted: boolean;
            };
            meta: object;
        }>;
        getPortfolio: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                balance: number;
                holdings: unknown;
                transactions: unknown;
            };
            meta: object;
        }>;
        updatePortfolio: _trpc_server.TRPCMutationProcedure<{
            input: {
                balance?: number | undefined;
                holdings?: Record<PropertyKey, unknown>[] | undefined;
                transactions?: Record<PropertyKey, unknown>[] | undefined;
            };
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                balance: number;
                holdings: unknown;
                transactions: unknown;
            };
            meta: object;
        }>;
    }>>;
    ai: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        listThreads: _trpc_server.TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                title: string;
                module: string | null;
            }[];
            meta: object;
        }>;
        getThread: _trpc_server.TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                title: string;
                module: string | null;
                messages: {
                    role: "USER" | "ASSISTANT" | "SYSTEM";
                    id: string;
                    metadata: unknown;
                    createdAt: Date;
                    content: string;
                    threadId: string;
                }[];
            } | undefined;
            meta: object;
        }>;
        createThread: _trpc_server.TRPCMutationProcedure<{
            input: {
                title: string;
                module?: string | undefined;
            };
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                title: string;
                module: string | null;
            };
            meta: object;
        }>;
        sendMessage: _trpc_server.TRPCMutationProcedure<{
            input: {
                threadId: string;
                content: string;
                metadata?: Record<PropertyKey, unknown> | undefined;
            };
            output: {
                role: "USER" | "ASSISTANT" | "SYSTEM";
                id: string;
                metadata: unknown;
                createdAt: Date;
                content: string;
                threadId: string;
            };
            meta: object;
        }>;
        deleteThread: _trpc_server.TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
    payment: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        listTransactions: _trpc_server.TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                offset?: number | undefined;
                status?: "COMPLETED" | "PENDING" | "PROCESSING" | "FAILED" | "REFUNDED" | "CANCELLED" | undefined;
            };
            output: {
                status: "COMPLETED" | "PENDING" | "PROCESSING" | "FAILED" | "REFUNDED" | "CANCELLED";
                id: string;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                type: "COURSE_PURCHASE" | "SUBSCRIPTION" | "CREDITS" | "DONATION";
                courseId: string | null;
                completedAt: Date | null;
                amount: number;
                currency: string;
                stripeSessionId: string | null;
                stripePaymentIntentId: string | null;
                failedAt: Date | null;
                refundedAt: Date | null;
                course: {
                    level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: unknown;
                    title: unknown;
                    slug: string;
                    thumbnailKey: string;
                    price: number;
                    published: boolean;
                } | null;
            }[];
            meta: object;
        }>;
        getTransaction: _trpc_server.TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                status: "COMPLETED" | "PENDING" | "PROCESSING" | "FAILED" | "REFUNDED" | "CANCELLED";
                id: string;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                type: "COURSE_PURCHASE" | "SUBSCRIPTION" | "CREDITS" | "DONATION";
                courseId: string | null;
                completedAt: Date | null;
                amount: number;
                currency: string;
                stripeSessionId: string | null;
                stripePaymentIntentId: string | null;
                failedAt: Date | null;
                refundedAt: Date | null;
                course: {
                    level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: unknown;
                    title: unknown;
                    slug: string;
                    thumbnailKey: string;
                    price: number;
                    published: boolean;
                } | null;
            } | undefined;
            meta: object;
        }>;
        createCheckoutSession: _trpc_server.TRPCMutationProcedure<{
            input: {
                courseId: string;
                currency?: string | undefined;
            };
            output: {
                transactionId: string;
                sessionUrl: string;
                amount: number;
                currency: string;
            };
            meta: object;
        }>;
        getTransactionByCourse: _trpc_server.TRPCQueryProcedure<{
            input: {
                courseId: string;
            };
            output: {
                purchased: boolean;
                transaction: {
                    status: "COMPLETED" | "PENDING" | "PROCESSING" | "FAILED" | "REFUNDED" | "CANCELLED";
                    id: string;
                    metadata: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    type: "COURSE_PURCHASE" | "SUBSCRIPTION" | "CREDITS" | "DONATION";
                    courseId: string | null;
                    completedAt: Date | null;
                    amount: number;
                    currency: string;
                    stripeSessionId: string | null;
                    stripePaymentIntentId: string | null;
                    failedAt: Date | null;
                    refundedAt: Date | null;
                } | undefined;
            };
            meta: object;
        }>;
        completeTransaction: _trpc_server.TRPCMutationProcedure<{
            input: {
                transactionId: string;
                stripePaymentIntentId?: string | undefined;
            };
            output: {
                id: string;
                userId: string;
                courseId: string | null;
                amount: number;
                currency: string;
                status: "COMPLETED" | "PENDING" | "PROCESSING" | "FAILED" | "REFUNDED" | "CANCELLED";
                type: "COURSE_PURCHASE" | "SUBSCRIPTION" | "CREDITS" | "DONATION";
                stripeSessionId: string | null;
                stripePaymentIntentId: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
                completedAt: Date | null;
                failedAt: Date | null;
                refundedAt: Date | null;
            };
            meta: object;
        }>;
    }>>;
    notification: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        list: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: never[];
            meta: object;
        }>;
        markAsRead: _trpc_server.TRPCMutationProcedure<{
            input: {
                notificationId: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        markAllRead: _trpc_server.TRPCMutationProcedure<{
            input: void;
            output: {
                success: boolean;
                count: number;
            };
            meta: object;
        }>;
        getUnreadCount: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                count: number;
            };
            meta: object;
        }>;
    }>>;
    analytics: _trpc_server.TRPCBuiltRouter<{
        ctx: {
            db: drizzle_orm_postgres_js.PostgresJsDatabase<typeof ______drizzle_schema> & {
                $client: postgres.Sql<{}>;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
            } | null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            } | null;
            req: Request;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: string | null;
                code: _trpc_server.TRPC_ERROR_CODE_KEY;
                httpStatus: number;
                path?: string;
                stack?: string;
            };
            message: string;
            code: _trpc_server.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
    }, _trpc_server.TRPCDecorateCreateRouterOptions<{
        logEvent: _trpc_server.TRPCMutationProcedure<{
            input: {
                action: string;
                metadata?: Record<PropertyKey, unknown> | undefined;
                module?: string | undefined;
            };
            output: {
                timestamp: Date;
                path: string;
                duration: number | null;
                id: string;
                userId: string | null;
                sessionId: string;
                eventType: string;
                actionCategory: string | null;
                deviceInfo: unknown;
                payload: unknown;
            };
            meta: object;
        }>;
        getRecentActivity: _trpc_server.TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
            } | undefined;
            output: {
                timestamp: Date;
                path: string;
                duration: number | null;
                id: string;
                userId: string | null;
                sessionId: string;
                eventType: string;
                actionCategory: string | null;
                deviceInfo: unknown;
                payload: unknown;
            }[];
            meta: object;
        }>;
        getLearningStats: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                lessonsCompleted: number;
                totalTimeSpent: number;
                lessonsStarted: number;
            };
            meta: object;
        }>;
        getStreak: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                currentStreak: number;
                longestStreak: number;
                lastActivityDate: Date | null;
            };
            meta: object;
        }>;
    }>>;
}>>;
type AppRouter = typeof appRouter;

declare const app: Hono<hono_types.BlankEnv, hono_types.BlankSchema, "/">;

export { type AppRouter, app as default };
