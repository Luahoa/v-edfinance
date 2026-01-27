import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { 
  LazyAiMentor, 
  LazyInteractiveChecklist, 
  LazySocialFeed, 
  LazyBuddyRecommendations,
  LazyQuickActionsGrid
} from '@/components/lazy';
import { 
  StatGridSkeleton, 
  ChecklistSkeleton, 
  SocialFeedSkeleton, 
  BuddyCardSkeleton, 
  AiMentorSkeleton,
  SkeletonGrid
} from '@/components/atoms/Skeleton';
import { BookOpen, TrendingUp, Award, Zap, ListTodo, Users } from 'lucide-react';
import type { BuddyGroup, DashboardStats, Post as SocialPostType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { serverTrpc } from '@/lib/trpc-server';

async function getDashboardStats(): Promise<DashboardStats | null> {
  return serverTrpc.user.getStats();
}

async function getSocialFeed(): Promise<SocialPostType[]> {
  const feed = await serverTrpc.social.getFeed(5);
  if (!feed) return [];
  
  return feed.map((post) => ({
    id: post.id,
    content: post.content,
    type: post.type as SocialPostType['type'],
    createdAt: post.createdAt,
    user: {
      id: post.user.id,
      name: post.user.name?.['vi'] || post.user.name?.['en'] || 'Anonymous',
    },
  }));
}

async function getBuddyRecommendations(): Promise<BuddyGroup[]> {
  const recommendations = await serverTrpc.social.getRecommendations();
  if (!recommendations) return [];
  
  return recommendations.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description || '',
    type: group.type as BuddyGroup['type'],
    memberCount: group.memberCount,
  }));
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
      <div className="container mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{t('welcome')}!</h1>
          <span className="text-sm text-zinc-500">
            {new Date().toLocaleDateString('vi-VN', { dateStyle: 'full' })}
          </span>
        </div>

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
        </div>

        {/* Quick Actions Grid */}
        <Suspense fallback={<SkeletonGrid cols={3} />}>
          <LazyQuickActionsGrid />
        </Suspense>

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
                <Suspense fallback={<ChecklistSkeleton />}>
                  <LazyInteractiveChecklist />
                </Suspense>
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
                <Suspense fallback={<SocialFeedSkeleton />}>
                  <LazySocialFeed initialPosts={feedPosts} />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Suspense fallback={<BuddyCardSkeleton />}>
              <LazyBuddyRecommendations recommendations={recommendations} />
            </Suspense>
            <Suspense fallback={<AiMentorSkeleton />}>
              <LazyAiMentor />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  testId,
}: { icon: React.ReactNode; title: string; value: string | number; testId?: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-6 flex items-center gap-4">
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">{icon}</div>
        <div>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
