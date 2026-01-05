'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatAmount } from '@/lib/stripe';
import { Course } from '@/types/course';
import { AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

interface CheckoutState {
  course: Course | null;
  loading: boolean;
  error: string | null;
  processing: boolean;
  alreadyOwned: boolean;
}

export default function CheckoutPage() {
  const t = useTranslations('Checkout');
  const tCommon = useTranslations('Common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId');

  const [state, setState] = useState<CheckoutState>({
    course: null,
    loading: true,
    error: null,
    processing: false,
    alreadyOwned: false,
  });

  useEffect(() => {
    if (!courseId) {
      setState(prev => ({ ...prev, loading: false, error: 'Missing course ID' }));
      return;
    }

    const fetchCourseAndCheckOwnership = async (): Promise<void> => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/auth/login?redirect=/checkout?courseId=' + courseId);
          return;
        }

        const [courseRes, enrollmentRes] = await Promise.all([
          fetch(`${API_URL}/courses/${courseId}`),
          fetch(`${API_URL}/courses/${courseId}/enrollment`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (!courseRes.ok) {
          throw new Error('Course not found');
        }

        const course = await courseRes.json();
        const enrollment = enrollmentRes.ok ? await enrollmentRes.json() : null;

        setState({
          course,
          loading: false,
          error: null,
          processing: false,
          alreadyOwned: !!enrollment,
        });
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load course',
        }));
      }
    };

    fetchCourseAndCheckOwnership();
  }, [courseId, router]);

  const handleCheckout = async (): Promise<void> => {
    if (!state.course) return;

    setState(prev => ({ ...prev, processing: true, error: null }));

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/auth/login?redirect=/checkout?courseId=' + courseId);
        return;
      }

      const successUrl = `${window.location.origin}/checkout/success?courseId=${state.course.id}`;
      const cancelUrl = `${window.location.origin}/checkout?courseId=${state.course.id}`;

      const response = await fetch(`${API_URL}/payment/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: state.course.id,
          successUrl,
          cancelUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setState(prev => ({
        ...prev,
        processing: false,
        error: err instanceof Error ? err.message : t('error'),
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (state.error || !state.course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error || tCommon('error')}</AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/courses')}
            className="mt-4"
            variant="outline"
          >
            {t('backToCourses')}
          </Button>
        </div>
      </div>
    );
  }

  const courseName = typeof state.course.title === 'object' && state.course.title !== null
    ? (state.course.title as { vi?: string; en?: string; zh?: string }).vi || 
      (state.course.title as { vi?: string; en?: string; zh?: string }).en || 
      'Course'
    : String(state.course.title || 'Course');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

        {state.alreadyOwned ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              {t('alreadyPurchased')}
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('orderSummary')}</CardTitle>
              <CardDescription>
                {t('confirmPurchase')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">{t('courseName')}</span>
                  <span className="font-medium">{courseName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">{t('price')}</span>
                  <span className="font-medium">{formatAmount(state.course.price)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>{t('total')}</span>
                <span>{formatAmount(state.course.price)}</span>
              </div>

              {state.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => router.push('/courses')}
                  variant="outline"
                  className="flex-1"
                  disabled={state.processing}
                >
                  {t('backToCourses')}
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="flex-1"
                  disabled={state.processing}
                >
                  {state.processing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t('redirecting')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t('confirmPurchase')}
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-zinc-500">
                {t('paymentMethod')}
              </p>
            </CardContent>
          </Card>
        )}

        {state.alreadyOwned && (
          <Button
            onClick={() => router.push(`/courses/${state.course?.id}`)}
            className="mt-4 w-full"
          >
            {t('viewCourse')}
          </Button>
        )}
      </div>
    </div>
  );
}
