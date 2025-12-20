'use client';

import { useState, useEffect, use } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, PlayCircle, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { useAuthStore } from '@/store/useAuthStore';
import Button from '@/components/atoms/Button';
import { motion } from 'framer-motion';
import type { Course, Lesson } from '@/types';

export default function LessonPage({ params: paramsPromise }: { params: Promise<{ id: string; lessonId: string; locale: string }> }) {
  const params = use(paramsPromise);
  const { id, lessonId, locale } = params;
  const t = useTranslations('Courses');
  const router = useRouter();
  const { token } = useAuthStore();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressing, setProgressing] = useState(false);

  useEffect(() => {
    if (!lessonId || !id || !token) return;
    
    const fetchData = async () => {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const [lessonRes, courseRes] = await Promise.all([
          fetch(`${API_URL}/courses/lessons/${lessonId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/courses/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        if (lessonRes.ok) setLesson(await lessonRes.json());
        if (courseRes.ok) setCourse(await courseRes.json());
      } catch (err) {
        console.error('Error fetching lesson data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lessonId, id, token]);

  const markAsComplete = async () => {
    if (progressing) return;
    setProgressing(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${API_URL}/courses/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'COMPLETED', durationSpent: 60 }),
      });

      if (response.ok) {
        // Find next lesson
        const currentIndex = course?.lessons.findIndex(l => l.id === lessonId) ?? -1;
        if (currentIndex !== -1 && currentIndex < (course?.lessons.length ?? 0) - 1) {
          const nextLesson = course?.lessons[currentIndex + 1];
          router.push(`/courses/${id}/lessons/${nextLesson?.id}`);
        } else {
          router.push(`/courses/${id}`);
        }
      }
    } catch (err) {
      console.error('Progress update error:', err);
    } finally {
      setProgressing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!lesson) return <div className="p-10 text-center">Lesson not found</div>;

  const currentTitle = lesson.title[locale as keyof typeof lesson.title] || lesson.title.vi;
  const currentContent = lesson.content[locale as keyof typeof lesson.content] || lesson.content.vi;

  return (
    <div className="flex h-screen bg-white dark:bg-black overflow-hidden">
      {/* Sidebar - Lesson List */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden lg:flex"
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href={`/courses/${id}`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
            <ChevronLeft size={16}/> {t('backToCourse') || 'Back to Course'}
          </Link>
          <h2 className="mt-4 text-lg font-bold line-clamp-2 leading-tight">
            {course?.title[locale as keyof typeof course.title] || course?.title.vi}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {course?.lessons.map((l: Lesson, idx: number) => {
            const isActive = l.id === lessonId;
            return (
              <Link 
                key={l.id} 
                href={`/courses/${id}/lessons/${l.id}`}
                className={`flex items-center gap-3 p-4 text-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                  isActive ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
                }`}>
                  {idx + 1}
                </div>
                <span className="flex-1 line-clamp-2">{l.title[locale as keyof typeof l.title] || l.title.vi}</span>
                {l.type === 'VIDEO' ? <PlayCircle size={14} className="opacity-50" /> : <FileText size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Main Player Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 custom-scrollbar">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 mb-4 uppercase tracking-wider">
                {lesson.type} LESSON
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">{currentTitle}</h1>
              
              {lesson.type === 'VIDEO' && (
                <div className="aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl mb-10 group relative border border-zinc-800">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
                    <PlayCircle size={64} className="mb-4 text-blue-600 opacity-80 group-hover:scale-110 transition-transform" />
                    <p className="font-medium">Video ID: {lesson.videoKey}</p>
                    <p className="text-sm opacity-60 mt-2">Ready to stream</p>
                  </div>
                </div>
              )}

              <div className="prose prose-zinc dark:prose-invert max-w-none mb-16">
                {currentContent}
              </div>

              {/* Navigation Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-zinc-200 dark:border-zinc-800">
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  <ChevronLeft size={18}/> {t('prevLesson') || 'Previous'}
                </Button>
                
                <Button 
                  onClick={markAsComplete}
                  className="w-full sm:w-auto px-10 gap-2"
                  isLoading={progressing}
                >
                  <CheckCircle size={18}/> {t('markComplete') || 'Mark as Complete'}
                </Button>

                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  {t('nextLesson') || 'Next'} <ChevronRight size={18}/>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
