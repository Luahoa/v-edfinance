'use client';

import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface TrendData {
  date: string;
  completed: number;
}

export function LearningTrendChart() {
  const t = useTranslations('Progress');
  const { data: trend, isLoading } = trpc.analytics.getCompletionTrend.useQuery({ days: 7 });
  const { data: summary } = trpc.analytics.getEngagementSummary.useQuery();

  if (isLoading) {
    return <TrendChartSkeleton />;
  }

  const maxCompleted = Math.max(...(trend?.map((d: TrendData) => d.completed) || [1]), 1);
  const totalCompleted = trend?.reduce((sum: number, d: TrendData) => sum + d.completed, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="text-green-600" size={20} />
          {t('weeklyProgress')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <p className="text-2xl font-bold text-blue-600">{summary?.completionRate || 0}%</p>
            <p className="text-xs text-zinc-500">{t('completionRate')}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <p className="text-2xl font-bold text-green-600">{totalCompleted}</p>
            <p className="text-xs text-zinc-500">{t('lessonsThisWeek')}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <p className="text-2xl font-bold text-purple-600">{summary?.totalTimeMinutes || 0}m</p>
            <p className="text-xs text-zinc-500">{t('totalTime')}</p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-32">
          {trend?.map((day: TrendData, index: number) => {
            const height = day.completed > 0 ? (day.completed / maxCompleted) * 100 : 4;
            const dayLabel = new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'short' });
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-zinc-500">{day.completed}</span>
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    day.completed > 0 
                      ? 'bg-gradient-to-t from-blue-500 to-blue-400' 
                      : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                  style={{ height: `${height}%`, minHeight: '4px' }}
                />
                <span className="text-xs text-zinc-500">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="flex-1 h-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
