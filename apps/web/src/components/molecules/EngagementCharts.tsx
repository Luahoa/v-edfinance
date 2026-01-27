'use client';

import { useTranslations } from 'next-intl';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/atoms/Skeleton';
import { Clock, TrendingUp, Target, Timer } from 'lucide-react';

interface TimeSpentData {
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  timeSpent: number;
  progressPercentage: number;
}

interface CompletionTrendData {
  date: string;
  completed: number;
}

interface EngagementSummary {
  totalLessons: number;
  completedLessons: number;
  completionRate: number;
  totalTimeMinutes: number;
  avgProgress: number;
}

interface TimeSpentChartProps {
  data: TimeSpentData[];
  isLoading?: boolean;
}

interface CompletionTrendChartProps {
  data: CompletionTrendData[];
  isLoading?: boolean;
}

interface EngagementSummaryCardProps {
  data: EngagementSummary | null;
  isLoading?: boolean;
}

export function TimeSpentChart({ data, isLoading }: TimeSpentChartProps) {
  const t = useTranslations('Analytics');
  const a = useTranslations('Accessibility');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock aria-hidden="true" className="h-5 w-5 text-blue-600" />
            {t('timeSpent')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div aria-live="polite" aria-busy={true}>
            <span className="sr-only">{a('loadingContent')}</span>
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock aria-hidden="true" className="h-5 w-5 text-blue-600" />
            {t('timeSpent')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-zinc-500">
            {t('noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: d.lessonTitle.length > 15 ? d.lessonTitle.slice(0, 15) + '...' : d.lessonTitle,
    fullName: d.lessonTitle,
    timeMinutes: Math.round(d.timeSpent / 60),
    progress: d.progressPercentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock aria-hidden="true" className="h-5 w-5 text-blue-600" />
          {t('timeSpent')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64" role="img" aria-label={a('chartTimeSpent')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 12 }}
                className="fill-zinc-600 dark:fill-zinc-400"
                label={{ value: t('minutes'), position: 'bottom', offset: -5 }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fontSize: 11 }}
                className="fill-zinc-600 dark:fill-zinc-400"
              />
              <Tooltip 
                formatter={(value: number) => [`${value} ${t('minutes')}`, t('timeSpent')]}
                labelFormatter={(label: string, payload) => payload?.[0]?.payload?.fullName || label}
                contentStyle={{ 
                  backgroundColor: 'var(--background)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Bar 
                dataKey="timeMinutes" 
                fill="#3b82f6" 
                radius={[0, 4, 4, 0]}
                name={t('timeSpent')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompletionTrendChart({ data, isLoading }: CompletionTrendChartProps) {
  const t = useTranslations('Analytics');
  const a = useTranslations('Accessibility');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp aria-hidden="true" className="h-5 w-5 text-green-600" />
            {t('completionTrend')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div aria-live="polite" aria-busy={true}>
            <span className="sr-only">{a('loadingContent')}</span>
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp aria-hidden="true" className="h-5 w-5 text-green-600" />
            {t('completionTrend')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-zinc-500">
            {t('noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    completed: d.completed,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp aria-hidden="true" className="h-5 w-5 text-green-600" />
          {t('completionTrend')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64" role="img" aria-label={a('chartCompletionTrend')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                className="fill-zinc-600 dark:fill-zinc-400"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="fill-zinc-600 dark:fill-zinc-400"
                allowDecimals={false}
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Hoàn thành']}
                contentStyle={{ 
                  backgroundColor: 'var(--background)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function EngagementSummaryCards({ data, isLoading }: EngagementSummaryCardProps) {
  const t = useTranslations('Analytics');
  const a = useTranslations('Accessibility');

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-live="polite" aria-busy={true}>
        <span className="sr-only">{a('loadingContent')}</span>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const summary = data ?? {
    totalLessons: 0,
    completedLessons: 0,
    completionRate: 0,
    totalTimeMinutes: 0,
    avgProgress: 0,
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} ${t('minutes')}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
            <Target aria-hidden="true" className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">{t('completionRate')}</p>
            <p className="text-xl font-bold">{summary.completionRate}%</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
            <TrendingUp aria-hidden="true" className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Hoàn thành</p>
            <p className="text-xl font-bold">{summary.completedLessons}/{summary.totalLessons}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
            <Timer aria-hidden="true" className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">{t('averageTime')}</p>
            <p className="text-xl font-bold">{formatTime(summary.totalTimeMinutes)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
            <Target aria-hidden="true" className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Tiến độ TB</p>
            <p className="text-xl font-bold">{summary.avgProgress}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
