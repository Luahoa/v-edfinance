'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { BookOpen, TrendingUp, Award, Zap, ListTodo, Users, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { DashboardStats, Post as SocialPostType, BuddyGroup } from '@/types';

const AiMentor = dynamic(() => import('@/components/AiMentor'), {
  loading: () => <div className="h-32 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl" />,
});
const InteractiveChecklist = dynamic(() => import('@/components/organisms/InteractiveChecklist'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl" />,
  });
  const SocialFeed = dynamic(() => import('@/components/organisms/SocialFeed').then(mod => mod.SocialFeed), {
  loading: () => <div className="h-96 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl" />,
  });
  const BuddyRecommendations = dynamic(() => import('@/components/molecules/BuddyRecommendations').then(mod => mod.BuddyRecommendations), {
  loading: () => <div className="h-48 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl" />,
  });
  const QuickActions = dynamic(() => import('@/components/molecules/QuickActions'), {
  loading: () => <div className="h-24 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl" />,
  });
  const NudgeBanner = dynamic(() => import('@/components/molecules/NudgeBanner'), {
  loading: () => <div className="h-20 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl" />,
  });

export default function Dashboard() {
  const t = useTranslations('Dashboard');
  const ts = useTranslations('Social');
  const { token } = useAuthStore();
  const { trackEvent } = useAnalytics();
  
  const [stats, setStats] = useState<(DashboardStats & { streak?: number }) | null>(null);
  const [feedPosts, setFeedPosts] = useState<SocialPostType[]>([]);
  const [recommendations, setRecommendations] = useState<BuddyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Track page view
    trackEvent('VIEW_DASHBOARD', 'PAGE_VIEW');

    // Cleanup for time spent tracking
    return () => {
      const duration = Date.now() - startTime;
      trackEvent('LEAVE_DASHBOARD', 'PAGE_VIEW', { duration }, duration);
    };
  }, [startTime, trackEvent]);

  useEffect(() => {
    // Wait for hydration if using zustand persist
    const checkAuth = async () => {
      if (!token) {
        // Give it a moment to hydrate from localStorage
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!useAuthStore.getState().token) {
          console.log('No token found in Dashboard, redirecting...');
          setLoading(false); // Stop loading to show "Welcome" which might be handled by middleware anyway
          return;
        }
      }
    };
    checkAuth();

    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      try {
        const [statsRes, feedRes, recsRes] = await Promise.all([
          fetch(`${API_URL}/users/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/social/feed?limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/social/recommendations`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (feedRes.ok) setFeedPosts(await feedRes.json());
        if (recsRes.ok) setRecommendations(await recsRes.json());
      } catch (err) {
        console.error('Fetch dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 text-zinc-900 dark:text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold mb-8">{t('welcome')}!</h1>
        
        <NudgeBanner />
        <QuickActions />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<BookOpen className="text-blue-600" />} title={t('enrolledCourses')} value={stats?.enrolledCoursesCount || 0} />
          <StatCard icon={<TrendingUp className="text-green-600" />} title={t('completedLessons')} value={stats?.completedLessonsCount || 0} />
          <StatCard icon={<Zap className="text-purple-600" />} title={t('points')} value={stats?.points || 0} />
          <StatCard 
            icon={<Award className="text-yellow-600" />} 
            title="Streak" 
            value={stats?.streak || 0} 
            testId="streak-counter"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border bg-white p-6 dark:bg-zinc-900 dark:border-zinc-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ListTodo className="text-blue-600" size={20} />
                {t('interactiveChecklist')}
              </h2>
              <InteractiveChecklist />
            </div>

            <div className="rounded-xl border bg-white p-6 dark:bg-zinc-900 dark:border-zinc-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="text-amber-600" size={20} />
                {ts('feed')}
              </h2>
              <SocialFeed initialPosts={feedPosts} />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <BuddyRecommendations recommendations={recommendations} />
            <AiMentor />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, testId }: { icon: React.ReactNode; title: string; value: string | number; testId?: string }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800" data-testid={testId}>
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">{icon}</div>
        <div>
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
