# Discovery: i18n and Mobile Constraints for Epic ved-pd8l

**Epic**: ved-pd8l  
**Discovery Agent**: Agent C  
**Date**: 2026-01-07  
**Time**: 15 minutes

---

## 1. i18n Configuration

### File Structure
**Location**: `apps/web/src/messages/`

```
apps/web/src/messages/
├── vi.json  (Vietnamese - default locale)
├── en.json  (English)
└── zh.json  (Chinese)
```

### Configuration Files
- **Routing**: [apps/web/src/i18n/routing.ts](file:///e:/Demo%20project/v-edfinance/apps/web/src/i18n/routing.ts#L4-L8) - Defines locales: `vi`, `en`, `zh`
- **Request Handling**: [apps/web/src/i18n/request.ts](file:///e:/Demo%20project/v-edfinance/apps/web/src/i18n/request.ts#L4-L15) - Dynamic message loading
- **Middleware**: [apps/web/middleware.ts](file:///e:/Demo%20project/v-edfinance/apps/web/middleware.ts#L5-L46) - Locale routing
- **Next.js Config**: [apps/web/next.config.ts](file:///e:/Demo%20project/v-edfinance/apps/web/next.config.ts#L2-L15) - `next-intl` plugin integration

### Translation Key Structure

**Pattern**: `{Namespace}.{key}`

Example namespaces found:
- `Auth.*` - Authentication strings
- `Common.*` - Shared UI strings
- `Navigation.*` - Menu/nav items
- `Dashboard.*` - Dashboard-specific
- `Courses.*` - Course-related
- `Video.*` - Video player controls
- `Gamification.*` - Game mechanics
- `Social.*` - Community features

**Video namespace keys** (relevant for epic):
```json
"Video": {
  "play": "Play/Phát/播放",
  "pause": "Pause/Tạm dừng/暂停",
  "mute": "Mute/Tắt tiếng/静音",
  "unmute": "Unmute/Bật tiếng/取消静音",
  "fullscreen": "Fullscreen/Toàn màn hình/全屏",
  "exitFullscreen": "Exit Fullscreen/Thoát toàn màn hình/退出全屏",
  "pictureInPicture": "Picture-in-Picture/Hình trong hình/画中画",
  "speed": "Playback Speed/Tốc độ phát/播放速度",
  "volume": "Volume/Âm lượng/音量",
  "thumbnailAlt": "Video thumbnail/Hình thu nhỏ video/视频缩略图"
}
```

### Existing aria-label Keys

**Current usage** (from Grep search):
- `aria-label="breadcrumb"` - Hardcoded in breadcrumb.tsx
- `aria-label="Close sidebar"` - Hardcoded in Sidebar.tsx
- `aria-label="More options"` - Hardcoded in Sidebar.tsx
- `aria-label={t('togglePlaylist')}` - **i18n pattern** in VideoPlaylist.tsx
- `aria-label={t('play')}` - **i18n pattern** in VideoControls.tsx
- `aria-label={isPlaying ? t('pause') : t('play')}` - Dynamic with i18n

**Gap**: Some components use hardcoded English aria-labels, others use i18n. **Recommendation**: Standardize on i18n for all aria-labels.

### Missing Accessibility Keys

For carousel navigation epic (ved-pd8l), these keys **do NOT exist** yet:
- `Video.previousVideo` / `nextVideo` / `selectVideo`
- `Video.carouselNavigation`
- `Video.videoThumbnail`
- `Video.playlistPosition` (e.g., "Video 3 of 10")

**Action Required**: Add to all 3 locale files (vi/en/zh).

---

## 2. Mobile Breakpoints

### Tailwind Configuration

**No custom Tailwind config found** in `apps/web/`. Project likely uses **default Tailwind CSS v4 breakpoints**:

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Small tablets/large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktops |
| `xl` | 1280px | Large desktops |
| `2xl` | 1536px | Extra large screens |

**Reference**: [tailwind.config.js from claudekit-marketing](file:///e:/Demo%20project/v-edfinance/libs/claudekit-marketing/.claude/skills/marketing-dashboard/app/tailwind.config.js) (external example, NOT project config)

### Responsive Design Patterns

From [apps/web/package.json](file:///e:/Demo%20project/v-edfinance/apps/web/package.json):
- **Radix UI components** - Built-in responsive support
- **Tailwind CSS 4.0** - Mobile-first framework
- **next-intl** - RTL/LTR support (important for i18n)

**Mobile-first approach**: Default styles = mobile, breakpoints add complexity.

---

## 3. Touch Target Requirements

### WCAG AA Standards

**Target Size**: [WCAG 2.1 Success Criterion 2.5.5](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- Minimum: **44×44 CSS pixels** (Level AAA)
- Recommended: **48×48px** for better UX (Google Material Design)

**No explicit WCAG documentation** found in `docs/` or codebase.

### Current Implementation

**Existing components** (from Grep search):
- [VideoControls.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/atoms/VideoControls.tsx) - Likely uses icon buttons (verify size)
- [VideoPlaylist.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/organisms/VideoPlaylist.tsx) - Playlist controls

**Gap**: No evidence of enforced touch target sizes in existing code.

### Recommendations for ved-pd8l

For carousel thumbnails:
- **Desktop**: Thumbnails can be smaller (e.g., 120×68px)
- **Mobile**: Touch targets MUST be ≥48×48px
  - Option 1: Increase thumbnail size on mobile
  - Option 2: Add transparent hit area around thumbnail

**Tailwind pattern**:
```tsx
<button className="p-2 min-w-[48px] min-h-[48px]"> {/* 48px min touch */}
  <img className="w-[120px] h-[68px]" /> {/* Visual size */}
</button>
```

---

## 4. Accessibility Testing Tools

### Available in package.json

**Frontend** ([apps/web/package.json](file:///e:/Demo%20project/v-edfinance/apps/web/package.json#L44-L60)):
- `@playwright/test` ✅ - Can test keyboard navigation
- `@testing-library/react` ✅ - Supports aria query utilities
- `@testing-library/jest-dom` ✅ - Assertions for accessibility

**Missing**:
- ❌ `axe-core` - Not installed
- ❌ `eslint-plugin-jsx-a11y` - Not installed
- ❌ `@axe-core/playwright` - Not installed

### Testing Capability

**What we CAN test** (with existing tools):
- Keyboard navigation (Playwright)
- Screen reader text (Testing Library `getByRole`, `getByLabelText`)
- Focus management (`:focus-visible` CSS)

**What we CANNOT test** (without axe-core):
- Automated WCAG compliance scanning
- Color contrast ratios
- ARIA attribute validation

### Recommendation

**For ved-pd8l**: Use existing Playwright tests for:
1. Keyboard arrows navigate carousel
2. Focus indicators visible
3. aria-labels present on all controls

**For future**: Consider adding `@axe-core/playwright` for automated a11y scans.

---

## 5. Epic-Specific Constraints

### ved-pd8l Requirements

**Carousel navigation** needs:
1. **i18n keys** for all aria-labels (add to vi/en/zh)
2. **Touch targets** ≥48×48px on mobile (`min-w-[48px] min-h-[48px]`)
3. **Keyboard navigation** (left/right arrows)
4. **Focus management** (visible focus rings)
5. **Screen reader announcements** (e.g., "Video 3 of 10")

### Critical Files to Check

Before implementing:
- [VideoControls.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/atoms/VideoControls.tsx#L98) - Existing keyboard shortcuts pattern
- [VideoPlaylist.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/organisms/VideoPlaylist.tsx#L214) - Existing aria-label pattern with i18n
- [vi.json](file:///e:/Demo%20project/v-edfinance/apps/web/src/messages/vi.json#L281-L297) - Video namespace (add new keys here)

---

## 6. Summary

### i18n Setup
- ✅ next-intl configured (vi/en/zh)
- ✅ Video namespace exists
- ❌ Carousel-specific keys missing (need to add)
- ⚠️ Inconsistent aria-label i18n (some hardcoded)

### Mobile Breakpoints
- ✅ Tailwind CSS v4 defaults (640/768/1024/1280/1536px)
- ✅ Mobile-first approach
- ❌ No custom breakpoints documented

### Touch Targets
- ⚠️ WCAG AA target: 48×48px (recommendation, not enforced)
- ❌ No touch target size enforcement in existing code
- 📝 Pattern exists: `min-w-[48px] min-h-[48px]` via Tailwind

### Testing Tools
- ✅ Playwright + Testing Library available
- ❌ axe-core NOT installed
- ✅ Can test keyboard nav + aria-labels manually

---

## Next Steps

1. **Add i18n keys** to `vi.json`, `en.json`, `zh.json`:
   ```json
   "Video": {
     "previousVideo": "...",
     "nextVideo": "...",
     "videoOf": "Video {current} of {total}",
     "selectVideo": "Select video {index}"
   }
   ```

2. **Implement carousel** with:
   - Touch targets: `min-w-12 min-h-12` (48px)
   - Keyboard nav: `useEffect` hook for arrow keys
   - aria-labels: Use i18n keys

3. **Test** with Playwright:
   - Keyboard navigation works
   - Touch targets ≥48px on mobile breakpoint
   - Screen reader labels present

---

**Discovery Complete** ✅  
**File**: [discovery-constraints.md](file:///e:/Demo%20project/v-edfinance/history/ved-pd8l/discovery-constraints.md)
