'use client';

import { cn } from '@/lib/cn';
import type { NudgeConfig } from '@/lib/nudge-engine';
import { useNudgeEngine } from '@/lib/nudge-engine';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertCircle, ChevronRight, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Smart Nudge Banner
 *
 * Behavioral Economics Implementation:
 * - Priority-based nudge selection
 * - Frequency controls (don't annoy users)
 * - A/B testing ready
 * - Analytics tracking
 */
export function SmartNudgeBanner() {
  const [nudge, setNudge] = useState<(NudgeConfig & { data?: Record<string, unknown> }) | null>(
    null
  );
  const [visible, setVisible] = useState(false);
  const { token } = useAuthStore();
  const { getTopNudge, dismissNudge, trackInteraction } = useNudgeEngine();

  useEffect(() => {
    // Initialize session tracking
    if (!sessionStorage.getItem('sessionStart')) {
      sessionStorage.setItem('sessionStart', new Date().toISOString());
    }

    // Fetch user data and determine nudge
    const fetchNudge = async () => {
      if (!token) return;

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        // Fetch user stats for nudge decision-making
        const response = await fetch(`${API_URL}/users/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const userData = await response.json();

        // Get personalized nudge
        const selectedNudge = await getTopNudge({
          ...userData,
          lastActiveDate: localStorage.getItem('lastActiveDate') || new Date().toDateString(),
        });

        if (selectedNudge) {
          const nudgeWithData = {
            ...selectedNudge,
            data: userData,
          };

          setNudge(nudgeWithData);
          setVisible(true);

          // Track nudge shown
          trackInteraction(selectedNudge.type, 'shown');
        }
      } catch (error) {
        console.error('Failed to fetch nudge:', error);
      }
    };

    fetchNudge();

    // Update last active date
    localStorage.setItem('lastActiveDate', new Date().toDateString());
  }, [token, getTopNudge, trackInteraction]);

  const handleDismiss = () => {
    if (!nudge) return;

    setVisible(false);
    dismissNudge(nudge.type);
    trackInteraction(nudge.type, 'dismissed');

    setTimeout(() => setNudge(null), 300);
  };

  const handleAction = () => {
    if (!nudge) return;

    trackInteraction(nudge.type, 'clicked');
    window.location.href = nudge.action.href;
  };

  if (!nudge || !visible) return null;

  const variants = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      icon: AlertCircle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-900 dark:text-green-100',
      icon: Info,
      iconColor: 'text-green-600 dark:text-green-400',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-900 dark:text-red-100',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
    },
  };

  const config = variants[nudge.variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 mb-6 flex items-center gap-4 transition-all duration-300 animate-in slide-in-from-top',
        config.bg,
        config.border,
        config.text
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      {nudge.icon ? (
        <span className="text-2xl flex-shrink-0">{nudge.icon}</span>
      ) : (
        <Icon className={cn('w-5 h-5 flex-shrink-0', config.iconColor)} />
      )}

      {/* Message */}
      <p className="flex-1 font-medium text-sm sm:text-base">{nudge.message(nudge.data || {})}</p>

      {/* Action Button */}
      <button
        onClick={handleAction}
        className={cn(
          'flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105',
          'bg-white dark:bg-zinc-800 border-2',
          config.border,
          config.text,
          'hover:shadow-md'
        )}
      >
        <span className="hidden sm:inline">{nudge.action.label}</span>
        <ChevronRight className="w-4 h-4 sm:ml-1 inline" />
      </button>

      {/* Dismiss Button */}
      {nudge.dismissable && (
        <button
          onClick={handleDismiss}
          className={cn('flex-shrink-0 p-1 rounded transition-colors', config.iconColor)}
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

/**
 * Persistent Nudge Indicator
 * Small indicator that stays visible even after main nudge is dismissed
 */
export function NudgeIndicator() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Count active nudges (simplified)
    const incompleteLessons = Number.parseInt(localStorage.getItem('incompleteLessons') || '0');
    setCount(incompleteLessons);
  }, []);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button className="relative bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform animate-bounce">
        <AlertCircle className="w-6 h-6" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}
