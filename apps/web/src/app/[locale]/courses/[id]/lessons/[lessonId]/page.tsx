'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

import { Course, Lesson } from '@/types';

export default function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string; locale: string }> }) {
  const [id, setId] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');
  const [locale, setLocale] = useState<string>('');
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => {
      setId(p.id);
      setLessonId(p.lessonId);
      setLocale(p.locale);
    });
  }, [params]);

  useEffect(() => {
    if (!lessonId || !id) return;
    
    const fetchData = async () => {
      try {
        const [lessonRes, courseRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/lessons/${lessonId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`)
        ]);
        setLesson(await lessonRes.json());
        setCourse(await courseRes.json());
      } catch {
        console.error('Error fetching lesson data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lessonId, id]);

  const markAsComplete = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/lessons/${lessonId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ status: 'COMPLETED', durationSpent: 60 }),
    });
    alert('Bài học đã hoàn thành!');
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!lesson) return <div className="p-10 text-center">Lesson not found</div>;

  const currentTitle = lesson.title[locale as keyof typeof lesson.title] || lesson.title.vi || lesson.title.en;
  const currentContent = lesson.content[locale as keyof typeof lesson.content] || lesson.content.vi || lesson.content.en;

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Sidebar - Lesson List */}
      <div className="w-80 border-r overflow-y-auto hidden md:block">
        <div className="p-4 border-b">
          <Link href={`/${locale}/courses/${id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <ChevronLeft className="h-4 w-4"/> Quay lại khóa học
          </Link>
          <h2 className="mt-2 font-bold">{course?.title[locale as keyof typeof course.title] || course?.title.vi}</h2>
        </div>
        <div className="divide-y">
          {course?.lessons.map((l: Lesson, idx: number) => (
            <Link 
              key={l.id} 
              href={`/${locale}/courses/${id}/lessons/${l.id}`}
              className={`block p-4 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 ${l.id === lessonId ? 'bg-blue-50 dark:bg-zinc-800 font-semibold text-blue-600' : ''}`}
            >
              {idx + 1}. {l.title[locale as keyof typeof l.title] || l.title.vi}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">{currentTitle}</h1>
            
            {lesson.type === 'VIDEO' && (
              <div className="aspect-video w-full rounded-xl bg-black mb-8 flex items-center justify-center text-white">
                {/* Video Player Placeholder */}
                <p>Video Player for: {lesson.videoKey}</p>
              </div>
            )}

            <div className="prose prose-zinc dark:prose-invert max-w-none">
              {currentContent}
            </div>

            <div className="mt-12 pt-8 border-t flex justify-between">
              <button className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-zinc-50">
                <ChevronLeft className="h-4 w-4"/> Bài trước
              </button>
              <button 
                onClick={markAsComplete}
                className="flex items-center gap-2 px-6 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4"/> Hoàn thành
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-zinc-50">
                Bài tiếp <ChevronRight className="h-4 w-4"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
