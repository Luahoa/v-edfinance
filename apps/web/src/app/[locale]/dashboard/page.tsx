import { getTranslations } from 'next-intl/server';
import AiMentor from '@/components/AiMentor';
import InteractiveChecklist from '@/components/organisms/InteractiveChecklist';
import { SocialFeed } from '@/components/organisms/SocialFeed';
import { BuddyRecommendations } from '@/components/molecules/BuddyRecommendations';
import { BookOpen, TrendingUp, Award, Zap, ListTodo, Users } from 'lucide-react';
import { cookies } from 'next/headers';
import type { DashboardStats, Post as SocialPostType } from '@/types';

<<<<<<< Updated upstream
import { SmartNudgeBanner } from '@/components/molecules/SmartNudgeBanner';
import { QuickActionsGrid } from '@/components/organisms/QuickActionsGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuthStore } from '@/store/useAuthStore';
import type { BuddyGroup, DashboardStats, Post as SocialPostType } from '@/types';
import { Award, BookOpen, ListTodo, TrendingUp, Users, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Lazy load heavy components
const AiMentor = dynamic(() => import('@/components/AiMentor'), {
  loading: () => <Skeleton className="h-32 w-full rounded-xl" />,
});
const InteractiveChecklist = dynamic(() => import('@/components/organisms/InteractiveChecklist'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
});
const SocialFeed = dynamic(
  () => import('@/components/organisms/SocialFeed').then((mod) => mod.SocialFeed),
  {
    loading: () => <Skeleton className="h-96 w-full rounded-xl" />,
  }
);
const BuddyRecommendations = dynamic(
  () =>
    import('@/components/molecules/BuddyRecommendations').then((mod) => mod.BuddyRecommendations),
  {
    loading: () => <Skeleton className="h-48 w-full rounded-xl" />,
  }
);

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
    const checkAuth = async () => {
      if (!token) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!useAuthStore.getState().token) {
          setLoading(false);
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
          fetch(`${API_URL}/users/dashboard-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/social/feed?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/social/recommendations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
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
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
        <div className="container mx-auto max-w-7xl space-y-8">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-96 rounded-xl" />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
=======
async function getDashboardStats(): Promise<DashboardStats | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/dashboard-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error('Fetch dashboard stats error:', err);
    return null;
  }
}

async function getSocialFeed(): Promise<SocialPostType[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/social/feed?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 30 },
    });
    
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error('Fetch social feed error:', err);
    return [];
  }
}

async function getBuddyRecommendations(): Promise<BuddyGroup[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/social/recommendations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 300 }, // Recommend logic can be cached longer
    });
    
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error('Fetch recommendations error:', err);
    return [];
>>>>>>> Stashed changes
  }
}

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  await params;
  const t = await getTranslations('Dashboard');
  const ts = await getTranslations('Social');
  const stats = await getDashboardStats();
  const feedPosts = await getSocialFeed();
  const recommendations = await getBuddyRecommendations();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 text-zinc-900 dark:text-zinc-100">
<<<<<<< Updated upstream
      <div className="container mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{t('welcome')}!</h1>
          <span className="text-sm text-zinc-500">
            {new Date().toLocaleDateString('vi-VN', { dateStyle: 'full' })}
          </span>
        </div>

        <SmartNudgeBanner />
        <QuickActionsGrid />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<BookOpen className="text-blue-600" />}
            title={t('enrolledCourses')}
            value={stats?.enrolledCoursesCount || 0}
          />
          <StatCard
            icon={<TrendingUp className="text-green-600" />}
            title={t('completedLessons')}
            value={stats?.completedLessonsCount || 0}
          />
          <StatCard
            icon={<Zap className="text-purple-600" />}
            title={t('points')}
            value={stats?.points || 0}
          />
          <StatCard
            icon={<Award className="text-yellow-600" />}
            title="Streak"
            value={stats?.streak || 0}
            testId="streak-counter"
          />
=======
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold mb-8">{t('welcome')}!</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<BookOpen className="text-blue-600" />} title={t('enrolledCourses')} value={stats?.enrolledCoursesCount || 0} />
          <StatCard icon={<TrendingUp className="text-green-600" />} title={t('completedLessons')} value={stats?.completedLessonsCount || 0} />
          <StatCard icon={<Zap className="text-purple-600" />} title={t('points')} value={stats?.points || 0} />
          <StatCard icon={<Award className="text-yellow-600" />} title="Streak" value={stats?.streak || 0} />
>>>>>>> Stashed changes
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListTodo className="text-blue-600" size={20} />
                  {t('interactiveChecklist')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveChecklist />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="text-amber-600" size={20} />
                  {ts('feed')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SocialFeed initialPosts={feedPosts} />
              </CardContent>
            </Card>
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

<<<<<<< Updated upstream
function StatCard({
  icon,
  title,
  value,
  testId,
}: { icon: React.ReactNode; title: string; value: string | number; testId?: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-6 flex items-center gap-4">
=======
function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center gap-4">
>>>>>>> Stashed changes
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">{icon}</div>
        <div>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
