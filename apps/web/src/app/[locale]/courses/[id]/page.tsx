import { PlayCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { Course, Lesson } from '@/types';

async function getCourse(id: string): Promise<Course | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const course = await getCourse(id);

  if (!course) return <div>Course not found</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="bg-zinc-900 py-12 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="text-4xl font-bold">{course.title.vi || course.title.en}</h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl">
            {course.description.vi || course.description.en}
          </p>
          <div className="mt-8 flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1"><PlayCircle className="h-4 w-4"/> {course.lessons.length} Bài học</span>
            <span className="font-semibold text-blue-400">{course.level}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">Nội dung khóa học</h2>
        <div className="divide-y rounded-xl border">
          {course.lessons.map((lesson: Lesson, index: number) => (
            <Link 
              key={lesson.id}
              href={`/${locale}/courses/${id}/lessons/${lesson.id}`}
              className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-zinc-400 font-medium">{index + 1}.</span>
                <div>
                  <p className="font-medium">{lesson.title.vi || lesson.title.en}</p>
                  <p className="text-xs text-zinc-500 uppercase">{lesson.type}</p>
                </div>
              </div>
              {lesson.type === 'VIDEO' ? <PlayCircle className="h-5 w-5 text-zinc-400"/> : <FileText className="h-5 w-5 text-zinc-400"/>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
