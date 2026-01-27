'use client';

import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import {
  TimeSpentChart,
  CompletionTrendChart,
  EngagementSummaryCards,
} from '@/components/molecules/EngagementCharts';
import { BarChart3 } from 'lucide-react';

export default function EngagementAnalytics() {
  const t = useTranslations('Analytics');

  const { data: timeSpentData, isLoading: timeSpentLoading } = trpc.analytics.getTimeSpentPerLesson.useQuery(
    { limit: 8 },
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: trendData, isLoading: trendLoading } = trpc.analytics.getCompletionTrend.useQuery(
    { days: 7 },
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: summaryData, isLoading: summaryLoading } = trpc.analytics.getEngagementSummary.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 aria-hidden="true" className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold">{t('engagement')}</h2>
      </div>

      <EngagementSummaryCards data={summaryData ?? null} isLoading={summaryLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSpentChart data={timeSpentData ?? []} isLoading={timeSpentLoading} />
        <CompletionTrendChart data={trendData ?? []} isLoading={trendLoading} />
      </div>
    </div>
  );
}
