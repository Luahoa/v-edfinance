import { getTranslations, getLocale } from 'next-intl/server';
import CourseCard from '@/components/molecules/CourseCard';
import { serverTrpc } from '@/lib/trpc-server';

async function getCourses(locale: string) {
  const courses = await serverTrpc.course.list({ limit: 50 });
  
  if (!courses) return [];
  
  return courses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title[locale] || course.title['vi'] || Object.values(course.title)[0] || '',
    description: course.description[locale] || course.description['vi'] || Object.values(course.description)[0] || '',
    thumbnailKey: course.thumbnailKey,
    price: course.price,
    level: course.level,
    published: course.published,
  }));
}

export default async function CoursesPage() {
  const t = await getTranslations('Courses');
  const locale = await getLocale();
  const courses = await getCourses(locale);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
          {t('title')}
        </h1>
        <div className="mt-4 h-1 w-20 bg-blue-600 mx-auto rounded-full"></div>
      </header>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            {t('noCourses')}
          </p>
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
