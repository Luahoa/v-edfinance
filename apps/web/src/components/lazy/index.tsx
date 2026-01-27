'use client';

import dynamic from 'next/dynamic';
import { 
  SocialFeedSkeleton, 
  BuddyCardSkeleton, 
  AiMentorSkeleton 
} from '@/components/atoms/Skeleton';

// Lazy-loaded components with Skeleton fallbacks
// These are below-fold on Dashboard and loaded on demand

export const LazySocialFeed = dynamic(
  () => import('@/components/organisms/SocialFeed').then(mod => ({ default: mod.SocialFeed })),
  {
    loading: () => <SocialFeedSkeleton />,
    ssr: true, // Still SSR the content, but lazy load client JS
  }
);

export const LazyBuddyRecommendations = dynamic(
  () => import('@/components/molecules/BuddyRecommendations').then(mod => ({ default: mod.BuddyRecommendations })),
  {
    loading: () => <BuddyCardSkeleton />,
    ssr: true,
  }
);

export const LazyAiMentor = dynamic(
  () => import('@/components/AiMentor'),
  {
    loading: () => <AiMentorSkeleton />,
    ssr: false, // AiMentor needs auth, no point SSRing
  }
);

export const LazyInteractiveChecklist = dynamic(
  () => import('@/components/organisms/InteractiveChecklist'),
  {
    loading: () => (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 animate-pulse">
            <div className="h-5 w-5 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 flex-1 bg-zinc-200 dark:bg-zinc-700 rounded" />
          </div>
        ))}
      </div>
    ),
    ssr: true,
  }
);

export const LazyQuickActionsGrid = dynamic(
  () => import('@/components/organisms/QuickActionsGrid').then(mod => ({ default: mod.QuickActionsGrid })),
  {
    loading: () => (
      <div className="mb-8">
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 animate-pulse">
              <div className="h-12 w-12 rounded-lg bg-zinc-200 dark:bg-zinc-700 mb-4" />
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
    ssr: true,
  }
);
