/**
 * V-EdFinance Design Tokens
 *
 * Unified design system combining:
 * - Fintech trust & security (Blue)
 * - EdTech growth & learning (Green/Purple)
 * - Behavioral economics (Amber for nudges)
 */

export const tokens = {
  // Color Palette: Fintech + EdTech Hybrid
  colors: {
    // Primary: Trust & Security (Blue)
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6', // Main brand
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
      950: '#172554',
    },

    // Secondary: Growth & Success (Green)
    secondary: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E', // Achievement, streak
      600: '#16A34A',
      700: '#15803D',
      800: '#166534',
      900: '#14532D',
      950: '#052E16',
    },

    // Accent: Energy & Gamification (Purple)
    accent: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7', // Rewards, points
      600: '#9333EA',
      700: '#7E22CE',
      800: '#6B21A8',
      900: '#581C87',
      950: '#3B0764',
    },

    // Warning: Loss Aversion & Nudges (Amber)
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B', // Nudges, alerts
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
      950: '#451A03',
    },

    // Danger: Critical Actions (Red)
    danger: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      500: '#EF4444',
      700: '#B91C1C',
      900: '#7F1D1D',
    },

    // Neutral: Professional Base
    neutral: {
      50: '#FAFAFA',
      100: '#F4F4F5',
      200: '#E4E4E7',
      300: '#D4D4D8',
      400: '#A1A1AA',
      500: '#71717A',
      600: '#52525B',
      700: '#3F3F46',
      800: '#27272A',
      900: '#18181B',
      950: '#09090B',
    },
  },

  // Typography: Educational & Approachable
  typography: {
    fonts: {
      display: '"Inter", "SF Pro Display", -apple-system, system-ui, sans-serif',
      body: '"Inter", -apple-system, system-ui, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
    },
    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem', // 72px
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },

  // Spacing: 8px Grid System
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem', // 2px
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    32: '8rem', // 128px
  },

  // Shadows: Depth & Elevation
  shadows: {
    none: 'none',
    default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  },

  // Borders & Radius
  borders: {
    width: {
      0: '0',
      1: '1px',
      2: '2px',
      4: '4px',
      8: '8px',
    },
    radius: {
      none: '0',
      sm: '0.375rem', // 6px
      base: '0.5rem', // 8px
      md: '0.5rem', // 8px
      lg: '0.75rem', // 12px
      xl: '1rem', // 16px
      '2xl': '1.5rem', // 24px
      '3xl': '2rem', // 32px
      full: '9999px',
    },
  },

  // Animation: Smooth & Professional
  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      base: '200ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
    },
    easing: {
      linear: 'linear',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },

  // Breakpoints: Mobile-First
  breakpoints: {
    sm: '640px', // Mobile landscape
    md: '768px', // Tablet
    lg: '1024px', // Desktop
    xl: '1280px', // Large desktop
    '2xl': '1536px', // Extra large
  },

  // Z-Index: Layering System
  zIndex: {
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
    toast: 1500,
  },

  // Opacity
  opacity: {
    0: '0',
    5: '0.05',
    10: '0.1',
    20: '0.2',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    80: '0.8',
    90: '0.9',
    95: '0.95',
    100: '1',
  },
} as const;

// Semantic Color Mappings for Context
export const semanticColors = {
  background: {
    primary: tokens.colors.neutral[50],
    primaryDark: tokens.colors.neutral[950],
    secondary: tokens.colors.neutral[100],
    secondaryDark: tokens.colors.neutral[900],
  },
  text: {
    primary: tokens.colors.neutral[900],
    primaryDark: tokens.colors.neutral[50],
    secondary: tokens.colors.neutral[600],
    secondaryDark: tokens.colors.neutral[400],
    muted: tokens.colors.neutral[500],
  },
  border: {
    default: tokens.colors.neutral[200],
    defaultDark: tokens.colors.neutral[800],
    focus: tokens.colors.primary[500],
  },
  status: {
    success: tokens.colors.secondary[500],
    warning: tokens.colors.warning[500],
    error: tokens.colors.danger[500],
    info: tokens.colors.primary[500],
  },
} as const;

// Behavioral Economics Color Mapping
export const behavioralColors = {
  nudge: {
    streak: tokens.colors.warning[500], // Loss aversion (amber)
    social: tokens.colors.primary[500], // Social proof (blue)
    achievement: tokens.colors.secondary[500], // Positive reinforcement (green)
    milestone: tokens.colors.accent[500], // Reward anticipation (purple)
  },
  gamification: {
    points: tokens.colors.accent[500],
    level: tokens.colors.primary[600],
    reward: tokens.colors.secondary[500],
    streak: tokens.colors.warning[500],
  },
} as const;

// Helper function to get color value
export function getColor(path: string): string {
  const parts = path.split('.');
  let value: unknown = tokens;

  for (const part of parts) {
    value = (value as any)[part];
    if (value === undefined) return '';
  }

  return String(value);
}

// Export types for TypeScript
export type ColorScale = keyof typeof tokens.colors;
export type ColorShade = keyof typeof tokens.colors.primary;
export type Spacing = keyof typeof tokens.spacing;
export type FontSize = keyof typeof tokens.typography.sizes;
export type FontWeight = keyof typeof tokens.typography.weights;
