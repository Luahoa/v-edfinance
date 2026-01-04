# 01. Color System

**Core Principle:** Financial Growth & Trust with Urgent Alerts.

## Primary Palette: "Growth Green"
Symbolizes financial health, rice fields (prosperity), and positive movement.

| Token | Class | Hex | Usage |
|-------|-------|-----|-------|
| `primary-50` | `bg-green-50` | `#f0fdf4` | Backgrounds, subtle highlights |
| `primary-100` | `bg-green-100` | `#dcfce7` | Secondary buttons (hover) |
| `primary-500` | `bg-green-600` | `#16a34a` | **Primary Brand Color**, Main Buttons |
| `primary-600` | `bg-green-700` | `#15803d` | Button Hover, Active States |
| `primary-900` | `bg-green-900` | `#14532d` | Text on light backgrounds |

## Secondary Palette: "Trust Blue"
Symbolizes stability, banking, and security.

| Token | Class | Hex | Usage |
|-------|-------|-----|-------|
| `secondary-50` | `bg-blue-50` | `#eff6ff` | Info panels, neutral backgrounds |
| `secondary-500` | `bg-blue-600` | `#2563eb` | Links, Info icons, Trust badges |
| `secondary-900` | `bg-blue-900` | `#1e3a8a` | Headers, official notices |

## Alert Palette: "Loss Aversion Red"
Used for Nudge theory "Loss Aversion" triggers (e.g., streak loss warnings).

| Token | Class | Hex | Usage |
|-------|-------|-----|-------|
| `alert-50` | `bg-red-50` | `#fef2f2` | Error backgrounds |
| `alert-500` | `bg-red-600` | `#dc2626` | **Streak Warning**, Error Text, Delete |
| `alert-700` | `bg-red-700` | `#b91c1c` | Urgent Call-to-Action (Negative) |

## Semantic Usage (Light/Dark Mode)

We use `shadcn/ui` semantic tokens mapped to Tailwind colors.

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  /* Primary = Green-600 */
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 355.7 100% 97.3%;

  /* Destructive = Red-600 */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
 
  /* Primary = Green-500 (lighter for dark mode) */
  --primary: 142.1 70.6% 45.3%;
  --primary-foreground: 144.9 80.4% 10%;
}
```
