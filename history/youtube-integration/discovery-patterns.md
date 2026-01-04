# YouTube Integration - Discovery Patterns Report

**Agent:** Discovery Agent B  
**Date:** 2026-01-04  
**Task:** Analyze codebase patterns for external API integration and media embedding

---

## 1. JSON Field Validation Patterns

### ValidationService Pattern
**Location:** `apps/api/src/common/validation.service.ts`

**Core Pattern:**
```typescript
@Injectable()
export class ValidationService {
  validate(key: SchemaKey, data: any) {
    const schema = SchemaRegistry[key];
    if (!schema) throw new Error(`Schema for key ${key} is not defined`);
    
    const result = schema.safeParse(data);
    if (!result.success) {
      // Anti-hallucination logging
      this.logger.error(`[ANTI-HALLUCINATION] Validation failed for ${key}`);
      throw new BadRequestException({
        message: `Invalid data structure for ${key}`,
        details: errorDetails,
        errorId: `HALLUCINATION-${crypto.randomBytes(3).toString('hex')}`
      });
    }
    return result.data;
  }
}
```

**Key Findings:**
- ✅ All JSONB fields MUST be validated through ValidationService
- ✅ Zod schemas registered in SchemaRegistry
- ✅ Anti-hallucination error IDs for debugging
- ✅ Detailed error messages with field paths

### SchemaRegistry Pattern
**Location:** `apps/api/src/common/schema-registry.ts`

**Existing Schemas:**
```typescript
export const SchemaRegistry = {
  I18N_TEXT: z.object({
    vi: z.string(),
    en: z.string(),
    zh: z.string()
  }),
  
  USER_METADATA: z.object({
    avatar: z.string().url().optional(),
    preferences: z.record(z.string(), z.any()).optional()
  }),
  
  SOCIAL_POST_CONTENT: z.object({
    text: z.string().optional(),
    mediaKey: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).passthrough(),
  
  // ... 11 more schemas
}
```

**Pattern for YouTube Integration:**
```typescript
// Proposed schema structure
YOUTUBE_VIDEO_METADATA: z.object({
  videoId: z.string().min(11).max(11), // YouTube ID format
  title: z.string(),
  channelName: z.string().optional(),
  duration: z.number().optional(),
  embedUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  locale: z.enum(['vi', 'en', 'zh']).optional()
})
```

---

## 2. External API Integration Patterns

### Pattern A: HTTP Service (Zalo Notifications)
**Location:** `apps/api/src/modules/notifications/zalo-notification.service.ts`

**Pattern:**
```typescript
@Injectable()
export class ZaloNotificationService {
  private readonly n8nWebhookUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.n8nWebhookUrl = this.configService.get<string>(
      'N8N_WEBHOOK_URL',
      'http://localhost:5678'
    );
  }

  async sendNotification(data: NotificationData): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(webhookUrl, data, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      this.logger.log('✅ Notification sent');
    } catch (error) {
      this.logger.error('❌ Failed to send notification', error.stack);
      // Don't throw - notification failure shouldn't break core flow
    }
  }
}
```

**Key Patterns:**
- ✅ ConfigService for environment variables
- ✅ firstValueFrom for observable conversion
- ✅ Timeout configuration (10s)
- ✅ Non-critical errors don't break main flow
- ✅ Structured logging with emojis

### Pattern B: Axios Client (Vanna AI)
**Location:** `apps/api/src/modules/ai/vanna.service.ts`

**Pattern:**
```typescript
@Injectable()
export class VannaService {
  private readonly client: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('VANNA_API_KEY');
    const baseUrl = this.config.get<string>('VANNA_BASE_URL', 'https://api.vanna.ai');
    
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async generateSQL(request: VannaQueryRequest): Promise<VannaQueryResult> {
    try {
      const response = await this.client.post('/v1/generate-sql', {
        question: request.question,
        language: request.language || 'en'
      });
      
      return {
        sql: response.data.sql,
        confidence: response.data.confidence || 0,
        fromCache: false
      };
    } catch (error: any) {
      this.logger.error(`Vanna API error: ${error.message}`, error.stack);
      // Graceful degradation - return mock
      return this.getMockSQLResult(request.question);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
```

**Key Patterns:**
- ✅ Axios instance with baseURL + headers
- ✅ Bearer token authentication
- ✅ Graceful degradation with mock fallback
- ✅ Health check endpoint
- ✅ 30s timeout for AI operations

**Recommended for YouTube:**
- Use **HttpService** (Pattern A) for simple API calls
- Use **Axios** (Pattern B) if need client reuse + health checks

---

## 3. i18n Patterns (Multi-Language Content)

### Backend: JSONB Storage
**Location:** `apps/api/src/courses/dto/course.dto.ts`

**Pattern:**
```typescript
export class CreateCourseDto {
  @IsObject()
  @IsNotEmpty()
  title: Record<string, string>; // { vi: "...", en: "...", zh: "..." }

  @IsObject()
  @IsNotEmpty()
  description: Record<string, string>;
}

// Service layer validation
const title = this.validation.validate('I18N_TEXT', data.title);
const description = this.validation.validate('I18N_TEXT', data.description);
```

### Frontend: next-intl Hook
**Location:** `apps/web/src/components/molecules/CourseCard.tsx`

**Pattern:**
```typescript
import { useLocale, useTranslations } from 'next-intl';

export default function CourseCard({ course }: CourseCardProps) {
  const t = useTranslations('Courses'); // UI strings
  const locale = useLocale() as keyof typeof course.title;

  // Localized content with fallback
  const title = course.title[locale] || course.title.vi;
  const description = course.description[locale] || course.description.vi;

  return (
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span>{course.price === 0 ? t('free') : `${course.price.toLocaleString()} VND`}</span>
    </div>
  );
}
```

**Translation File Structure:**
```
apps/web/src/i18n/locales/
├── vi.json
├── en.json
└── zh.json
```

**Key Patterns:**
- ✅ Database: JSONB `{ vi, en, zh }` validated by I18N_TEXT schema
- ✅ Frontend: `useLocale()` + fallback to `vi`
- ✅ UI strings: `useTranslations('namespace')`
- ✅ Consistent locale keys: `'vi' | 'en' | 'zh'`

**For YouTube Integration:**
- Video titles/descriptions: Store as I18N_TEXT JSONB
- Channel names: Can be single string (no translation needed)
- API responses: Transform to I18N_TEXT format

---

## 4. Frontend Component Patterns

### Atomic Design Structure
```
apps/web/src/components/
├── atoms/          # Basic building blocks
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Badge.tsx
├── molecules/      # Simple composite components
│   ├── CourseCard.tsx
│   └── NudgeBanner.tsx
└── organisms/      # Complex sections
    ├── Header.tsx
    └── SocialFeed.tsx
```

### Media Embedding Pattern
**Location:** `apps/web/src/app/[locale]/courses/[id]/lessons/[lessonId]/page.tsx`

**Current Video Placeholder:**
```tsx
{lesson.type === 'VIDEO' && (
  <div className="aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl mb-10 group relative border border-zinc-800">
    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
      <PlayCircle size={64} className="mb-4 text-blue-600" />
      <p className="font-medium">Video ID: {lesson.videoKey}</p>
      <p className="text-sm opacity-60 mt-2">Ready to stream</p>
    </div>
  </div>
)}
```

**Key Patterns:**
- ✅ `aspect-video` class (16:9 ratio)
- ✅ Conditional rendering by lesson.type
- ✅ PlayCircle icon from lucide-react
- ✅ Responsive design (w-full, rounded-2xl)
- ✅ Dark mode support (bg-zinc-900, dark:)

### Naming Conventions
**Services (Backend):**
- Format: `{Feature}Service` (e.g., `CoursesService`, `VannaService`)
- Location: `apps/api/src/{module}/{feature}.service.ts`
- Injectable with constructor DI

**DTOs (Backend):**
- Format: `{Action}{Entity}Dto` (e.g., `CreateCourseDto`, `UpdateLessonDto`)
- Location: `apps/api/src/{module}/dto/{entity}.dto.ts`
- Use class-validator decorators (@IsString, @IsObject)

**Components (Frontend):**
- Format: PascalCase + descriptive (e.g., `CourseCard`, `SocialFeed`)
- Location: By atomic design level
- Props interface: `{Component}Props`

---

## 5. Recommended Architecture for YouTube Integration

### Backend Service
```
apps/api/src/modules/youtube/
├── youtube.module.ts
├── youtube.service.ts        # API integration
├── youtube.controller.ts
├── dto/
│   ├── youtube-search.dto.ts
│   └── youtube-metadata.dto.ts
└── youtube.service.spec.ts
```

**Service Template:**
```typescript
@Injectable()
export class YouTubeService {
  private readonly client: AxiosInstance;

  constructor(
    private readonly config: ConfigService,
    private readonly validation: ValidationService
  ) {
    const apiKey = this.config.get<string>('YOUTUBE_API_KEY');
    this.client = axios.create({
      baseURL: 'https://www.googleapis.com/youtube/v3',
      params: { key: apiKey },
      timeout: 10000
    });
  }

  async searchVideos(query: string, locale: 'vi' | 'en' | 'zh'): Promise<YouTubeSearchResult[]> {
    const response = await this.client.get('/search', {
      params: {
        q: query,
        part: 'snippet',
        type: 'video',
        relevanceLanguage: locale,
        maxResults: 10
      }
    });
    
    return response.data.items.map(item => this.transformToMetadata(item));
  }

  private transformToMetadata(item: any): YouTubeMetadata {
    const metadata = {
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
    };
    
    // Validate against schema
    return this.validation.validate('YOUTUBE_VIDEO_METADATA', metadata);
  }
}
```

### Frontend Component
```
apps/web/src/components/
├── molecules/
│   └── YouTubeEmbed.tsx
└── organisms/
    └── YouTubeSearchModal.tsx
```

**Component Template:**
```tsx
'use client';

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  autoplay?: boolean;
}

export default function YouTubeEmbed({ videoId, title, autoplay = false }: YouTubeEmbedProps) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-2xl">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
```

---

## 6. Key Takeaways

### Validation
✅ **MUST** register Zod schema in SchemaRegistry before any JSONB writes  
✅ **MUST** call `validation.validate()` in service layer  
✅ Use `.passthrough()` for extensible schemas (e.g., SOCIAL_POST_CONTENT)

### API Integration
✅ Use **HttpService** for simple webhooks (n8n pattern)  
✅ Use **Axios client** for complex APIs with auth + retries (Vanna pattern)  
✅ Always implement health checks  
✅ Graceful degradation for non-critical features

### i18n
✅ Backend: JSONB `{ vi, en, zh }` validated by I18N_TEXT  
✅ Frontend: `useLocale()` + fallback logic  
✅ Consistent locale keys across stack

### Component Structure
✅ Atomic Design: atoms → molecules → organisms  
✅ Naming: {Feature}Service, {Action}{Entity}Dto, {Component}Props  
✅ Media: `aspect-video`, responsive, dark mode support

### Testing
✅ Mock external APIs in `.spec.ts` files  
✅ Example: VannaService has mock fallback for API failures  
✅ Health checks return boolean (no throw)

---

## Next Steps for Implementation Agent

1. **Create Zod Schema:** Register `YOUTUBE_VIDEO_METADATA` in SchemaRegistry
2. **Build Service:** Follow VannaService pattern for YouTube Data API v3
3. **Create DTOs:** `YouTubeSearchDto`, `YouTubeMetadataDto`
4. **Build Component:** `YouTubeEmbed` molecule with iframe
5. **Update Lesson:** Replace videoKey placeholder with embed
6. **Add i18n:** Video titles to I18N_TEXT format

**Reference Files to Copy:**
- Service: `apps/api/src/modules/ai/vanna.service.ts`
- DTO: `apps/api/src/courses/dto/course.dto.ts`
- Component: `apps/web/src/components/molecules/CourseCard.tsx`
- Validation: `apps/api/src/common/schema-registry.ts`
