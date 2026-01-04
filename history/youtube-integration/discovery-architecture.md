# YouTube Integration Discovery - Architecture Snapshot

**Discovery Agent:** A  
**Date:** 2026-01-04  
**Task:** YouTube video integration architecture analysis

---

## Executive Summary

The V-EdFinance platform has **existing video infrastructure** with a JSON-based localized video storage pattern (`videoKey` field). The system is ready for YouTube integration with minimal architectural changes.

---

## 1. Database Schema (Lesson Model)

### Location
`apps/api/prisma/schema.prisma` (Lines 138-155)

### Current Video Schema
```prisma
model Lesson {
  id        String         @id @default(uuid())
  courseId  String
  order     Int
  title     Json           // Localized: { vi, en, zh }
  content   Json           // Localized: { vi, en, zh }
  videoKey  Json?          // 🎯 KEY FIELD - Localized video identifiers
  type      LessonType     @default(VIDEO)
  duration  Int?           // Duration in seconds (for progress tracking)
  published Boolean        @default(false)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  course    Course         @relation(...)
  progress  UserProgress[]
}

enum LessonType {
  VIDEO
  READING
  QUIZ
  INTERACTIVE
}
```

### Current Usage Pattern
**Seed Data Example** (`apps/api/prisma/seed.ts:71`):
```typescript
videoKey: { 
  vi: 'v1-vi.mp4',    // Vietnamese video file
  en: 'v1-en.mp4'     // English video file
}
```

**Pattern:** File-based storage keys (likely S3/R2 paths)

### Proposed YouTube Integration Schema
**Option 1: Extend Current Pattern** (Recommended)
```typescript
videoKey: { 
  vi: 'yt:dQw4w9WgXcQ',  // YouTube ID prefix
  en: 'yt:abc123xyz',
  zh: 'yt:xyz789abc'
}
```

**Option 2: Dedicated YouTube Field**
```prisma
videoKey      Json?  // Keep for file-based videos
youtubeId     Json?  // New field: { vi: 'id1', en: 'id2', zh: 'id3' }
videoProvider String @default("FILE") // FILE | YOUTUBE | VIMEO
```

---

## 2. Backend Architecture (NestJS)

### Module: Courses
**Location:** `apps/api/src/courses/`

#### Key Files
1. **Controller** (`courses.controller.ts`)
   - Routes: `/courses`, `/courses/:id`, `/courses/lessons/:id`
   - Lesson CRUD: `GET /courses/lessons/:id`, `PATCH /lessons/:id`
   - Progress tracking: `POST /courses/lessons/:id/progress`

2. **Service** (`courses.service.ts`)
   - `findOneLesson(id)` - Lesson retrieval (Line 86-92)
   - `createLesson(data)` - Lesson creation (Line 108-121)
   - `updateLesson(id, data)` - Lesson update (Line 123-128)
   - **Anti-tampering validation** (Lines 158-206): 90% watch time requirement

3. **DTOs** (`dto/lesson.dto.ts`)
   ```typescript
   export class CreateLessonDto {
     @IsObject()
     @IsOptional()
     videoKey?: Record<string, string>; // 🎯 YouTube IDs go here
   
     @IsInt()
     duration?: number; // Auto-fetch from YouTube API
   
     @IsEnum(LessonType)
     type?: LessonType; // Set to VIDEO
   }
   ```

#### Existing Validation
- **ValidationService** (`common/validation.service.ts`)
  - Currently validates `I18N_TEXT` schema (localized strings)
  - **Action Required:** Add `YOUTUBE_ID` schema validation

#### Progress Tracking System
**Anti-Cheat Mechanism** (`courses.service.ts:158-206`):
- Requires **90% of video duration** watched before marking complete
- Logs suspicious activity to `BehaviorLog` table
- **Impact:** Must integrate with YouTube Player API's `onProgress` events

---

## 3. Frontend Architecture (Next.js)

### Lesson Player Component
**Location:** `apps/web/src/app/[locale]/courses/[id]/lessons/[lessonId]/page.tsx`

#### Current Implementation (Lines 172-183)
```tsx
{lesson.type === 'VIDEO' && (
  <div className="aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
    {/* PLACEHOLDER - No actual video player */}
    <div className="flex flex-col items-center justify-center">
      <PlayCircle size={64} />
      <p>Video ID: {lesson.videoKey}</p>  {/* Line 179 */}
      <p>Ready to stream</p>
    </div>
  </div>
)}
```

**Status:** 🚨 **No video player implemented** - Only displays video ID as text

#### Localization Pattern
```typescript
const locale = params.locale; // 'vi' | 'en' | 'zh'
const currentTitle = lesson.title[locale] || lesson.title.vi;
const videoId = lesson.videoKey?.[locale] || lesson.videoKey?.vi;
```

### Type Definitions
**Location:** `apps/web/src/types/course.ts`
```typescript
export interface Lesson {
  id: string;
  courseId: string;
  title: LocalizedString;
  content: LocalizedString;
  videoKey?: LocalizedString;  // 🎯 YouTube IDs
  order: number;
  type: LessonType;
}

export interface LocalizedString {
  vi: string;
  en: string;
  zh: string;
}
```

---

## 4. Existing Video Handling Patterns

### Progress Tracking Integration
**API Endpoint:** `POST /courses/lessons/:id/progress`  
**Request Body:**
```json
{
  "status": "COMPLETED",
  "durationSpent": 600  // Seconds watched
}
```

**Current Frontend Implementation** (`page.tsx:66-72`):
```typescript
fetch(`${API_URL}/courses/lessons/${lessonId}/progress`, {
  method: 'POST',
  body: JSON.stringify({ 
    status: 'COMPLETED', 
    durationSpent: 60  // 🚨 HARDCODED - Must track actual watch time
  })
})
```

---

## 5. Reusable Utilities & Services

### Existing Infrastructure

#### 1. Localization (i18n)
- **Library:** `next-intl`
- **Supported Locales:** `vi`, `en`, `zh`
- **Pattern:** All content stored in JSON with locale keys

#### 2. Authentication
- **Guard:** `JwtAuthGuard` (`apps/api/src/auth/jwt-auth.guard.ts`)
- **Token Storage:** Frontend uses `useAuthStore()` (Zustand)
- **API Headers:** `Authorization: Bearer ${token}`

#### 3. Database Services
- **Prisma Service:** `apps/api/src/prisma/prisma.service.ts`
- **Validation Service:** `apps/api/src/common/validation.service.ts`
  - Zod-based schema validation
  - **Action Required:** Add YouTube ID validation schema

#### 4. Gamification Integration
- **GamificationService** (`apps/api/src/common/gamification.service.ts`)
- Triggered on `LESSON_COMPLETED` event (10 points reward)
- **Location:** `courses.service.ts:243-245`

#### 5. Analytics/Behavior Tracking
- **BehaviorLog** table tracks all user interactions
- **EventTypes Used:**
  - `LESSON_VIEW`
  - `LESSON_START`
  - `LESSON_COMPLETED`
  - `SUSPICIOUS_PROGRESS` (anti-cheat)

---

## 6. Required NPM Packages

### Current Dependencies
**Root `package.json`:**
- ✅ `next`: 16.1.0
- ✅ `react`: 18.3.1
- ✅ `typescript`: 5.9.3

**Missing (Required for YouTube Integration):**
- ❌ `react-player` or `youtube-player` or native `<iframe>` API
- ❌ YouTube API client (optional, for metadata fetching)

### Recommended Package
**react-player** (Most Popular)
- URL: https://www.npmjs.com/package/react-player
- Size: ~50KB gzipped
- Features:
  - YouTube/Vimeo/MP4 support
  - Progress tracking hooks
  - Playback controls API
  - SSR compatible

**Installation:**
```bash
pnpm add react-player
```

---

## 7. API Routes Summary

### Existing Endpoints
| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `GET` | `/courses` | List all courses | Public |
| `GET` | `/courses/:id` | Course details + lessons | Public |
| `GET` | `/courses/lessons/:id` | Single lesson data | Public |
| `POST` | `/courses/lessons` | Create lesson | Admin/Teacher |
| `PATCH` | `/courses/lessons/:id` | Update lesson | Admin/Teacher |
| `POST` | `/courses/lessons/:id/progress` | Track progress | Authenticated |

### New Endpoints Needed
| Method | Route | Purpose | Priority |
|--------|-------|---------|----------|
| `POST` | `/courses/lessons/:id/youtube-metadata` | Fetch YT duration/title | Medium |
| `GET` | `/courses/lessons/:id/captions` | Fetch YT captions (i18n) | Low |

---

## 8. Frontend Components Structure

### Atomic Design Pattern
**Location:** `apps/web/src/components/`

```
components/
├── atoms/
│   └── Button.tsx               # ✅ Exists
├── molecules/
│   └── CourseCard.tsx           # ✅ Exists (no video player)
├── organisms/
│   └── (none for video yet)
└── ui/
    └── (shadcn components)
```

**Recommended Component Hierarchy:**
```
organisms/
└── VideoPlayer/
    ├── YouTubePlayer.tsx        # Main player wrapper
    ├── VideoControls.tsx        # Custom controls overlay
    ├── ProgressTracker.tsx      # Watch time tracking
    └── CaptionSelector.tsx      # Multi-language subtitles
```

---

## 9. Database Migration Strategy

### Option A: Extend Existing Pattern (No Migration)
✅ **Recommended** - Zero downtime

1. Update `videoKey` field to accept YouTube IDs
2. Add validation in `ValidationService`
3. Frontend detects format: `yt:xxxxx` vs file path

**Example:**
```typescript
// In ValidationService
const YOUTUBE_ID_SCHEMA = z.object({
  vi: z.string().regex(/^yt:[a-zA-Z0-9_-]{11}$/),
  en: z.string().regex(/^yt:[a-zA-Z0-9_-]{11}$/),
  zh: z.string().regex(/^yt:[a-zA-Z0-9_-]{11}$/),
});
```

### Option B: New Field (Requires Migration)
⚠️ **More Complex** - Needs Prisma migration

**Migration File:**
```prisma
-- AlterTable
ALTER TABLE "Lesson" 
  ADD COLUMN "youtubeId" JSONB,
  ADD COLUMN "videoProvider" TEXT DEFAULT 'FILE';
```

---

## 10. Integration Complexity Assessment

### Low Complexity (1-2 days)
- ✅ Database schema (already JSON-ready)
- ✅ Backend validation (extend ValidationService)
- ✅ Lesson DTO updates

### Medium Complexity (3-5 days)
- ⚠️ Frontend player component (react-player integration)
- ⚠️ Progress tracking (YouTube API events)
- ⚠️ Multi-language subtitle handling

### High Complexity (5-7 days)
- 🔴 Anti-tampering validation (90% watch time with YouTube API)
- 🔴 Offline/network error handling
- 🔴 Analytics integration (BehaviorLog events)

---

## 11. Identified Risks

### Technical Risks
1. **YouTube API Rate Limits**
   - Solution: Cache metadata in database
   
2. **Ad Blockers Breaking YouTube Embed**
   - Solution: Fallback UI + error detection
   
3. **CORS Issues with Restricted Videos**
   - Solution: Server-side validation endpoint

4. **Progress Tampering (Console Manipulation)**
   - Existing: 90% watch time requirement
   - Enhancement: Server-side duration fetch from YouTube API

### Business Risks
1. **YouTube Content Removal**
   - Solution: Webhook to check video availability
   
2. **Copyright Strikes**
   - Solution: Admin dashboard to validate video ownership

---

## 12. Recommended Next Steps

### Immediate Actions (Agent B - API Integration)
1. Create `YouTubeService` in `apps/api/src/modules/youtube/`
2. Add `YOUTUBE_VIDEO_KEY` schema to `ValidationService`
3. Update `CreateLessonDto` to accept YouTube IDs
4. Create endpoint `POST /youtube/validate` to check video existence

### Frontend Actions (Agent C - Player Component)
1. Install `react-player` package
2. Create `YouTubePlayer.tsx` in `components/organisms/`
3. Implement progress tracking hooks
4. Replace placeholder in `lessons/[lessonId]/page.tsx`

### Testing Actions (Agent D - QA)
1. Seed test lessons with YouTube IDs
2. Verify multi-language subtitle switching
3. Test 90% watch time validation
4. Load test with concurrent video streams

---

## 13. Key Entry Points for Implementation

### Backend Entry Point
**File:** `apps/api/src/courses/courses.service.ts`  
**Method:** `createLesson(data: CreateLessonDto)` (Line 108)

**Modification:**
```typescript
async createLesson(data: CreateLessonDto): Promise<Lesson> {
  // Validate YouTube ID if provided
  if (data.videoKey && this.isYouTubeId(data.videoKey)) {
    const metadata = await this.youtubeService.fetchMetadata(data.videoKey);
    data.duration = metadata.duration; // Auto-populate
  }
  
  return this.prisma.lesson.create({ ... });
}
```

### Frontend Entry Point
**File:** `apps/web/src/app/[locale]/courses/[id]/lessons/[lessonId]/page.tsx`  
**Line:** 172-183 (Video player placeholder)

**Modification:**
```tsx
import ReactPlayer from 'react-player/youtube';

{lesson.type === 'VIDEO' && (
  <ReactPlayer
    url={`https://youtube.com/watch?v=${lesson.videoKey[locale]}`}
    width="100%"
    height="100%"
    controls
    onProgress={handleProgress}  // Track watch time
  />
)}
```

---

## 14. Conclusion

**Architecture Readiness:** 🟢 **80% Ready**

### Strengths
- ✅ Localized video key infrastructure exists
- ✅ Progress tracking system operational
- ✅ Anti-tampering validation in place
- ✅ Atomic design component structure

### Gaps
- ❌ No video player component (only placeholder)
- ❌ Missing YouTube metadata fetching
- ❌ Hardcoded progress duration (not real-time)

### Estimated Total Effort
**15-20 development hours** across 4 agents (A/B/C/D) with proper coordination.

---

**End of Discovery Report**  
**Next Agent:** B (Backend YouTube Service Implementation)
