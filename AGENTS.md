# AGENTS.md

## Project Overview

**V-EdFinance** is an edtech platform for financial education and management.

- **Stack**: Next.js 15.1.2, React 18.3.1, NestJS, Prisma, PostgreSQL
- **Architecture**: Turborepo monorepo
- **i18n**: next-intl with `vi` (default), `en`, `zh`
- **Deployment**: Cloudflare Pages (frontend) + Dokploy VPS (backend)

---

## Frequently Used Commands

### Ralph CLI (Epic Automation) 🚀
```bash
# Start epic execution
test-ralph.bat start <epic-id> --max-iter 30 --verbose

# Check status
test-ralph.bat status <epic-id>

# List epics
test-ralph.bat list

# View help
test-ralph.bat --help
```
**Documentation**: See [RALPH_CLI_HANDOFF.md](RALPH_CLI_HANDOFF.md) for complete guide

### Development
```bash
pnpm dev                    # Start all apps in dev mode
START_DEV.bat              # Windows script to start dev servers
```

### Build & Type Checking
```bash
pnpm --filter web build    # Build frontend
pnpm --filter api build    # Build backend
pnpm --filter web lint     # Lint frontend code
pnpm --filter web type-check  # TypeScript type checking (if available)
```

### Monitoring & Observability
```bash
docker-compose -f docker-compose.monitoring.yml up -d  # Start Grafana/Prometheus
# Access: Grafana (3001), Prometheus (9090)
```

### Database
```bash
npx prisma migrate dev     # Run Prisma migrations
npx prisma generate        # Generate Prisma client
npx prisma studio          # Open Prisma Studio
```

### Testing
```bash
pnpm test                  # Run all tests
pnpm --filter web test     # Run frontend tests
pnpm --filter api test     # Run backend tests
```

---

## Code Style Preferences

### TypeScript
- **Strict mode enabled** - no compromises
- **No `any` types** - use proper typing or `unknown`
- **Prefer `interface` over `type`** for object shapes
- Use explicit return types for functions

### React/Next.js
- **Functional components only** - no class components
- **Server Components by default** - use `'use client'` only when needed
- **Atomic Design pattern**: `atoms/`, `molecules/`, `organisms/`
- Props interfaces named with `Props` suffix (e.g., `ButtonProps`)

### State Management
- **Zustand** for global state
- React hooks for local state
- Server state via React Query (if applicable)

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Files**: kebab-case for utilities (e.g., `format-date.ts`)
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE

---

## Project Structure

```
v-edfinance/
├── apps/
│   ├── web/          # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── i18n/
│   ├── api/          # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── debug/    # 🛠️ DEBUG & DIAGNOSTIC SYSTEM (Sandbox)
│   │   │   ├── prisma/
│   │   │   └── common/
├── packages/         # Shared packages (if any)
└── prisma/          # Database schema
```

### Key Directories
- **`apps/web/src/app/`**: Next.js App Router pages
- **`apps/web/src/components/`**: Reusable React components
- **`apps/api/src/modules/`**: NestJS feature modules
- **`prisma/`**: Database schema and migrations

---

## 🎨 Frontend Development Skills

We use ClaudeKit Frontend Skills to ensure consistent, beautiful, and performant UI.

### frontend-design
**When to use:** Creating new pages/components, redesigning existing UI
**Key principle:** Avoid generic AI aesthetics - create distinctive, polished designs.
- Use whitespace generously
- Focus on typography hierarchy
- Use F-pattern for data presentation

### frontend-development
**When to use:** Implementing components, optimizing performance
**Patterns:**
- **Suspense:** Always wrap async components in Suspense with Skeleton fallback
- **Lazy Loading:** Use `lazy(() => import())` for below-fold content
- **Server Components:** Default choice for data fetching

### ui-styling
**When to use:** Styling components, creating layouts
**Stack:** shadcn/ui + Tailwind CSS
- Use `cn()` for class merging
- Use design system tokens (colors, spacing)
- Do NOT use arbitrary values (e.g., `w-[350px]`)

### aesthetic
**When to use:** Design reviews, ensuring visual hierarchy
**Framework:**
1. **BEAUTIFUL:** Visual balance, color harmony, consistent spacing
2. **RIGHT:** Accessibility (WCAG AA), functionality, responsiveness
3. **SATISFYING:** Micro-interactions, smooth animations, hover states
4. **PEAK:** Storytelling elements, social proof, delight factors

### web-frameworks
**When to use:** App Router patterns, SSR/SSG decisions
**Tech:** Next.js 15, React Server Components (RSC), Partial Prerendering (PPR)

### V-EdFinance Specific Guidelines
- **Color Palette:** Green primary (growth), Blue secondary (trust), Red accents (alerts)
- **Typography:** Inter (works well for both Vietnamese and English)
- **Metaphors:** Use farming metaphors for savings/investment (rice fields, harvest)
- **Data Display:** High contrast, clear hierarchy for financial numbers

**Detailed Guide:** See [docs/FRONTEND_SKILLS_INTEGRATION_GUIDE.md](docs/FRONTEND_SKILLS_INTEGRATION_GUIDE.md)

---

## i18n Guidelines

### Translation Files
- Location: `apps/web/src/i18n/locales/{locale}.json`
- Supported locales: `vi` (default), `en`, `zh`
- **Always add translations to all three locale files**

### Usage Pattern
```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('namespace');
return <h1>{t('key')}</h1>;
```

### Database Localization
- Use **JSONB fields** for localized content
- Structure: `{ "vi": "...", "en": "...", "zh": "..." }`

---

## Spike Workflow Best Practices

### When to Use Spikes
- **Before fixing:** When error cause is unclear or fix approach uncertain
- **Time-box:** 15-30 minutes maximum
- **Goal:** Verify assumptions, identify root cause, document strategy

### Spike Execution Pattern
1. **Baseline First:** Always run `pnpm install` + `pnpm build` before creating fix beads
2. **Read Files:** Verify errors exist by reading actual files (avoid hallucination)
3. **Test Hypothesis:** Run targeted tests to confirm/reject assumptions
4. **Document Findings:** Create `.spikes/<name>/FINDINGS.md` with results
5. **Create Fix Beads:** Only after confirming root cause and strategy

### Learnings from Recent Spikes

**ved-b51s (Merge Strategy):**
- ❌ **Wrong:** Assume merge conflicts exist based on git history
- ✅ **Right:** Run `pnpm install` and `pnpm build` first to verify actual state
- **Lesson:** P0 gate was unnecessary - build already worked

**ved-wbpj (Schema Validation):**
- ✅ **Pattern:** Test with `prisma generate` before assuming schema drift
- ✅ **Pattern:** Build succeeds = no critical issues (warnings ≠ blockers)
- **Lesson:** Validation tools (prisma generate, build) catch real problems

### Anti-Hallucination Checklist for Spikes
- [ ] Read target files before making assumptions
- [ ] Run actual commands (build, test) rather than speculate
- [ ] Check git status/diff to verify conflicts exist
- [ ] Document "no action needed" outcomes (negative results matter)
- [ ] Close outdated beads when state has changed

---

## Quality Checklist

Before completing any task, ensure:

### Pre-Implementation
- [ ] Baseline: `pnpm install` succeeds
- [ ] Baseline: `pnpm --filter api build` succeeds (if backend changes)
- [ ] Baseline: `pnpm --filter web build` succeeds (if frontend changes)
- [ ] Read target files to verify imports and patterns

### Type Safety
- [ ] No `any` types used
- [ ] All function signatures have explicit types
- [ ] Prisma schema types match TypeScript interfaces

### Code Quality
- [ ] Lint passes: `pnpm --filter web lint`
- [ ] Build succeeds: `pnpm --filter web build`
- [ ] No TypeScript errors
- [ ] Follow Atomic Design structure

### Internationalization
- [ ] Translations added to `en.json`, `vi.json`, `zh.json`
- [ ] No hardcoded UI strings
- [ ] JSONB used for database localized fields

### Testing
- [ ] Unit tests for services/utilities
- [ ] Integration tests for API endpoints
- [ ] Test critical user flows

### Security
- [ ] No secrets in code
- [ ] Input validation implemented
- [ ] Proper authentication/authorization checks

---

## Special Notes

- **Reference**: See `SPEC.md` Section 10 for complete quality standards
- **Prisma**: Always run migrations after schema changes
- **Deployment**: Frontend auto-deploys to Cloudflare Pages on push to main
- **Database**: PostgreSQL connection details in `.env`
- **New Thread Protocol**: When starting a new session, ask the agent to: "Read `AGENTS.md` to activate **Behavioral & AI Engineering** skills and follow the specific Phase goals using **Nudge** & **Hooked** theories."

---

## Anti-Hallucination Protocol (Agent-to-Main)

Since this project is 100% Agent-coded, follow these rules to prevent "Hallucinations":

### 1. Verification Before Implementation
- **Always** `Read` the target file and its imports before editing.
- **Always** check `prisma/schema.prisma` before assuming any database field exists.
- **Never** call a service method without verifying its signature in the source file.

### 2. JSONB Schema Enforcement
- All JSONB writes must pass through the `ValidationService`.
- New JSONB structures must be registered in `SchemaRegistry`.

### 3. Pre-Commit Integrity Check
- Run `pnpm --filter api build` before finishing any task.
- Trigger `GET /api/debug/diagnostics/verify-integrity` to ensure no schema drift.

### 4. Grounding Citations
- Cite file paths and line numbers for every significant logic change.
- Use the `finder` tool to check for existing patterns before creating new ones.

---

## Beads Workflow Integration

This project uses [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Beads Trinity Protocol

The **Beads Trinity** consists of three components working together:
1. **`bd`** (beads CLI) - Task management and sync
2. **`bv`** (beads viewer) - Visual interface for task browsing
3. **Agent Mail** - Inter-agent communication via `.beads/agent-mail/*.json`

### Critical Rules for Git + Beads Operations

**NEVER enable beads daemon during git operations** - This causes lock conflicts:
```bash
# ✅ CORRECT: Use --no-daemon flag
beads sync --no-daemon

# ❌ WRONG: Daemon will hold .beads/daemon.lock
beads sync
```

**Add beads daemon files to .gitignore** to prevent conflicts:
```gitignore
# beads daemon files
.beads/daemon.lock
.beads/daemon.pid
.beads/daemon.log
.beads/beads.db*
.beads/bd.sock
```

**Use Beads Trinity for complex git operations** instead of manual git commands:
```bash
# Sync beads state before/after git operations
beads sync --no-daemon

# For git cleanup tasks, create beads task first
bd create "Git cleanup: <description>" --priority 0
bd edit <task-id> --status in_progress

# After completion
bd close <task-id> --reason "Detailed completion notes"
```

### Agent Mail Coordination

When performing blocking operations (merge, cleanup, deployment), create agent-mail notifications:

```json
{
  "task": "ved-xxxx",
  "status": "in_progress",
  "issue": "Brief description",
  "blocking": ["ved-yyyy", "ved-zzzz"],
  "eta": "5 minutes",
  "agent": "Agent Name"
}
```

Update to `completed` when done with detailed `resolution` and `actions_completed`.

### Lessons Learned from Git Issues (2026-01-05)

**Incident:** Git state broken after spike/simplified-nav → main merge
- Beads daemon held `.beads/daemon.lock`, blocking git operations
- Stash pop failed due to worktree vs working directory mismatch
- Large files (243MB) exceeded GitHub limits

**Resolution:**
1. Killed beads daemon processes (may respawn - kill again)
2. Removed `daemon.lock` manually
3. Added daemon files to `.gitignore`
4. Used `beads sync --no-daemon` for commit
5. Removed large files before push
6. Created agent-mail notifications for transparency

**Prevention:**
- Always use `--no-daemon` flag during git operations
- Add `.beads/daemon.*` to `.gitignore` immediately
- Check file sizes before commit (GitHub limit: 100MB)
- Use agent-mail for multi-agent coordination
- Create P0 beads task for critical fixes

---

### 1. Nudge Orchestration (Richard Thaler)
- **Engine Design**: Centralized service to calculate and deliver psychological triggers.
- **Key Tactics**:
  - *Social Proof*: "X% of users like you chose this."
  - *Loss Aversion*: "Don't lose your X-day streak."
  - *Framing*: Present choices as gains rather than losses.
  - *Mapping*: Convert abstract numbers into real-world value (e.g., $ = Coffee).
- **Documentation**: [docs/behavioral-design/nudge-theory.md](docs/behavioral-design/nudge-theory.md)

### 2. Hooked Loop Implementation (Nir Eyal)
- **Trigger**: External (Notifications/Nudges) and Internal (Curiosity/Achievement).
- **Action**: Simplify the most important user action (Single-click decisions).
- **Variable Reward**: Use AI to generate unpredictable story outcomes or rewards.
- **Investment**: Ask users to put in effort (Locking funds/Building a persona) to increase "stickiness".
- **Documentation**: [docs/behavioral-design/hooked-model.md](docs/behavioral-design/hooked-model.md)

### 3. Gamification Patterns
- **Points System**: Event-driven architecture with GamificationService
- **Leaderboards**: Global, periodic (daily/weekly/monthly), and streak rankings
- **Challenges**: Collaborative P2P group challenges with social rewards
- **Achievements**: Tiered badge system (BRONZE/SILVER/GOLD/PLATINUM)
- **Documentation**: [docs/behavioral-design/gamification.md](docs/behavioral-design/gamification.md)

### 4. AI-Powered Behavioral Analytics
- **Persona Modeling**: Analyzing `BehaviorLog` to identify psychological profiles.
- **Adaptive Difficulty**: Dynamically adjusting content complexity based on user success rate (Flow State).
- **Predictive Scenarios**: Using LLMs to simulate long-term consequences of short-term decisions.
- **Market Simulation**: High-scale localized traffic simulation (VI/EN/ZH) to verify sharding integrity.

### 4. Full System Audit & Zero-Debt Engineering
- **Context Guarding**: Implementation of automatic chat summarization and token-aware history slicing to prevent AI drift and cost spikes.
- **JSONB Schema Enforcement**: Using DTOs/Zod to validate multi-lingual and metadata fields, ensuring DB integrity.
- **Log Lifecycle Management**: Automated aggregation (Cron) and archiving logic to maintain DB performance at scale.
- **Centralized I18n**: Decoupling translations from business logic into a dedicated `I18nService` for consistent multi-market delivery.
- **WebSocket Resilience**: Using room-based broadcasting and ghost-connection cleanup to ensure stable social features.
- **Observability Sharding**: Separate monitoring stack for high-scale metrics (Prometheus/Grafana) to avoid interference with core API performance.

### 5. Maintenance & Debugging Hub (Senior Architect Protocols)
- **Error Reference ID**: Every error (UI or API) generates a unique `ErrorId` (e.g., `ERR-XXXX` or `UI-XXXX`). Users report this ID to find exact logs instantly.
- **Health Hub (Every Hour)**: A Cron task checks DB status, user metrics, and abnormal error rates. It logs a heartbeat to `BehaviorLog`.
- **Structured Exception Filter**: Centralized backend filter catches all errors, logs the stack trace with the `ErrorId`, and provides user-friendly suggestions.
- **Graceful UI Recovery**: `GlobalErrorBoundary` catches React crashes, displays the `ErrorId`, and allows a single-click state reset.

---

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

---

## Epic Execution Patterns (Ralph CLI + Orchestrator)

### Ralph Unified Pipeline 🚀

V-EdFinance uses **Ralph skill** - the complete automation pipeline from idea to production.

**One command executes everything**:
```bash
/skill ralph

# Automatically executes:
# Phase 1: PLANNING      → execution-plan.md
# Phase 2: EXECUTION     → parallel workers
# Phase 3: VERIFICATION  → quality gates
# Phase 4: DOCUMENTATION → knowledge extraction  
# Phase 5: LANDING       → git push

# Result: EPIC COMPLETE
```

**5-Phase Workflow**:
1. **Planning Phase** (planning.md skill):
   - Discovery → Approach → Spikes → Decomposition → Validation → Track Planning
   - Output: `history/<epic-id>/execution-plan.md`

2. **Execution Phase** (orchestrator.md skill):
   - Spawn parallel workers via `Task()` API
   - Each worker handles 1 track with isolated file scope
   - Agent Mail coordination via `.beads/agent-mail/*.json`

3. **Verification Phase** (Ralph CLI):
   - Quality gates (`scripts/quality-gate-ultra-fast.bat`)
   - Beads sync (`beads sync --no-daemon`)
   - Build verification (pnpm build, test)

4. **Documentation Phase** (knowledge skill):
   - Extract learnings from threads
   - Update AGENTS.md with patterns
   - Create diagrams with code citations

5. **Landing Phase** (mandatory):
   - Git push (MANDATORY before completion)
   - Close epic in beads
   - Create session handoff

**Example** (Epic ved-jgea):
```bash
# Planning → 5 tracks with file scope isolation
# Execution → 5 parallel workers (BlueLake, GreenCastle, etc.)
# Verification → 5/5 quality gates PASS
# Documentation → AGENTS.md updated (3 sections, 125 lines)
# Landing → git push SUCCESS

# Result: 82% completion (18/22 beads), 5/5 quality gates PASS
```

**Key Principles:**
- **Spikes first**: Validate HIGH-risk items (Prisma, VPS, automation) before main work
- **File scope isolation**: No overlapping paths between tracks prevents conflicts
- **Self-correction loops**: Workers run build/test verification after every change
- **Agent Mail**: Inter-track communication via JSON messages
- **Epic ≠ complete until git push**: Final step is ALWAYS push to remote

**Documentation**:
- [orchestrator.md](file:///e:/Demo%20project/v-edfinance/.agents/skills/orchestrator.md) - Worker spawning patterns
- [planning.md](file:///e:/Demo%20project/v-edfinance/.agents/skills/planning.md) - Discovery → execution plan pipeline
- [Ralph CLI docs](file:///e:/Demo%20project/v-edfinance/RALPH_CLI_HANDOFF.md) - Loop engine integration

---

## VPS Deployment Automation

### VPS Toolkit (Node.js SSH Automation)

For VPS operations, use **`scripts/vps-toolkit/`** instead of interactive SSH:

**Why**: Agents can't use `ssh vps "command"` due to timeout/cancellation. VPS Toolkit provides async/await API.

**Usage**:
```javascript
const VPSConnection = require('./scripts/vps-toolkit/vps-connection');

const vps = new VPSConnection();
await vps.connect();

// Execute commands
await vps.exec('docker ps');
await vps.uploadFile('./local.yml', '/root/remote.yml');

// Get system info
const info = await vps.getSystemInfo();

vps.disconnect();
```

**Key Features**:
- Non-interactive (no terminal prompts)
- SFTP support (upload/download files)
- Error handling built-in
- SSH key: `C:\Users\luaho\.ssh\vps_new_key`

**Safety Protocol** (AGENT_PROTOCOL.md):
- NEVER enable firewall before configuring SSH (will lock out)
- ALWAYS use `safe-deploy.js` for infrastructure changes
- ALWAYS verify SSH after firewall changes

**Documentation**:
- [VPS Toolkit README](file:///e:/Demo%20project/v-edfinance/scripts/vps-toolkit/README.md)
- [AGENT_PROTOCOL.md](file:///e:/Demo%20project/v-edfinance/scripts/vps-toolkit/AGENT_PROTOCOL.md)

---

## Knowledge Documentation (Post-Epic Hook)

After completing major epics, extract knowledge using the **knowledge skill**:

```bash
# Trigger after epic completion
/skill knowledge epic <epic-id>

# Workflow:
# 1. Find threads for epic
# 2. Extract topics, decisions, patterns
# 3. Verify against code (finder, Grep)
# 4. Update AGENTS.md, docs/, skills/
# 5. Create diagrams with code citations
```

**When to Use**:
- ✅ After major epic (>10 beads)
- ✅ Monthly documentation sync
- ✅ Pre-handoff to new agent session
- ✅ When significant patterns/decisions made

**Benefits**:
- Prevents knowledge loss (threads → docs)
- Reduces onboarding time
- Catches documentation drift
- Documents WHY, not just WHAT

**Documentation**: [knowledge skill](file:///e:/Demo%20project/v-edfinance/.agents/skills/knowledge/SKILL.md)

---

## Video System Architecture

V-EdFinance uses a multi-tier video optimization pipeline for high-performance learning experiences.

### Performance Tier
- **Compression**: Multi-quality encoding (360p-1080p) with 60-85% file size reduction
- **HLS Streaming**: Adaptive bitrate with bandwidth-aware quality switching (600Kbps - 4Mbps)
- **Lazy Loading**: Intersection Observer for viewport-based loading, metadata-only preload

**Services**:
- [VideoCompressionService](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/video/video-compression.service.ts) - Async job processing with progress tracking
- [HLSGeneratorService](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/video/hls-generator.service.ts) - Master playlist generation, 10s segments
- [OptimizedVideo](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/molecules/OptimizedVideo.tsx) - Lazy-loaded component with HLS support

### UX Tier
- **Player Controls**: Keyboard shortcuts (Space, K, Arrows, F, M, 0-9), playback speed (0.5x-2x), PiP mode
- **Accessibility**: WebVTT subtitles (vi/en/zh), screen reader support, customizable captions
- **Visual Feedback**: Thumbnails with hover preview, duration badges, loading skeletons

**Components**:
- [VideoPlayer](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/molecules/VideoPlayer.tsx) - Full-featured player with PiP, subtitles, keyboard control
- [VideoControls](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/atoms/VideoControls.tsx) - Custom controls UI (Atomic Design)
- [useVideoKeyboard](file:///e:/Demo%20project/v-edfinance/apps/web/src/lib/hooks/useVideoKeyboard.ts) - Keyboard shortcuts hook

### Infrastructure Tier
- **CDN**: Cloudflare R2 storage with edge caching (80%+ hit rate target, 1-year TTL)
- **Streaming**: HLS manifest generation with <2s latency target
- **Analytics**: Prometheus metrics (views, buffering, quality switches, errors, watch time)

**Services**:
- [CDNService](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/cdn/cdn.service.ts) - R2 upload/delete/metadata with cache purge
- [StreamingController](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/streaming/streaming.controller.ts) - 6 endpoints (upload, transcode, manifest, metrics, jobs, health)
- [VideoAnalyticsService](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/analytics/video-analytics.service.ts) - Prometheus integration, real-time dashboard

### Advanced Features
- **Playlist**: Auto-play next, shuffle/repeat modes, progress tracking (Zustand persist)
- **Offline**: PWA video caching (500MB quota, 30-day auto-cleanup, IndexedDB)
- **Interactive**: Clickable hotspots, pause-for-quiz, branching narratives, jump-to-timestamp

**Pattern**: Compression → HLS → CDN → Analytics → Offline/Interactive

**Quality Targets**:
- File size reduction: 60-85%
- Page load with videos: ≤3s
- CDN cache hit rate: ≥80%
- Streaming latency: <2s
- Buffering events: Monitored via Prometheus

**Documentation**: [ved-59th execution plan](file:///e:/Demo%20project/v-edfinance/history/ved-59th/execution-plan.md)

---

## UI Accessibility Best Practices (WCAG AA)

V-EdFinance maintains WCAG AA compliance through systematic accessibility patterns.

### Accessibility-First Component Pattern

**When to use:** All new interactive components (buttons, forms, modals, loading states)

**Required elements:**
1. **aria-labels** via i18n (`Accessibility` namespace)
2. **Focus management** (visible ring, focus trap for modals)
3. **Loading announcements** (aria-live + Skeleton)
4. **Touch targets** (44px minimum per WCAG 2.5.5)

**Template:**
```tsx
'use client';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

export function AccessibleComponent() {
  const t = useTranslations('Dashboard');
  const a = useTranslations('Accessibility');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div aria-live="polite" aria-busy={isLoading}>
      {isLoading ? (
        <>
          <span className="sr-only">{a('loadingContent')}</span>
          <Skeleton className="h-20 w-full" />
        </>
      ) : (
        <Button
          aria-label={a('actionName')}
          className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t('actionLabel')}
        </Button>
      )}
    </div>
  );
}
```

### i18n Accessibility Namespace

**Location:** `apps/web/src/messages/{locale}.json`  
**Purpose:** Screen reader announcements (separate from visible UI strings)

**Structure:**
```json
{
  "Accessibility": {
    "actionName": "Descriptive action for screen readers",
    "loadingContent": "Loading content...",
    "progressStatus": "{completed} of {total} completed"
  }
}
```

**Rules:**
- Use `useTranslations('Accessibility')` for aria-labels
- Use `useTranslations('Dashboard')` for visible text
- Never mix screen reader context with visual context

### Focus Management

**Keyboard navigation:** All interactive elements must be keyboard-accessible (Tab, Enter, ESC)

**Pattern:**
```tsx
// Always add focus-visible ring
className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"

// For modals/dialogs: Use radix-ui primitives (built-in focus trap)
import { Dialog } from '@radix-ui/react-dialog';
<Dialog>...</Dialog>
```

**Testing:**
- [ ] Tab cycles through all interactive elements
- [ ] ESC closes modals
- [ ] Enter activates buttons
- [ ] Focus ring visible on keyboard nav

### Loading State Accessibility

**Pattern:** Skeleton + aria-live (deprecate Loader2)

```tsx
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? (
    <>
      <span className="sr-only">{a('loadingMessage')}</span>
      <Skeleton className="h-20 w-full" />
    </>
  ) : (
    <Content />
  )}
</div>
```

**Key attributes:**
- `aria-live="polite"` - Announces changes without interrupting
- `aria-busy={isLoading}` - Signals loading state
- `sr-only` class - Screen reader-only text

### Touch Targets (WCAG 2.5.5)

**Minimum:** 44px × 44px on mobile (Level AAA)  
**Implementation:** Use button.tsx variants (default: 48px, sm: 44px, lg: 44px)

**Pattern:**
```tsx
// Default buttons (48px)
<Button size="default">Action</Button>

// Small buttons (44px minimum)
<Button size="sm">Compact</Button>

// Icon buttons (44px)
<Button size="icon"><Icon /></Button>
```

**Testing:** Manual test on 375px viewport (iPhone SE)

### Decorative Icons

**Rule:** If icon is purely visual (no semantic meaning), hide from screen readers

```tsx
<Award aria-hidden="true" className="h-6 w-6" />
```

### Semantic ARIA Roles

**Progress indicators:**
```tsx
<div
  role="progressbar"
  aria-valuenow={50}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={a('checklistProgress', { completed: 5, total: 10 })}
/>
```

**Combobox/search:**
```tsx
<Input role="combobox" aria-label={a('searchCommands')} />
<div role="listbox">{results}</div>
```

### Accessibility Checklist (Pre-Commit)

- [ ] All buttons have `aria-label` (via `Accessibility` namespace)
- [ ] Focus states visible (`focus-visible:ring-2`)
- [ ] Loading states announced (`aria-live="polite"`)
- [ ] Touch targets ≥44px (use button.tsx variants)
- [ ] Decorative icons hidden (`aria-hidden="true"`)
- [ ] Modals use radix-ui primitives (focus trap)
- [ ] Manual keyboard test (Tab, Enter, ESC)

**Tools:**
- Lighthouse accessibility audit (target: ≥85)
- NVDA/VoiceOver screen reader testing
- Manual mobile touch testing (375px viewport)

**Reference:** [ved-pd8l knowledge extraction](file:///e:/Demo%20project/v-edfinance/docs/ved-pd8l-knowledge-extraction.md)

---
