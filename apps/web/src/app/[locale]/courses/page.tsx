import CourseCard from '@/components/molecules/CourseCard';
import type { Course } from '@/types/course';
import { getTranslations } from 'next-intl/server';

async function getCourses(): Promise<Course[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return [];
  }
}

export default async function CoursesPage() {
  const t = await getTranslations('Courses');
  const courses = await getCourses();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
          {t('title')}
        </h1>
        <div className="mt-4 h-1 w-20 bg-blue-600 mx-auto rounded-full" />
      </header>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">{t('noCourses')}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
