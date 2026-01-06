# Spike: i18n aria-label Pattern Validation (ved-pd8l)

**Epic**: ved-pd8l  
**Duration**: 15 minutes  
**Status**: ✅ VALIDATED

---

## ANSWER: YES - Pattern Validated

next-intl **fully supports** aria-label translations using the same `useTranslations()` pattern.

---

## EXAMPLE: Correct Usage Pattern

### Pattern (VideoControls.tsx - Lines 98, 108, 154, 165)

```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('Video');

// ✅ CORRECT: Dynamic aria-label
<Button
  aria-label={isPlaying ? t('pause') : t('play')}
>
  {isPlaying ? <Pause /> : <Play />}
</Button>

<Button
  aria-label={isMuted ? t('unmute') : t('mute')}
>
  {isMuted ? <VolumeX /> : <Volume2 />}
</Button>

<Button
  aria-label={t('pictureInPicture')}
>
  <PictureInPicture2 />
</Button>

<Button
  aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
>
  {isFullscreen ? <Minimize /> : <Maximize />}
</Button>
```

### Translation Files (en.json, vi.json, zh.json)

```json
// en.json
{
  "Video": {
    "play": "Play",
    "pause": "Pause",
    "mute": "Mute",
    "unmute": "Unmute",
    "fullscreen": "Fullscreen",
    "exitFullscreen": "Exit Fullscreen",
    "pictureInPicture": "Picture-in-Picture"
  }
}

// vi.json
{
  "Video": {
    "play": "Phát",
    "pause": "Tạm dừng",
    "mute": "Tắt tiếng",
    "unmute": "Bật tiếng",
    "fullscreen": "Toàn màn hình",
    "exitFullscreen": "Thoát toàn màn hình",
    "pictureInPicture": "Hình trong hình"
  }
}

// zh.json (same structure)
```

---

## FILES TO UPDATE

Add new namespace `Accessibility` to all 3 locale files:

1. `apps/web/src/messages/en.json`
2. `apps/web/src/messages/vi.json`
3. `apps/web/src/messages/zh.json`

---

## KEYS NEEDED (15+ aria-label translations)

### Recommended Structure

```json
{
  "Accessibility": {
    // Navigation
    "openMenu": "Open menu",
    "closeMenu": "Close menu",
    "openSidebar": "Open sidebar",
    "closeSidebar": "Close sidebar",
    "openThreadList": "Open thread list",
    "closeThreadList": "Close thread list",
    
    // Actions
    "logout": "Log out",
    "moreOptions": "More options",
    "remove": "Remove",
    "togglePlaylist": "Toggle playlist",
    "playMode": "Play mode",
    "previous": "Previous",
    "next": "Next",
    
    // Video (if not in Video namespace)
    "playVideo": "Play video",
    "pauseVideo": "Pause video",
    "muteVideo": "Mute video",
    "unmuteVideo": "Unmute video",
    
    // Forms
    "selectThread": "Select thread: {title}",
    
    // General
    "loading": "Loading...",
    "retry": "Retry"
  }
}
```

**Note**: VideoControls already uses `Video` namespace correctly. Other components need migration.

---

## CURRENT STATE

### ✅ Using i18n aria-label
- [VideoControls.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/atoms/VideoControls.tsx#L98) (4 aria-labels)
- [VideoPlaylist.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/organisms/VideoPlaylist.tsx#L214) (6 aria-labels with fallbacks)
- [InteractiveVideo.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/molecules/InteractiveVideo.tsx#L346) (1 aria-label)

### ❌ Hardcoded aria-label (needs migration)
- [Sidebar.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/organisms/Sidebar.tsx#L55) - `"Close sidebar"`
- [Sidebar.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/organisms/Sidebar.tsx#L102) - `"More options"`
- [Header.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/organisms/Header.tsx#L51) - `"Log out"`
- [AiMentor.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/AiMentor.tsx#L127) - `"Close/Open thread list"`
- [AiMentor.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/AiMentor.tsx#L158) - `"Select thread: ..."`

### ⚠️ No aria-label (breadcrumb is semantic, OK)
- [breadcrumb.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/ui/breadcrumb.tsx#L12) - `aria-label="breadcrumb"` (semantic HTML)

---

## ESTIMATE: 1-2 hours

**Breakdown**:
1. Add `Accessibility` namespace to 3 locale files: **30 min**
   - Create 15+ keys in en.json
   - Translate to vi.json (Vietnamese)
   - Translate to zh.json (Chinese)

2. Migrate hardcoded aria-labels: **30-45 min**
   - Update 5 components (Sidebar, Header, AiMentor)
   - Test screen reader behavior

3. QA + Documentation: **15 min**
   - Test with NVDA/VoiceOver
   - Update AGENTS.md with pattern

---

## VALIDATION RESULTS

### ✅ Does next-intl support aria-label translations?
**YES** - Confirmed in VideoControls.tsx (lines 98, 108, 154, 165)

### ✅ What's the correct pattern?
```tsx
const t = useTranslations('Namespace');
<Element aria-label={t('key')} />
```

### ✅ Do existing components use this correctly?
**Partial** - VideoControls/VideoPlaylist use correct pattern, but Sidebar/Header/AiMentor have hardcoded strings.

---

## RECOMMENDATIONS

1. **Namespace Strategy**:
   - Use `Accessibility` for general UI aria-labels
   - Keep domain-specific labels in their namespace (e.g., `Video.play`)

2. **Fallback Pattern** (VideoPlaylist approach):
   ```tsx
   aria-label={t('key', { default: 'English fallback' })}
   ```

3. **Dynamic Values**:
   ```tsx
   aria-label={t('selectThread', { title: thread.title })}
   ```

4. **Priority Order**:
   - P0: Migrate interactive buttons (Sidebar, Header) - 30 min
   - P1: Add comprehensive Accessibility namespace - 1 hour
   - P2: Document pattern in AGENTS.md - 15 min

---

## SPIKE CONCLUSION

**Pattern is production-ready** and already used correctly in video components. Main work is:
1. Create `Accessibility` namespace
2. Migrate 5 hardcoded aria-labels
3. Add translations for all 3 locales

**No blockers**. Ready for implementation.

---

**Spike completed**: ✅  
**Time spent**: 15 minutes  
**Confidence**: 100% (verified in production code)
