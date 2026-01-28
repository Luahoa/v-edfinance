'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/lib/stripe';
import { DollarSign, TrendingUp, Calendar, AlertCircle, Download } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface LocalizedText {
  vi?: string;
  en?: string;
  zh?: string;
  [key: string]: string | undefined;
}

function getLocalizedText(text: LocalizedText | unknown, locale: string): string {
  if (!text || typeof text !== 'object') return '';
  const localized = text as LocalizedText;
  return localized[locale] || localized['vi'] || localized['en'] || '';
}

export default function RevenueDashboardPage() {
  const t = useTranslations('Revenue');
  const tCommon = useTranslations('Common');
  const locale = useLocale();

  const { data: stats, isLoading: statsLoading, error: statsError } = trpc.payment.getRevenueStats.useQuery();
  const { data: courseRevenue, isLoading: courseLoading } = trpc.payment.getRevenueByCourse.useQuery();
  const { data: recentTransactions, isLoading: txLoading } = trpc.payment.getRecentTransactions.useQuery({ limit: 10 });

  const isLoading = statsLoading || courseLoading || txLoading;
  const error = statsError?.message;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const monthlyChange = stats
    ? stats.lastMonth > 0
      ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100
      : 0
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-zinc-600">
          {t('description')}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalEarnings')}</CardTitle>
            <DollarSign aria-hidden="true" className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatAmount(stats.totalEarnings) : '0 ₫'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('thisMonth')}</CardTitle>
            <Calendar aria-hidden="true" className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatAmount(stats.thisMonth) : '0 ₫'}
            </div>
            {monthlyChange !== 0 && (
              <p className={`text-xs ${monthlyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}% {t('fromLastMonth')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('lastMonth')}</CardTitle>
            <TrendingUp aria-hidden="true" className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatAmount(stats.lastMonth) : '0 ₫'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('earningsByCourse')}</CardTitle>
            <CardDescription>{t('revenueBreakdown')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!courseRevenue || courseRevenue.length === 0 ? (
              <p className="text-sm text-zinc-500">{t('noData')}</p>
            ) : (
              <div className="space-y-4">
                {courseRevenue.map(course => (
                  <div key={course.courseId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{getLocalizedText(course.courseTitle, locale)}</p>
                      <p className="text-sm text-zinc-500">{course.sales} {t('sales')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatAmount(course.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('recentTransactions')}</CardTitle>
            <CardDescription>{t('latestPurchases')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentTransactions || recentTransactions.length === 0 ? (
              <p className="text-sm text-zinc-500">{t('noData')}</p>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{getLocalizedText(tx.courseTitle, locale)}</p>
                      <p className="text-sm text-zinc-500">
                        {typeof tx.studentName === 'object' 
                          ? getLocalizedText(tx.studentName, locale) 
                          : tx.studentEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatAmount(tx.amount)}</p>
                      <p className="text-xs text-zinc-500">
                        {tx.date ? new Date(tx.date).toLocaleDateString(locale) : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline">
          <Download aria-hidden="true" className="mr-2 h-4 w-4" />
          {t('exportData')}
        </Button>
      </div>
    </div>
  );
}
