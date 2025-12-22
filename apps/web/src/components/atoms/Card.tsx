import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'bordered' | 'glass' | 'gradient';
  glowOnHover?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Card Component - Foundation for content containers
 *
 * Variants:
 * - default: Standard card with border
 * - elevated: Shadow-based depth
 * - bordered: Emphasized border
 * - glass: Glassmorphism effect
 * - gradient: Gradient border (premium feel)
 */
export function Card({
  children,
  variant = 'default',
  glowOnHover = false,
  className,
  onClick,
}: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800',
    elevated: 'bg-white dark:bg-zinc-900 shadow-lg border border-transparent',
    bordered: 'bg-white dark:bg-zinc-900 border-2 border-blue-500 dark:border-blue-600',
    glass:
      'bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/20 dark:border-zinc-800/20',
    gradient:
      'bg-white dark:bg-zinc-900 relative overflow-hidden before:absolute before:inset-0 before:p-[2px] before:rounded-xl before:bg-gradient-to-br before:from-blue-500 before:via-purple-500 before:to-pink-500 before:-z-10',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-6 transition-all duration-200',
        variants[variant],
        glowOnHover && 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-blue-400',
        onClick && 'cursor-pointer hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-zinc-900 dark:text-zinc-100', className)}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return <p className={cn('text-sm text-zinc-600 dark:text-zinc-400', className)}>{children}</p>;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800', className)}>
      {children}
    </div>
  );
}
