'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const t = useTranslations('Checkout');
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (courseId) {
            router.push(`/courses/${courseId}`);
          } else {
            router.push('/dashboard');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [courseId, router]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">{t('success')}</CardTitle>
            <CardDescription>
              You will be redirected in {countdown} seconds...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-600">
              Thank you for your purchase! You can now access the course.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex-1"
              >
                Go to Dashboard
              </Button>
              {courseId && (
                <Button
                  onClick={() => router.push(`/courses/${courseId}`)}
                  className="flex-1"
                >
                  {t('viewCourse')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
