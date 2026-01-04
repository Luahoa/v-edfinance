# 03. Spacing & Layout System

Based on the 4px grid system (Tailwind default).

## Spacing Scale

| Token | Pixels | Usage |
|-------|--------|-------|
| `0.5` | 2px | Micro-spacing (borders, tight grouping) |
| `1` | 4px | Icon gaps, tight labels |
| `2` | 8px | **Base Unit**. Button padding, small gaps. |
| `3` | 12px | Inputs padding, card internal spacing (small) |
| `4` | 16px | **Standard Component Padding**. Card body, default gaps. |
| `6` | 24px | Section gaps (internal), Large button padding |
| `8` | 32px | Section separators (small) |
| `12` | 48px | Section separators (medium) |
| `16` | 64px | **Major Section Breaks** |
| `20` | 80px | Hero section padding |

## Layout Containers

We use a centered container strategy for readability on large screens.

```tsx
// Default Container
<div className="container mx-auto px-4 max-w-7xl">
  {/* Content */}
</div>

// Readable Text Container (e.g., Blog/Lesson)
<div className="container mx-auto px-4 max-w-3xl">
  {/* Long form text */}
</div>
```

## Z-Index Scale

Defined in `tailwind.config.ts` to prevent stacking context wars.

- `z-0`: Default
- `z-10`: Dropdowns, Tooltips (local)
- `z-40`: Sticky Headers
- `z-50`: Modals, Dialogs, Drawers
- `z-100`: Toasts, Notifications (Always on top)

## Responsive Breakpoints

Mobile-first approach.

- `sm`: 640px (Tablets portrait / Large phones)
- `md`: 768px (Tablets landscape)
- `lg`: 1024px (Laptops)
- `xl`: 1280px (Desktops)
- `2xl`: 1536px (Large screens)
