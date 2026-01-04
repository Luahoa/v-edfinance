CREATE TABLE "BehaviorLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"sessionId" text NOT NULL,
	"path" text NOT NULL,
	"eventType" text NOT NULL,
	"actionCategory" text DEFAULT 'GENERAL',
	"duration" integer DEFAULT 0,
	"deviceInfo" jsonb,
	"payload" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BuddyGroup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"description" text,
	"type" text DEFAULT 'LEARNING' NOT NULL,
	"totalPoints" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BuddyMember" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" text DEFAULT 'MEMBER' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OptimizationLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"queryText" text NOT NULL,
	"recommendation" text NOT NULL,
	"performanceGain" integer,
	"confidence" integer,
	"embedding" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"appliedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "SocialPost" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"groupId" uuid,
	"type" text DEFAULT 'ACHIEVEMENT' NOT NULL,
	"content" jsonb,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserProgress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"lessonId" uuid NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"progressPercentage" integer DEFAULT 0 NOT NULL,
	"lastWatchedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" jsonb,
	"role" text DEFAULT 'USER' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"level" text DEFAULT 'BEGINNER' NOT NULL,
	"avatarKey" text,
	"locale" text DEFAULT 'vi' NOT NULL,
	"dateOfBirth" timestamp,
	"moderationStrikes" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "BehaviorLog_userId_timestamp_idx" ON "BehaviorLog" USING btree ("userId","timestamp");--> statement-breakpoint
CREATE INDEX "BehaviorLog_sessionId_idx" ON "BehaviorLog" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "BehaviorLog_sessionId_eventType_idx" ON "BehaviorLog" USING btree ("sessionId","eventType");--> statement-breakpoint
CREATE INDEX "BehaviorLog_actionCategory_idx" ON "BehaviorLog" USING btree ("actionCategory");--> statement-breakpoint
CREATE INDEX "BehaviorLog_eventType_timestamp_idx" ON "BehaviorLog" USING btree ("eventType","timestamp");--> statement-breakpoint
CREATE INDEX "BehaviorLog_eventType_userId_idx" ON "BehaviorLog" USING btree ("eventType","userId");--> statement-breakpoint
CREATE INDEX "BuddyMember_userId_idx" ON "BuddyMember" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "BuddyMember_groupId_userId_key" ON "BuddyMember" USING btree ("groupId","userId");--> statement-breakpoint
CREATE INDEX "OptimizationLog_createdAt_idx" ON "OptimizationLog" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "SocialPost_groupId_idx" ON "SocialPost" USING btree ("groupId");--> statement-breakpoint
CREATE INDEX "SocialPost_userId_idx" ON "SocialPost" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "UserProgress_userId_idx" ON "UserProgress" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "UserProgress_lessonId_idx" ON "UserProgress" USING btree ("lessonId");--> statement-breakpoint
CREATE INDEX "UserProgress_userId_lessonId_key" ON "UserProgress" USING btree ("userId","lessonId");--> statement-breakpoint
CREATE INDEX "User_email_key" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "User_role_idx" ON "User" USING btree ("role");--> statement-breakpoint
CREATE INDEX "User_createdAt_idx" ON "User" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "User_points_idx" ON "User" USING btree ("points");