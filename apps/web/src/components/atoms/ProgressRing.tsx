'use client';

import { cn } from '@/lib/cn';
import { useEffect, useState } from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'amber';
  strokeWidth?: number;
  className?: string;
  animated?: boolean;
}

/**
 * ProgressRing Component - Circular progress indicator
 *
 * Perfect for:
 * - Course completion
 * - Skill mastery
 * - Goal tracking
 * - Gamification metrics
 */
export function ProgressRing({
  progress,
  size = 'md',
  showLabel = true,
  color = 'blue',
  strokeWidth,
  className,
  animated = true,
}: ProgressRingProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Animate progress on mount
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    }
    setDisplayProgress(progress);
  }, [progress, animated]);

  const sizes = {
    sm: { ring: 60, stroke: 4, text: 'text-sm' },
    md: { ring: 100, stroke: 6, text: 'text-xl' },
    lg: { ring: 140, stroke: 8, text: 'text-3xl' },
    xl: { ring: 180, stroke: 10, text: 'text-4xl' },
  };

  const { ring, stroke: defaultStroke, text } = sizes[size];
  const stroke = strokeWidth || defaultStroke;
  const radius = (ring - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayProgress / 100) * circumference;

  const colors = {
    blue: 'stroke-blue-600 dark:stroke-blue-500',
    green: 'stroke-green-500 dark:stroke-green-400',
    purple: 'stroke-purple-500 dark:stroke-purple-400',
    amber: 'stroke-amber-500 dark:stroke-amber-400',
  };

  const glowColors = {
    blue: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
    green: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]',
    purple: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]',
    amber: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={ring} height={ring} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-zinc-200 dark:text-zinc-800"
        />
        {/* Progress Circle */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(colors[color], glowColors[color], 'transition-all duration-1000 ease-out')}
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold text-zinc-900 dark:text-zinc-100', text)}>
            {Math.round(displayProgress)}%
          </span>
        </div>
      )}
    </div>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  color?: 'blue' | 'green' | 'purple' | 'amber';
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

/**
 * ProgressBar Component - Linear progress indicator
 * Alternative to ProgressRing for horizontal layouts
 */
export function ProgressBar({
  progress,
  color = 'blue',
  showLabel = true,
  height = 'md',
  className,
  animated = true,
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    }
    setDisplayProgress(progress);
  }, [progress, animated]);

  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colors = {
    blue: 'bg-blue-600 dark:bg-blue-500',
    green: 'bg-green-500 dark:bg-green-400',
    purple: 'bg-purple-500 dark:bg-purple-400',
    amber: 'bg-amber-500 dark:bg-amber-400',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Progress</span>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {Math.round(displayProgress)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden',
          heights[height]
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-1000 ease-out', colors[color])}
          style={{ width: `${displayProgress}%` }}
        />
      </div>
    </div>
  );
}
