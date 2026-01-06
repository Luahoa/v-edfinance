# Spike: CommandPalette Focus Trap Implementation

**Epic**: ved-pd8l  
**Date**: 2026-01-07  
**Time-box**: 30 minutes  
**Duration**: 8 minutes  

---

## ANSWER: YES ✅

**Can we implement focus trap safely?** YES - Focus trap can be implemented without breaking existing keyboard shortcuts.

---

## CONFIDENCE: HIGH

**Rationale**:
1. **Radix Dialog already installed** (`@radix-ui/react-dialog@1.1.15`)
2. **Radix Dialog has built-in focus trap** - No additional library needed
3. **Current implementation is custom** - Uses manual state management + framer-motion
4. **Keyboard shortcuts are component-internal** - Won't conflict with dialog focus trap

---

## CURRENT STATE ANALYSIS

### Does CommandPalette.tsx currently trap focus?
**NO** - Current implementation has:
- ✅ Backdrop click-to-close
- ✅ Escape key handler
- ✅ CMD+K toggle
- ❌ **NO focus trap** - Tab key can escape to underlying page
- ❌ **NO keyboard navigation** - Arrow keys don't work (footer claims they do)
- ❌ **NO auto-focus on input** - User must click input field

**File**: [CommandPalette.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/organisms/CommandPalette.tsx)

### Does it use radix-dialog or similar primitive?
**NO** - Current implementation:
- Uses **custom modal** with framer-motion (`AnimatePresence`)
- Uses **manual keyboard event listeners** (lines 43-56)
- Uses **manual state management** (`useState`)

### Available Radix Dialog (Already Installed)
**YES** - Project has:
- `@radix-ui/react-dialog@1.1.15` in package.json
- [Dialog component](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/ui/dialog.tsx) already exists
- [CommandDialog wrapper](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/ui/command.tsx#L26-L36) exists using Dialog + cmdk

**Radix Dialog Features** (built-in):
- ✅ Focus trap (automatic)
- ✅ Escape key handling
- ✅ Click-outside-to-close
- ✅ Auto-focus on open
- ✅ Return focus on close
- ✅ Accessible (ARIA attributes)

---

## IMPLEMENTATION APPROACH

### Option 1: Use Existing CommandDialog (RECOMMENDED) ⭐
**Effort**: 1-2 hours  
**Risk**: LOW  

**Strategy**: Replace custom modal with `CommandDialog` from `ui/command.tsx`

```tsx
import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem } from '@/components/ui/command';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search commands..." />
      <CommandList>
        <CommandGroup heading="Navigation">
          {commands.map(cmd => (
            <CommandItem key={cmd.id} onSelect={() => handleSelect(cmd.href)}>
              <Icon /> {cmd.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

**Benefits**:
- ✅ **Focus trap automatic** (Radix Dialog)
- ✅ **Keyboard navigation** (cmdk primitive)
- ✅ **Accessible** (ARIA labels)
- ✅ **Design system consistency** (uses shadcn/ui patterns)
- ✅ **No new dependencies**

**Trade-offs**:
- ⚠️ Lose framer-motion animations (use Radix animations instead)
- ⚠️ Need to style CommandDialog to match current design

### Option 2: Add focus-trap-react to Custom Modal
**Effort**: 3-4 hours  
**Risk**: MEDIUM  

**Strategy**: Wrap custom modal in `<FocusTrap>`

```bash
pnpm add focus-trap-react@10.3.0
```

```tsx
import FocusTrap from 'focus-trap-react';

<FocusTrap active={isOpen}>
  <motion.div>
    {/* existing modal content */}
  </motion.div>
</FocusTrap>
```

**Benefits**:
- ✅ Keep framer-motion animations
- ✅ Keep current design exactly

**Trade-offs**:
- ⚠️ New dependency (focus-trap-react)
- ⚠️ Still need to implement keyboard navigation manually
- ⚠️ More code to maintain vs using Radix primitive

---

## DEPENDENCIES

### Option 1 (Recommended): No New Dependencies
**Already installed**:
- `@radix-ui/react-dialog@1.1.15` ✅
- `cmdk@1.1.1` ✅

**Files exist**:
- `apps/web/src/components/ui/dialog.tsx` ✅
- `apps/web/src/components/ui/command.tsx` ✅

### Option 2: New Dependency Required
**Install**:
```bash
pnpm add focus-trap-react@10.3.0
```

---

## ESTIMATE

### Option 1 (CommandDialog - RECOMMENDED)
**Total**: 1-2 hours

- Replace modal structure: 30 minutes
- Migrate state management: 15 minutes  
- Style CommandDialog to match design: 30 minutes
- Add keyboard shortcuts (CMD+K): 10 minutes
- Test keyboard navigation: 15 minutes
- Test focus trap: 10 minutes

### Option 2 (focus-trap-react)
**Total**: 3-4 hours

- Install focus-trap-react: 5 minutes
- Integrate FocusTrap: 30 minutes
- Implement arrow key navigation: 60 minutes
- Implement enter key selection: 20 minutes
- Test edge cases: 45 minutes
- Refactor for accessibility: 60 minutes

---

## RISKS

### Option 1: LOW RISK ✅
- ✅ **No breaking changes** - Keyboard shortcuts remain the same (CMD+K)
- ✅ **Design system aligned** - Uses shadcn/ui conventions
- ✅ **Well-tested primitive** - Radix Dialog used across app
- ✅ **Accessible by default** - ARIA labels built-in
- ⚠️ **Animation change** - Need to replace framer-motion (minor)

### Option 2: MEDIUM RISK ⚠️
- ⚠️ **New dependency** - Adds 20KB to bundle
- ⚠️ **Manual keyboard nav** - Must implement arrow key logic
- ⚠️ **Accessibility gaps** - Must add ARIA labels manually
- ⚠️ **More maintenance** - Custom code vs primitive

### Shared Risks: NONE 🎉
- ✅ **CMD+K won't break** - Both options preserve global keyboard listener
- ✅ **Escape key works** - Both options handle escape properly
- ✅ **Existing shortcuts safe** - Focus trap only active when modal open

---

## RECOMMENDATION

**Use Option 1: CommandDialog primitive**

**Reasoning**:
1. **Faster** (1-2 hours vs 3-4 hours)
2. **Lower risk** (uses existing primitive)
3. **Better accessibility** (ARIA labels built-in)
4. **Design system consistency** (shadcn/ui pattern)
5. **No new dependencies** (everything already installed)
6. **Keyboard navigation included** (cmdk handles arrow keys)

**Next Steps**:
1. Create bead: "Migrate CommandPalette to CommandDialog primitive"
2. Spike complete - findings confirm feasibility
3. Proceed with implementation using Option 1

---

## CODE REFERENCES

- **Current Component**: [CommandPalette.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/organisms/CommandPalette.tsx)
- **Target Primitive**: [command.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/ui/command.tsx#L26-L36)
- **Dialog Base**: [dialog.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/components/ui/dialog.tsx)
- **Usage Example**: [dashboard/layout.tsx](file:///e:/Demo%20project/v-edfinance/apps/web/src/app/[locale]/dashboard/layout.tsx#L19)

---

## APPENDIX: Radix Dialog Focus Trap Behavior

From Radix UI documentation:

> **Focus Management**
> - When the dialog opens, focus moves to the first focusable element
> - Tab and Shift+Tab cycle through focusable elements within the dialog
> - Focus is trapped - Tab from last element returns to first
> - When closed, focus returns to the trigger element
> - Supports `<DialogDescription>` and `<DialogTitle>` for screen readers

**This matches our requirements exactly** ✅

---

**Spike Complete** - Ready for implementation beads creation.
