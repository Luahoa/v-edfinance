import { getTranslations } from 'next-intl/server';
import AiMentor from '@/components/AiMentor';
import InteractiveChecklist from '@/components/organisms/InteractiveChecklist';
import { SocialFeed } from '@/components/organisms/SocialFeed';
import { BuddyRecommendations } from '@/components/molecules/BuddyRecommendations';
import { BookOpen, TrendingUp, Award, Zap, ListTodo, Users } from 'lucide-react';
import { cookies } from 'next/headers';
import type { DashboardStats, Post as SocialPostType } from '@/types';

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
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold mb-8">{t('welcome')}!</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<BookOpen className="text-blue-600" />} title={t('enrolledCourses')} value={stats?.enrolledCoursesCount || 0} />
          <StatCard icon={<TrendingUp className="text-green-600" />} title={t('completedLessons')} value={stats?.completedLessonsCount || 0} />
          <StatCard icon={<Zap className="text-purple-600" />} title={t('points')} value={stats?.points || 0} />
          <StatCard icon={<Award className="text-yellow-600" />} title="Streak" value={stats?.streak || 0} />
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

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
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
