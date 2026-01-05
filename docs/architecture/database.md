# Database Schema (Prisma + PostgreSQL)

**Database**: PostgreSQL 16  
**ORM**: Prisma 5.22  
**Schema**: `apps/api/prisma/schema.prisma`

---

## Table of Contents

- [Schema Overview](#schema-overview)
- [Core Entities](#core-entities)
- [JSONB Fields](#jsonb-fields)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Migrations](#migrations)

---

## Schema Overview

The database uses **normalized relational design** with **JSONB columns** for multi-language content.

### Entity Categories

1. **User & Auth**: User, RefreshToken, UserRelationship
2. **Courses & Learning**: Course, Lesson, UserProgress, QuizAttempt
3. **Gamification**: UserAchievement, UserStreak, UserChecklist, XPLog
4. **Social**: BuddyGroup, BuddyMember, SocialPost, ChatThread
5. **AI & Behavior**: BehaviorLog, InvestmentProfile
6. **Payments**: Transaction, Certificate
7. **Simulations**: SimulationScenario, SimulationCommitment, VirtualPortfolio
8. **Moderation**: ModerationLog

---

## Core Entities

### User

**Purpose**: Core user account with authentication and profile data

```prisma
model User {
  id                   String                 @id @default(uuid())
  email                String                 @unique
  passwordHash         String
  name                 Json?                  // { "vi": "...", "en": "...", "zh": "..." }
  role                 Role                   @default(STUDENT)
  points               Int                    @default(0)
  preferredLocale      String                 @default("vi")
  preferredLanguage    String?
  dateOfBirth          DateTime?
  moderationStrikes    Int                    @default(0)
  failedLoginAttempts  Int                    @default(0)
  lockedUntil          DateTime?
  stripeCustomerId     String?                @unique
  metadata             Json?
  createdAt            DateTime               @default(now())
  updatedAt            DateTime               @updatedAt
  
  // Relations
  behaviorLogs         BehaviorLog[]
  buddyMemberships     BuddyMember[]
  chatThreads          ChatThread[]
  investmentProfile    InvestmentProfile?
  refreshTokens        RefreshToken[]
  commitments          SimulationCommitment[]
  simulations          SimulationScenario[]
  socialPosts          SocialPost[]
  achievements         UserAchievement[]
  checklists           UserChecklist[]
  progress             UserProgress[]
  streaks              UserStreak?
  virtualPortfolio     VirtualPortfolio?
  moderationLogs       ModerationLog[]
  moderatedLogs        ModerationLog[]        @relation("moderator")
  following            UserRelationship[]     @relation("following")
  followers            UserRelationship[]     @relation("followers")
  quizAttempts         QuizAttempt[]
  certificates         Certificate[]
  transactions         Transaction[]

  @@index([email])
  @@index([role])
  @@index([createdAt])
  @@index([points])
}

enum Role {
  STUDENT
  TEACHER
  ADMIN
}
```

**Key Features**:
- **JSONB name field** for multi-language names
- **Stripe integration** via `stripeCustomerId`
- **Account lockout** via `failedLoginAttempts` + `lockedUntil`
- **Moderation tracking** via `moderationStrikes`

---

### Course

**Purpose**: Educational course with lessons

```prisma
model Course {
  id           String   @id @default(uuid())
  slug         String   @unique
  title        Json     // { "vi": "...", "en": "...", "zh": "..." }
  description  Json     // { "vi": "...", "en": "...", "zh": "..." }
  thumbnailKey String
  price        Int
  level        Level    @default(BEGINNER)
  published    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  lessons      Lesson[]
  certificates Certificate[]
  transactions Transaction[]

  @@index([slug])
  @@index([published, level])
}

enum Level {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}
```

**Key Features**:
- **JSONB title/description** for i18n
- **Slug-based routing** (`/courses/basic-budgeting`)
- **Price in cents** (e.g., 50000 = 500.00 VND)
- **Published flag** for draft courses

---

### Lesson

**Purpose**: Individual lesson within a course

```prisma
model Lesson {
  id        String         @id @default(uuid())
  courseId  String
  order     Int
  title     Json           // { "vi": "...", "en": "...", "zh": "..." }
  content   Json           // { "vi": "...", "en": "...", "zh": "..." }
  videoKey  Json?          // { "vi": "...", "en": "...", "zh": "..." }
  xpReward  Int            @default(10)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  
  // Relations
  course    Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  progress  UserProgress[]
  quizzes   Quiz[]

  @@index([courseId])
  @@index([order])
}
```

**Key Features**:
- **Order field** for sequential lessons
- **XP reward** for gamification
- **JSONB videoKey** for multi-language videos (YouTube IDs)

---

### UserProgress

**Purpose**: Track user progress through lessons

```prisma
model UserProgress {
  id          String    @id @default(uuid())
  userId      String
  lessonId    String
  completed   Boolean   @default(false)
  completedAt DateTime?
  timeSpent   Int       @default(0)  // seconds
  
  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson      Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId])
  @@index([lessonId])
  @@index([completed])
}
```

---

## JSONB Fields

### Multi-Language Content Pattern

All user-facing text uses **JSONB** with this structure:

```json
{
  "vi": "Xin chào",
  "en": "Hello",
  "zh": "你好"
}
```

**Fields using JSONB**:
- `User.name`
- `Course.title`, `Course.description`
- `Lesson.title`, `Lesson.content`, `Lesson.videoKey`
- `BuddyChallenge.title`
- `SocialPost.content`
- `Achievement.title`, `Achievement.description`

### Metadata Fields

Some entities have **flexible metadata** via JSONB:

```prisma
model User {
  metadata Json? // { "theme": "dark", "notifications": true, ... }
}

model BehaviorLog {
  metadata Json? // { "clickX": 123, "clickY": 456, "device": "mobile", ... }
}
```

---

## Relationships

### User ↔ Courses

```
User ──1:N──→ UserProgress ──N:1──→ Lesson ──N:1──→ Course
```

**Example Query** (Prisma):
```typescript
const userCourses = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    progress: {
      include: {
        lesson: {
          include: { course: true },
        },
      },
    },
  },
});
```

### Gamification: User ↔ Achievements

```
User ──1:N──→ UserAchievement ──N:1──→ Achievement
```

**Example**:
```typescript
const achievements = await prisma.userAchievement.findMany({
  where: { userId },
  include: { achievement: true },
});
```

### Social: Users ↔ Groups

```
User ──1:N──→ BuddyMember ──N:1──→ BuddyGroup
```

**Example**:
```typescript
const userGroups = await prisma.buddyMember.findMany({
  where: { userId },
  include: {
    group: {
      include: { members: { include: { user: true } } },
    },
  },
});
```

---

## Indexes

### Performance Indexes

**High-frequency queries**:
```prisma
model User {
  @@index([email])        // Login queries
  @@index([role])         // Role filtering
  @@index([points])       // Leaderboards
  @@index([createdAt])    // Recent users
}

model Course {
  @@index([slug])                // Course page routing
  @@index([published, level])    // Course catalog filtering
}

model UserProgress {
  @@index([userId])       // User's progress
  @@index([lessonId])     // Lesson completion stats
  @@index([completed])    // Completed lessons
}
```

### JSONB Indexes (Future)

For efficient JSONB queries:
```sql
CREATE INDEX idx_course_title_vi ON "Course" USING gin ((title->'vi'));
CREATE INDEX idx_lesson_content_en ON "Lesson" USING gin ((content->'en'));
```

---

## Migrations

### Prisma Migrate Workflow

**1. Create Migration**
```bash
npx prisma migrate dev --name add_user_lockout
```

**2. Apply to Production**
```bash
npx prisma migrate deploy
```

**3. Reset Database (Dev)**
```bash
npx prisma migrate reset
```

### Migration Files

Located in `apps/api/prisma/migrations/`:
```
migrations/
├── 20250101000000_init/
│   └── migration.sql
├── 20250102000000_add_gamification/
│   └── migration.sql
└── ...
```

### Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@v-edfinance.com',
      passwordHash: 'hashed_password',
      role: 'ADMIN',
      name: {
        vi: 'Quản trị viên',
        en: 'Administrator',
        zh: '管理员',
      },
    },
  });

  // Create sample courses
  await prisma.course.createMany({
    data: [
      {
        slug: 'basic-budgeting',
        title: {
          vi: 'Lập ngân sách cơ bản',
          en: 'Basic Budgeting',
          zh: '基本预算',
        },
        description: {
          vi: 'Học cách quản lý tiền bạc cá nhân',
          en: 'Learn personal money management',
          zh: '学习个人理财',
        },
        price: 0,
        level: 'BEGINNER',
        published: true,
      },
    ],
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run Seed**:
```bash
npx prisma db seed
```

---

## Entity Relationship Diagram

**Full ERD**: See [apps/api/docs/erd.md](../../apps/api/docs/erd.md)

**Core Relationships** (Simplified):
```
┌────────┐     1:N     ┌────────────┐     N:1     ┌────────┐
│  User  ├─────────────┤ UserProgress├─────────────┤ Lesson │
└────┬───┘             └────────────┘             └───┬────┘
     │                                                 │
     │ 1:N                                             │ N:1
     │                                                 │
     ▼                                                 ▼
┌─────────────┐                                  ┌────────┐
│UserAchievement│                                │ Course │
└─────────────┘                                  └────────┘
```

---

## Related Documentation

- [Backend Architecture](backend.md)
- [Frontend Architecture](frontend.md)
- [Deployment Guide](deployment.md)
- [Full Prisma Schema](../../apps/api/prisma/schema.prisma)

---

**Last Updated**: 2026-01-05  
**Maintained by**: V-EdFinance Team
