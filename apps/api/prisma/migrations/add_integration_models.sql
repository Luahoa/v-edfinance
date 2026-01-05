-- Wave 3 Batch 2: Integration Test Models Migration
-- This migration adds models required for advanced integration testing

-- I007: Multi-User Challenge Flow
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "targetAmount" INTEGER NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "ChallengeParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "ChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "ChallengeParticipant_userId_challengeId_key" ON "ChallengeParticipant"("userId", "challengeId");
CREATE INDEX "ChallengeParticipant_challengeId_idx" ON "ChallengeParticipant"("challengeId");

-- I008: AI Personalization Pipeline
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "AIAnalysis_userId_analysisType_idx" ON "AIAnalysis"("userId", "analysisType");
CREATE INDEX "AIAnalysis_createdAt_idx" ON "AIAnalysis"("createdAt");

-- I009: Course Lifecycle
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP
);

CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP,
    CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON "LessonProgress"("userId", "lessonId");

CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "attemptedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "QuizAttempt_userId_courseId_idx" ON "QuizAttempt"("userId", "courseId");

CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "certificateUrl" TEXT NOT NULL
);

CREATE UNIQUE INDEX "Certificate_userId_courseId_key" ON "Certificate"("userId", "courseId");

CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "icon" TEXT NOT NULL,
    "pointsReward" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- I010: Nudge Behavior Loop
CREATE TABLE "NudgeHistory" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "nudgeType" TEXT NOT NULL,
    "message" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sentAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "NudgeHistory_userId_sentAt_idx" ON "NudgeHistory"("userId", "sentAt");

-- I011: Storage Content Flow
CREATE TABLE "CourseAsset" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "metadata" JSONB,
    "uploadedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "CourseAsset_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE,
    CONSTRAINT "CourseAsset_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE
);

CREATE INDEX "CourseAsset_courseId_idx" ON "CourseAsset"("courseId");
CREATE INDEX "CourseAsset_lessonId_idx" ON "CourseAsset"("lessonId");

-- Additional User fields for I010 (if not already present)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT DEFAULT 'vi';

-- Update existing UserAchievement to link to Achievement table
ALTER TABLE "UserAchievement" ADD COLUMN IF NOT EXISTS "achievementId" TEXT;
ALTER TABLE "UserAchievement" ADD CONSTRAINT IF NOT EXISTS "UserAchievement_achievementId_fkey" 
    FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- Update BehaviorLog to support additional metadata
ALTER TABLE "BehaviorLog" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';

COMMENT ON TABLE "Challenge" IS 'I007: Multi-user challenge system';
COMMENT ON TABLE "AIAnalysis" IS 'I008: AI-powered personalization and recommendations';
COMMENT ON TABLE "Enrollment" IS 'I009: Course enrollment tracking';
COMMENT ON TABLE "NudgeHistory" IS 'I010: Behavioral nudge system (Hooked model)';
COMMENT ON TABLE "CourseAsset" IS 'I011: Course content storage (R2 integration)';
