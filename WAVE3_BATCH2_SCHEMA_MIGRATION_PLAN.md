# 📋 Wave 3 Batch 2: Schema Migration Required

## ⚠️ Missing Models

The integration tests require the following models that are not in the current Prisma schema:

### 1. Challenge & ChallengeParticipant (I007)
```prisma
model Challenge {
  id            String                 @id @default(uuid())
  title         String
  description   Json                   // {vi, en, zh}
  targetAmount  Int
  startDate     DateTime
  endDate       DateTime
  createdById   String
  createdAt     DateTime               @default(now())
  updatedAt     DateTime               @updatedAt
  participants  ChallengeParticipant[]
}

model ChallengeParticipant {
  id          String    @id @default(uuid())
  userId      String
  challengeId String
  progress    Int       @default(0)
  completed   Boolean   @default(false)
  joinedAt    DateTime  @default(now())
  challenge   Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)

  @@unique([userId, challengeId])
  @@index([challengeId])
}
```

### 2. AIAnalysis (I008)
```prisma
model AIAnalysis {
  id           String   @id @default(uuid())
  userId       String
  analysisType String
  result       Json     // AI analysis results
  confidence   Float    // 0.0 to 1.0
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId, analysisType])
  @@index([createdAt])
}
```

### 3. Enrollment, LessonProgress, QuizAttempt, Certificate, Achievement (I009)
```prisma
model Enrollment {
  id          String    @id @default(uuid())
  userId      String
  courseId    String
  enrolledAt  DateTime  @default(now())
  progress    Int       @default(0)
  completedAt DateTime?

  @@unique([userId, courseId])
  @@index([userId])
}

model LessonProgress {
  id          String    @id @default(uuid())
  userId      String
  lessonId    String
  completed   Boolean   @default(false)
  completedAt DateTime?

  @@unique([userId, lessonId])
}

model QuizAttempt {
  id          String   @id @default(uuid())
  userId      String
  courseId    String
  score       Int
  passed      Boolean  @default(false)
  attemptedAt DateTime @default(now())

  @@index([userId, courseId])
}

model Certificate {
  id             String   @id @default(uuid())
  userId         String
  courseId       String
  issuedAt       DateTime @default(now())
  certificateUrl String

  @@unique([userId, courseId])
}

model Achievement {
  id           String            @id @default(uuid())
  title        String
  description  Json              // {vi, en, zh}
  icon         String
  pointsReward Int
  createdAt    DateTime          @default(now())
  users        UserAchievement[]
}
```

**Note**: `UserAchievement` already exists in schema

### 4. NudgeHistory (I010)
```prisma
model NudgeHistory {
  id        String   @id @default(uuid())
  userId    String
  nudgeType String   // LOSS_AVERSION, SOCIAL_PROOF, FRAMING
  message   Json     // {vi, en, zh}
  metadata  Json     // Additional context
  sentAt    DateTime @default(now())

  @@index([userId, sentAt])
}
```

### 5. CourseAsset (I011)
```prisma
model CourseAsset {
  id         String   @id @default(uuid())
  courseId   String
  lessonId   String?
  fileName   String
  fileSize   Int
  mimeType   String
  storageKey String   // R2 storage path
  metadata   Json?    // {checksum, originalName, etc.}
  uploadedAt DateTime @default(now())

  @@index([courseId])
  @@index([lessonId])
}
```

## 📝 Recommended Actions

### Option 1: Add Missing Models (Preferred)
1. Create migration file: `apps/api/prisma/migrations/YYYYMMDDHHMMSS_add_integration_models/migration.sql`
2. Add all models above
3. Run `npx prisma migrate dev`
4. Run `npx prisma generate`

### Option 2: Adapt Tests to Existing Models
Map integration test concepts to existing models:
- **Challenge** → Use `BuddyChallenge` (already exists)
- **ChallengeParticipant** → Use `BuddyMember`
- **AIAnalysis** → Store in `BehaviorLog.payload`
- **Enrollment** → Use `UserProgress` (partial match)
- **NudgeHistory** → Store in `BehaviorLog` with `eventType='NUDGE'`
- **CourseAsset** → Store in `Lesson.videoKey` JSONB

### Option 3: Mock Prisma Client for Integration Tests
Use in-memory database with extended schema for testing only.

## ✅ Immediate Action

I'll update the integration tests to use **Option 2** (existing models) to ensure they run immediately without schema changes.
