'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/lib/stripe';
import { DollarSign, TrendingUp, Calendar, AlertCircle, Download } from 'lucide-react';

interface RevenueStats {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
}

interface CourseRevenue {
  courseId: string;
  courseName: string;
  sales: number;
  revenue: number;
}

interface RecentTransaction {
  id: string;
  courseName: string;
  amount: number;
  date: Date;
  studentName: string;
}

export default function RevenueDashboardPage() {
  const t = useTranslations('Revenue');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [courseRevenue, setCourseRevenue] = useState<CourseRevenue[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenueData = async (): Promise<void> => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/auth/login?redirect=/teacher/revenue');
          return;
        }

        const [statsRes, courseRevenueRes, transactionsRes] = await Promise.all([
          fetch(`${API_URL}/revenue/stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`${API_URL}/revenue/by-course`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`${API_URL}/revenue/recent-transactions`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (!statsRes.ok || !courseRevenueRes.ok || !transactionsRes.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const [statsData, courseData, transactionsData] = await Promise.all([
          statsRes.json(),
          courseRevenueRes.json(),
          transactionsRes.json(),
        ]);

        setStats(statsData);
        setCourseRevenue(courseData);
        setRecentTransactions(transactionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [router, tCommon]);

  if (loading) {
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
          Track your course earnings and sales performance
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalEarnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
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
            <Calendar className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatAmount(stats.thisMonth) : '0 ₫'}
            </div>
            {monthlyChange !== 0 && (
              <p className={`text-xs ${monthlyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}% from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('lastMonth')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
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
            <CardDescription>Revenue breakdown by course</CardDescription>
          </CardHeader>
          <CardContent>
            {courseRevenue.length === 0 ? (
              <p className="text-sm text-zinc-500">{t('noData')}</p>
            ) : (
              <div className="space-y-4">
                {courseRevenue.map(course => (
                  <div key={course.courseId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{course.courseName}</p>
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
            <CardDescription>Latest purchases from students</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-zinc-500">{t('noData')}</p>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{tx.courseName}</p>
                      <p className="text-sm text-zinc-500">{tx.studentName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatAmount(tx.amount)}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(tx.date).toLocaleDateString()}
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
          <Download className="mr-2 h-4 w-4" />
          {t('exportData')}
        </Button>
      </div>
    </div>
  );
}
