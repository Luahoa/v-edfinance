# Skill: Prisma Edtech Schema Templates

**Purpose:** Production-ready Prisma schema templates for edtech platforms with multi-language support, gamification, and behavioral tracking.

**When to use:** Setting up database schema for learning platforms, MOOCs, or educational SaaS.

---

## Complete Edtech Schema

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER MANAGEMENT & AUTHENTICATION
// ============================================

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  passwordHash    String
  role            Role     @default(STUDENT)
  points          Int      @default(0)
  preferredLocale String   @default("vi") // vi, en, zh
  metadata        Json?    // { displayName, avatar, preferences }
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  enrollments     Enrollment[]
  progress        UserProgress[]
  badges          UserBadge[]
  behaviorLogs    BehaviorLog[]
  investmentProfile InvestmentProfile?
  
  @@index([email])
  @@index([role])
}

enum Role {
  STUDENT
  TEACHER
  ADMIN
}

// ============================================
// LEARNING CONTENT (Localized with JSONB)
// ============================================

model Course {
  id          String   @id @default(uuid())
  slug        String   @unique
  
  // Localized fields (JSONB)
  title       Json     // { "vi": "Tài chính cơ bản", "en": "Finance 101", "zh": "..." }
  description Json     // { "vi": "...", "en": "...", "zh": "..." }
  
  thumbnailKey String  // R2 storage key
  price        Int     // In cents (0 = free)
  level        Level   @default(BEGINNER)
  published    Boolean @default(false)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  lessons      Lesson[]
  enrollments  Enrollment[]
  
  @@index([slug])
  @@index([published, level])
}

enum Level {
  BEGINNER
  INTERMEDIATE
  EXPERT
}

model Lesson {
  id        String   @id @default(uuid())
  courseId  String
  order     Int
  
  // Localized fields
  title     Json     // { "vi": "...", "en": "...", "zh": "..." }
  content   Json     // Markdown/JSON content, localized
  videoKey  Json?    // Can be localized: { "vi": "key1", "en": "key2" } or simple String
  
  type      LessonType @default(VIDEO)
  duration  Int?     // Seconds
  published Boolean  @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  progress  UserProgress[]
  
  @@unique([courseId, order])
  @@index([courseId, published])
}

enum LessonType {
  VIDEO
  READING
  QUIZ
  INTERACTIVE
}

// ============================================
// ENROLLMENT & PROGRESS TRACKING
// ============================================

model Enrollment {
  id           String   @id @default(uuid())
  userId       String
  courseId     String
  enrolledAt   DateTime @default(now())
  completedAt  DateTime?
  
  // Relations
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course       Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

model UserProgress {
  id           String   @id @default(uuid())
  userId       String
  lessonId     String
  status       ProgressStatus @default(STARTED)
  durationSpent Int     @default(0) // Seconds spent on lesson
  completedAt  DateTime?
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson       Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  @@unique([userId, lessonId])
  @@index([userId, status])
}

enum ProgressStatus {
  STARTED
  IN_PROGRESS
  COMPLETED
}

// ============================================
// GAMIFICATION SYSTEM
// ============================================

model Badge {
  id          String   @id @default(uuid())
  slug        String   @unique
  
  // Localized
  name        Json     // { "vi": "Nhà đầu tư", "en": "Investor", "zh": "..." }
  description Json
  
  iconKey     String   // R2 storage key for badge icon
  pointsRequired Int   @default(0)
  
  createdAt   DateTime @default(now())
  
  // Relations
  userBadges  UserBadge[]
  
  @@index([slug])
}

model UserBadge {
  id          String   @id @default(uuid())
  userId      String
  badgeId     String
  awardedAt   DateTime @default(now())
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge       Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  
  @@unique([userId, badgeId])
  @@index([userId])
}

// ============================================
// BEHAVIORAL TRACKING (Fintech Analytics)
// ============================================

model BehaviorLog {
  id          String   @id @default(uuid())
  userId      String?  // Nullable for anonymous tracking
  sessionId   String
  
  path        String   // URL path
  eventType   EventType
  payload     Json?    // Flexible data: { action, value, metadata }
  
  timestamp   DateTime @default(now())
  
  // Relations
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([userId, timestamp])
  @@index([eventType, timestamp])
  @@index([sessionId])
}

enum EventType {
  PAGE_VIEW
  LESSON_START
  LESSON_COMPLETE
  QUIZ_ATTEMPT
  PURCHASE
  INVESTMENT_SIMULATION
  CUSTOM
}

// ============================================
// INVESTMENT PROFILE (Fintech-specific)
// ============================================

model InvestmentProfile {
  id                  String   @id @default(uuid())
  userId              String   @unique
  
  riskScore           Int      @default(50) // 0-100
  investmentPhilosophy Json    // Localized: { "vi": "...", "en": "..." }
  financialGoals      Json     // Array of goals
  currentKnowledge    Level    @default(BEGINNER)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

---

## Migration Commands

```bash
# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database (create seed file first)
npx prisma db seed

# Reset database (DEV ONLY!)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

---

## Seed Data Template

**`apps/api/prisma/seed.ts`:**

```typescript
import { PrismaClient, Role, Level, LessonType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@v-edfinance.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: Role.ADMIN,
      preferredLocale: 'vi',
      metadata: { displayName: 'Admin User' },
    },
  });

  // Create sample course
  const course = await prisma.course.create({
    data: {
      slug: 'tai-chinh-co-ban',
      title: {
        vi: 'Tài chính cơ bản',
        en: 'Finance Fundamentals',
        zh: '金融基础',
      },
      description: {
        vi: 'Khóa học về quản lý tài chính cá nhân',
        en: 'Personal finance management course',
        zh: '个人理财管理课程',
      },
      thumbnailKey: 'courses/finance-101/thumb.jpg',
      price: 0,
      level: Level.BEGINNER,
      published: true,
    },
  });

  // Create sample lesson
  await prisma.lesson.create({
    data: {
      courseId: course.id,
      order: 1,
      title: {
        vi: 'Giới thiệu về tài chính',
        en: 'Introduction to Finance',
        zh: '金融简介',
      },
      content: {
        vi: '# Chào mừng...',
        en: '# Welcome...',
        zh: '# 欢迎...',
      },
      videoKey: { vi: 'lesson1-vi.mp4', en: 'lesson1-en.mp4' },
      type: LessonType.VIDEO,
      duration: 600,
      published: true,
    },
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Add to `package.json`:**
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## Best Practices

### 1. Localization Strategy
- **ALWAYS use JSONB** for user-facing text (title, description)
- **Structure:** `{ "vi": "...", "en": "...", "zh": "..." }`
- **Fallback logic** in application layer if locale missing

### 2. Indexing
- Index frequently queried fields (email, slug, userId)
- Composite indexes for common query patterns
- Avoid over-indexing (impacts write performance)

### 3. Cascade Deletes
- Use `onDelete: Cascade` for child records
- Use `onDelete: SetNull` for optional relations
- Consider soft deletes for audit trails

### 4. Performance
- Use `@@index` for frequently filtered fields
- Batch operations with `createMany`, `updateMany`
- Use `select` to limit returned fields
- Implement pagination for large datasets

---

## Common Queries

```typescript
// Get course with localized content
const course = await prisma.course.findUnique({
  where: { slug: 'tai-chinh-co-ban' },
  select: {
    id: true,
    title: true, // Returns full JSONB
    description: true,
    lessons: {
      where: { published: true },
      orderBy: { order: 'asc' },
    },
  },
});

// Extract locale-specific data
const localizedTitle = course.title[locale] || course.title['vi'];

// Track user progress
await prisma.userProgress.upsert({
  where: {
    userId_lessonId: { userId: user.id, lessonId: lesson.id },
  },
  update: { status: 'COMPLETED', completedAt: new Date() },
  create: {
    userId: user.id,
    lessonId: lesson.id,
    status: 'COMPLETED',
    completedAt: new Date(),
  },
});
```

---

## References

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Database Design Patterns](https://www.prisma.io/dataguide/types/relational)
