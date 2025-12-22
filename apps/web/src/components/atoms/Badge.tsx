import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: ReactNode;
}

/**
 * Badge Component - Status indicators and labels
 *
 * Used for:
 * - Achievement badges
 * - Status labels
 * - Category tags
 * - Notification counts
 */
export function Badge({ children, variant = 'default', size = 'md', className, icon }: BadgeProps) {
  const variants = {
    default: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    primary: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    accent: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

interface BadgeGroupProps {
  children: ReactNode;
  className?: string;
}

export function BadgeGroup({ children, className }: BadgeGroupProps) {
  return <div className={cn('flex flex-wrap gap-2', className)}>{children}</div>;
}
