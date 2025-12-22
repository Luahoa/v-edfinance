'use client';

import { Badge } from '@/components/atoms/Badge';
import { cn } from '@/lib/cn';
import { Share2, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti-explosion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  category?: string;
}

interface AchievementCelebrationProps {
  achievement: Achievement;
  onClose: () => void;
  autoClose?: number; // ms
}

/**
 * Achievement Celebration Modal
 *
 * Behavioral Economics Principles:
 * - Variable Reward: Unexpected celebration triggers dopamine
 * - Social Sharing: Leverages social proof desire
 * - Visual Feedback: Confetti + glow reinforces success
 * - Rarity System: Creates FOMO and achievement hierarchy
 */
export function AchievementCelebration({
  achievement,
  onClose,
  autoClose = 5000,
}: AchievementCelebrationProps) {
  const [show, setShow] = useState(false);
  const [confettiActive, setConfettiActive] = useState(true);

  useEffect(() => {
    setShow(true);

    const confettiTimer = setTimeout(() => {
      setConfettiActive(false);
    }, 3000);

    if (autoClose) {
      const closeTimer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, autoClose);

      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(closeTimer);
      };
    }

    return () => clearTimeout(confettiTimer);
  }, [autoClose, onClose]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const handleShare = () => {
    // Social sharing logic
    const text = `🎉 I just unlocked "${achievement.title}" on V-EdFinance! ${achievement.points} points earned!`;

    if (navigator.share) {
      navigator.share({
        title: 'Achievement Unlocked!',
        text,
        url: window.location.href,
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Achievement copied to clipboard!');
    }
  };

  const rarityConfig = {
    common: {
      gradient: 'from-gray-500 to-gray-600',
      glow: 'shadow-[0_0_30px_rgba(107,114,128,0.5)]',
      confettiCount: 50,
      label: 'Common',
      color: 'text-gray-600',
    },
    rare: {
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.6)]',
      confettiCount: 80,
      label: 'Rare',
      color: 'text-blue-600',
    },
    epic: {
      gradient: 'from-purple-500 to-purple-600',
      glow: 'shadow-[0_0_40px_rgba(168,85,247,0.7)]',
      confettiCount: 120,
      label: 'Epic',
      color: 'text-purple-600',
    },
    legendary: {
      gradient: 'from-yellow-400 via-orange-500 to-red-500',
      glow: 'shadow-[0_0_50px_rgba(245,158,11,0.8)]',
      confettiCount: 200,
      label: 'Legendary',
      color: 'text-yellow-600',
    },
  };

  const config = rarityConfig[achievement.rarity];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          show ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-8 pointer-events-auto transition-all duration-300',
            show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          )}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Confetti Effect */}
          {confettiActive && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <Confetti
                particleCount={config.confettiCount}
                duration={3000}
                force={0.6}
                width={400}
              />
            </div>
          )}

          {/* Content */}
          <div className="text-center space-y-6 py-4">
            {/* Achievement Icon with Glow */}
            <div className="relative mx-auto w-32 h-32">
              {/* Glow Effect */}
              <div
                className={cn(
                  'absolute inset-0 rounded-full blur-2xl opacity-70',
                  `bg-gradient-to-br ${config.gradient}`,
                  config.glow
                )}
              />
              {/* Icon Container */}
              <div
                className={cn(
                  'relative w-full h-full rounded-full flex items-center justify-center text-6xl',
                  `bg-gradient-to-br ${config.gradient}`,
                  'transform transition-transform hover:scale-110 animate-pulse'
                )}
              >
                {achievement.icon}
              </div>
            </div>

            {/* Achievement Info */}
            <div className="space-y-2">
              <Badge
                variant={achievement.rarity === 'legendary' ? 'warning' : 'primary'}
                size="sm"
                className="uppercase tracking-wider font-bold"
              >
                {config.label} Achievement Unlocked
              </Badge>

              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {achievement.title}
              </h2>

              <p className="text-zinc-600 dark:text-zinc-400">{achievement.description}</p>

              {achievement.category && (
                <Badge variant="default" size="sm">
                  {achievement.category}
                </Badge>
              )}
            </div>

            {/* Points Earned */}
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
              <Zap className="w-8 h-8 fill-current" />
              <span>+{achievement.points}</span>
              <span className="text-lg font-normal text-zinc-600 dark:text-zinc-400">Points</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center pt-4">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Continue Learning
              </button>
              <button
                onClick={handleShare}
                className="px-6 py-3 border-2 border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl transition-colors flex items-center gap-2 font-semibold"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Achievement Toast Notification
 * Lighter version for less important achievements
 */
interface AchievementToastProps {
  achievement: Omit<Achievement, 'description'>;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 bg-white dark:bg-zinc-900 border-2 border-blue-500 rounded-xl shadow-2xl p-4 max-w-sm transition-all duration-300',
        show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-center gap-4">
        <div className="text-4xl">{achievement.icon}</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            Achievement Unlocked!
          </p>
          <p className="font-bold text-zinc-900 dark:text-zinc-100">{achievement.title}</p>
          <div className="flex items-center gap-2 mt-1 text-sm text-purple-600 dark:text-purple-400">
            <Zap className="w-3 h-3 fill-current" />
            <span>+{achievement.points} Points</span>
          </div>
        </div>
        <button
          onClick={() => {
            setShow(false);
            setTimeout(onDismiss, 300);
          }}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Achievement Progress Card
 * Shows progress toward next achievement
 */
interface AchievementProgressProps {
  current: number;
  target: number;
  title: string;
  icon: string;
  reward: number;
}

export function AchievementProgress({
  current,
  target,
  title,
  icon,
  reward,
}: AchievementProgressProps) {
  const progress = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {remaining === 0 ? 'Complete!' : `${remaining} more to go`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">+{reward}</p>
          <p className="text-xs text-zinc-500">Points</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
        {current} / {target} ({Math.round(progress)}%)
      </p>
    </div>
  );
}
