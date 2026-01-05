'use client';

import { Course } from '@/types/course';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const t = useTranslations('Courses');
  const locale = useLocale() as keyof typeof course.title;
  
  const title = course.title[locale] || course.title['vi'];
  const description = course.description[locale] || course.description['vi'];

  return (
    <div className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={course.thumbnailKey || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800'}
          alt={title}
          fill
          loading="lazy"
          className="object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 rounded bg-blue-600 px-2 py-1 text-xs font-bold text-white uppercase">
          {course.level}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-white line-clamp-1">
          {title}
        </h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
          {description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">
            {course.price === 0 ? t('free') : `${course.price.toLocaleString()} VND`}
          </span>
          <Link
            href={`/courses/${course.id}`}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t('viewCourse')}
          </Link>
        </div>
      </div>
    </div>
  );
}
