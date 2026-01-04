# YouTube Integration - Technical Constraints

**Discovery Agent:** C  
**Date:** 2026-01-04  
**Status:** Complete

---

## Environment Requirements

### Runtime Versions
- **Node.js:** v24.11.1 (detected)
- **Package Manager:** pnpm@9.15.0 (enforced)
- **TypeScript:** 5.7.3 (API), 5.x (Web)

### Package Manager Rules
- **MANDATORY:** Use `pnpm` only
- `package-lock.json` is blocked via `.gitignore`
- Monorepo managed via Turborepo with pnpm workspaces

---

## Key Dependencies

### Backend (apps/api)
- **NestJS:** v11.0.1
- **Axios:** 1.13.2 (for HTTP requests)
- **@nestjs/axios:** 4.0.1 (NestJS wrapper)
- **Zod:** 4.2.1 (validation)
- **Class-validator:** 0.14.3 (DTO validation)

### Frontend (apps/web)
- **Next.js:** 15.1.8 (App Router)
- **React:** 18.3.1
- **Axios/Fetch:** Not explicitly listed (use native fetch or add axios)
- **react-player:** Documented in `docs/FRONTEND_TOOLING.md` as recommended library for YouTube embeds

---

## TypeScript Configuration

### Backend (apps/api/tsconfig.json)
- **Module System:** `nodenext` (ESM-compatible)
- **Target:** ES2023
- **Strict Mode:** Partially enabled
  - `strictNullChecks: true`
  - `noImplicitAny: true`
  - `strictBindCallApply: true`
- **Decorators:** Enabled (required for NestJS)

### Root (tsconfig.json)
- **Target:** ES2020
- **Module:** CommonJS
- **Strict Mode:** `false` (root config is lenient)

### Frontend
- Uses Next.js defaults (TypeScript 5.x, strict mode likely enabled)

---

## Environment Variables & API Keys

### Current API Key Patterns
Project uses Google Gemini API extensively:
- `GEMINI_API_KEY` - Used in 5+ modules (ai-tutor, document-analyzer, market-simulator, etc.)
- `VANNA_API_KEY` - SQL AI service
- `E2B_API_KEY` - Code execution sandbox
- All API keys loaded via `@nestjs/config` (`ConfigService`)

### YouTube Data API Key Requirements
**Expected Environment Variables:**
```bash
# Required for YouTube Data API v3
YOUTUBE_API_KEY=AIza...

# Optional: For OAuth 2.0 (if user-specific features needed)
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
```

**Storage Location:**
- Must be in `apps/api/.env` (gitignored)
- Loaded via NestJS `ConfigService`
- **NEVER** hardcode in source code (enforced by security audit scripts)

### Security Considerations
1. **API Key Handling:**
   - Use `ConfigService.get<string>('YOUTUBE_API_KEY')`
   - Add validation in module constructor (throw if missing)
   - Redact from logs (see `apps/api/src/modules/audit/audit.interceptor.ts:90` for existing pattern)

2. **Rate Limiting:**
   - YouTube API has quota limits (10,000 units/day default)
   - Must implement caching to minimize API calls
   - Use `@nestjs/cache-manager` (already installed) or `@nestjs/throttler` (v6.5.0)

3. **Error Handling:**
   - YouTube API returns specific error codes (403 for quota exceeded, 400 for invalid params)
   - Must handle gracefully with user-friendly messages

---

## Build Requirements

### Build Commands
```bash
# API Build
pnpm --filter api build

# Web Build
pnpm --filter web build

# Full monorepo build
pnpm build
```

### Build Tools
- **Turbo:** Latest (caching build orchestrator)
- **esbuild:** 0.27.2 (overridden globally for version consistency)
- **NestJS CLI:** v11.0.0

### Build Restrictions
1. **Strict TypeScript:** No `any` types allowed (AGENTS.md mandate)
2. **No `@ts-expect-error` suppressions** unless user explicitly requests
3. **All builds must pass** before deployment (Zero-Debt Protocol)

---

## Existing Video Tooling

### React Player
- **Library:** `react-player` (documented, not installed yet)
- **Supports:** YouTube, Vimeo, Twitch, Facebook, SoundCloud, etc.
- **Usage Pattern:**
  ```tsx
  'use client'
  import ReactPlayer from 'react-player'
  
  <ReactPlayer 
    url='https://www.youtube.com/watch?v=VIDEO_ID' 
    controls={true}
    width="100%"
  />
  ```
- **Next.js Compatibility:** Must use `'use client'` or dynamic import to avoid SSR hydration errors

### Installation Required
```bash
pnpm add react-player --filter web
```

---

## Integration Architecture Constraints

### Atomic Design Pattern
- Frontend components follow Atomic Design (see AGENTS.md)
- YouTube player must be structured as:
  - **Atom:** `YouTubePlayer.tsx` (base player component)
  - **Molecule:** `VideoCard.tsx` (player + metadata)
  - **Organism:** `VideoLibrary.tsx` (list of videos)

### State Management
- **Zustand** for global state (e.g., playlist, watch history)
- React hooks for local player state (play/pause, progress)

### API Integration Pattern
Create NestJS module following existing patterns:
```
apps/api/src/modules/youtube/
├── youtube.module.ts
├── youtube.service.ts (API calls)
├── youtube.controller.ts (REST endpoints)
├── dto/
│   ├── search-video.dto.ts
│   └── get-video-details.dto.ts
└── youtube.service.spec.ts (tests)
```

---

## Testing Requirements

### Test Frameworks
- **Backend:** Vitest (v2.1.9)
- **E2E:** Playwright (v1.57.0)
- **Unit Tests:** AVA (v6.4.1) for fast standalone tests

### Coverage Targets
- **Unit Tests:** 90% coverage (per TEST_COVERAGE_BASELINE.md)
- **E2E Tests:** 85% coverage
- **AI Testing Army:** Google Gemini 2.0 Flash integration available (see AGENTS.md)

### Test Commands
```bash
# Backend unit tests
pnpm --filter api test

# Fast tests (skip slow integrations)
pnpm --filter api test:fast

# E2E tests
pnpm --filter web test
```

---

## Deployment Constraints

### Platforms
- **Backend:** Dokploy VPS (http://103.54.153.248:3001)
- **Frontend:** Cloudflare Pages (auto-deploy on push to main)

### Environment Variables in Production
- Must configure `YOUTUBE_API_KEY` in Dokploy dashboard
- Use secrets manager (not `.env` files) for production (per security audit script)

---

## Dependencies to Install

### Backend
```bash
pnpm add googleapis --filter api  # Official Google API client (if using OAuth)
# OR use raw axios calls to YouTube Data API v3
```

### Frontend
```bash
pnpm add react-player --filter web
```

### Optional: TypeScript Types
```bash
pnpm add -D @types/react-player --filter web
```

---

## Security Checklist

- [ ] YouTube API key stored in `.env` (gitignored)
- [ ] API key loaded via `ConfigService` (not hardcoded)
- [ ] API key redacted from logs (audit interceptor pattern)
- [ ] Rate limiting implemented (quota protection)
- [ ] Error handling for 403/400/500 responses
- [ ] No secrets in code (enforced by git pre-commit hooks)

---

## Next Steps (Recommendations)

1. **Agent D (API Design):** Define YouTube Data API endpoints needed (search, get video details, get playlist)
2. **Agent E (Backend):** Implement NestJS `YouTubeModule` with caching
3. **Agent F (Frontend):** Create Atomic Design components with react-player
4. **Agent G (Testing):** Write unit tests + E2E tests using Gemini AI

---

## References

- **AGENTS.md:** Project conventions, code style, Zero-Debt Protocol
- **docs/FRONTEND_TOOLING.md:** React Player documentation (lines 75-103)
- **apps/api/src/modules/ai-tutor/:** Example Google API integration pattern
- **PROJECT_AUDIT_2026-01-03.md:** Current project health status
