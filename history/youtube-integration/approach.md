# Approach: YouTube Video Integration

**Generated:** 2026-01-04  
**User Request:** Embed YouTube videos from teaching channel into course lessons

---

## Gap Analysis

| Component | Have | Need | Gap |
|-----------|------|------|-----|
| **Schema** | Lesson.videoKey (JSON) | YouTube ID storage | Extend format with `yt:` prefix |
| **Validation** | SchemaRegistry + Zod | YouTube metadata validation | New schema: `YOUTUBE_VIDEO_METADATA` |
| **Backend API** | No external integrations | YouTube Data API v3 client | New YouTubeService (Axios pattern) |
| **Frontend Player** | Placeholder component | Embedded player + progress | react-player + event handlers |
| **Admin UI** | Basic lesson form | YouTube URL input | URL parser + auto-fetch metadata |
| **Progress Tracking** | Hardcoded `durationSpent: 60` | 90% anti-cheat validation | Server-side duration check |

---

## Recommended Approach: Option B (Standard Integration)

**Risk Level:** MEDIUM  
**Effort:** 20-30 hours (2 weeks part-time)  
**Deliverables:**
- ✅ YouTube video embedding with progress tracking
- ✅ Auto-fetch thumbnail + duration from YouTube API
- ✅ 90% anti-cheat integration
- ✅ Admin URL paste workflow
- ❌ Playlist support (deferred to Phase 2)

**Architecture:**
```
Backend:
├── apps/api/src/modules/youtube/
│   ├── youtube.module.ts
│   ├── youtube.service.ts        # Axios + caching
│   └── dto/youtube-metadata.dto.ts

Frontend:
├── apps/web/src/components/
│   ├── molecules/YouTubeEmbed.tsx
│   └── organisms/VideoPlayer/
│       ├── index.tsx
│       └── ProgressTracker.tsx
```

### Alternative Approaches

1. **Option A: MVP** (8-12 hours) - Manual duration, no auto-fetch, iframe-only
   - **Tradeoff:** Fast but lacks polish, requires admin manual work
2. **Option C: Full** (40-60 hours) - Playlist support, subtitles, monitoring
   - **Tradeoff:** Scalable but overkill for initial launch

---

## Risk Map

| Component | Risk | Reason | Verification |
|-----------|------|--------|--------------|
| **Schema Validation** | LOW | SchemaRegistry pattern exists | Unit test |
| **YouTubeService** | MEDIUM | First external API integration | Mock API tests |
| **Player Component** | MEDIUM | SSR hydration concerns | Build test + E2E |
| **Progress Tracking (90%)** | HIGH | Anti-cheat manipulation risk | Security audit + E2E |
| **Ad Blocker Resilience** | HIGH | Silent embed failure | Error boundary test |
| **Content Availability** | HIGH | Videos can be deleted | Webhook/cron validation |

---

## Implementation Phases (Option B)

### Phase 1: Backend Foundation (Day 1-2) - 🟢 LOW/MEDIUM
```
├── ved-YT1: Add YOUTUBE_VIDEO_METADATA to SchemaRegistry [LOW]
├── ved-YT2: Create YouTubeService with metadata fetch [MEDIUM]
├── ved-YT3: Update CreateLessonDto [LOW]
└── ved-YT4: Add POST /youtube/validate endpoint [LOW]
```

### Phase 2: Frontend Player (Day 3-4) - 🟢 LOW/MEDIUM
```
├── ved-YT5: Install react-player [LOW]
├── ved-YT6: Create YouTubeEmbed molecule [MEDIUM]
├── ved-YT7: Replace placeholder in lesson page [LOW]
└── ved-YT8: Add admin URL input field [LOW]
```

### Phase 3: Progress Integration (Day 5-7) - 🔴 HIGH
```
├── ved-YT9: Implement onProgress handler [MEDIUM]
├── ved-YT10: Connect to existing progress API [LOW]
├── ved-YT11: Server-side duration validation [HIGH] ⚠️ SPIKE REQUIRED
└── ved-YT12: Anti-cheat edge case testing [HIGH] ⚠️ SPIKE REQUIRED
```

### Phase 4: Polish & QA (Day 8-10) - 🟡 MEDIUM/HIGH
```
├── ved-YT13: Error boundaries + fallbacks [MEDIUM]
├── ved-YT14: E2E test suite [MEDIUM]
├── ved-YT15: Security audit [HIGH] ⚠️ SPIKE REQUIRED
└── ved-YT16: Performance optimization [MEDIUM]
```

---

## Key Decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| **Schema approach** | Extend videoKey with `yt:VIDEO_ID` | Zero migration, backward compatible |
| **Player library** | react-player | SSR compatible, progress hooks built-in |
| **API client** | Axios (pattern like VannaService) | Consistent with existing codebase |
| **Caching** | Database (Lesson.duration) + in-memory | Minimize YouTube API quota usage |
| **Playlist** | Defer to Phase 2 | Reduce initial complexity |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| YouTube API quota exceeded | Cache aggressively, fetch only on lesson create/update |
| Progress manipulation | Server-side validation: fetch duration from YouTube, compare to reported |
| Ad blocker breaking embed | Error boundary with "Enable YouTube" message |
| Video becomes unavailable | Weekly cron job to validate all YouTube IDs |
| SSR hydration mismatch | Dynamic import with `ssr: false` |

---

## Spikes Required (HIGH Risk Items)

1. **Spike ved-SPK-YT1:** Anti-cheat Progress Validation
   - Question: Can we reliably detect 90% completion without client manipulation?
   - Time-box: 2 hours
   - Output: `.spikes/youtube/anti-cheat/`

2. **Spike ved-SPK-YT2:** Ad Blocker Detection
   - Question: How to detect YouTube embed failure and show fallback UI?
   - Time-box: 1 hour
   - Output: `.spikes/youtube/ad-blocker/`

3. **Spike ved-SPK-YT3:** Content Availability Monitoring
   - Question: Webhook vs Cron for video availability checks?
   - Time-box: 1 hour
   - Output: `.spikes/youtube/monitoring/`

**Total Spike Time:** 4 hours (must complete before Phase 3 begins)

---

## Success Criteria

- ✅ Admin pastes YouTube URL → auto-fetches metadata
- ✅ Video embeds on lesson page with player controls
- ✅ Progress tracking updates UserProgress API
- ✅ 90% completion unlocks next lesson
- ✅ Error handling for deleted/unavailable videos
- ✅ No SSR hydration errors
- ✅ Zero build errors (`pnpm --filter api build`, `pnpm --filter web build`)
