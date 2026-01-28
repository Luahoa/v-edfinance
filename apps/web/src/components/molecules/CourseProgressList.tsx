'use client';

import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  timeSpent: number;
  progressPercentage: number;
}

export function CourseProgressList() {
  const t = useTranslations('Progress');
  const { data: lessons, isLoading } = trpc.analytics.getTimeSpentPerLesson.useQuery({ limit: 5 });

  if (isLoading) {
    return <CourseProgressSkeleton />;
  }

  if (!lessons || lessons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="text-blue-600" size={20} />
            {t('recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500 text-center py-4">{t('noProgress')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="text-blue-600" size={20} />
          {t('recentActivity')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lessons.map((lesson: LessonProgress) => (
          <div
            key={lesson.lessonId}
            className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <Link
                href={`/lessons/${lesson.lessonId}`}
                className="font-medium text-sm truncate block hover:text-blue-600"
              >
                {lesson.lessonTitle}
              </Link>
              <p className="text-xs text-zinc-500 truncate">{lesson.courseTitle}</p>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock size={12} />
                <span>{formatTime(lesson.timeSpent)}</span>
              </div>
              <div className="w-20">
                <Progress value={lesson.progressPercentage} className="h-2" />
              </div>
              {lesson.progressPercentage === 100 && (
                <CheckCircle2 size={16} className="text-green-600" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}

function CourseProgressSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3">
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-2 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
