-- Performance Indexes Migration
-- Auto-generated from THREAD_HANDOFF_DATABASE_SPEED.md

-- BehaviorLog: Composite index for session + event queries
CREATE INDEX IF NOT EXISTS "BehaviorLog_sessionId_eventType_idx" ON "BehaviorLog"("sessionId", "eventType");

-- UserProgress: Index for lesson-based analytics
CREATE INDEX IF NOT EXISTS "UserProgress_lessonId_status_idx" ON "UserProgress"("lessonId", "status");

-- User: Partial index for leaderboard (only STUDENT role)
CREATE INDEX IF NOT EXISTS "User_points_student_idx" ON "User"("points" DESC) WHERE "role" = 'STUDENT';

-- Course: Composite index for filtered queries
-- Already exists: @@index([published, level]) in schema.prisma
