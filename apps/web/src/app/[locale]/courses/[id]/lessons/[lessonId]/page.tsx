'use client';

import Button from '@/components/atoms/Button';
import YouTubeEmbed from '@/components/molecules/YouTubeEmbed';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Link, useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/store/useAuthStore';
import type { Course, Lesson } from '@/types';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  PlayCircle,
  Menu
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { use, useEffect, useState } from 'react';

export default function LessonPage({
  params: paramsPromise,
}: { params: Promise<{ id: string; lessonId: string; locale: string }> }) {
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
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/courses/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'COMPLETED', durationSpent: 60 }),
      });

      if (response.ok) {
        // Find next lesson
        const currentIndex = course?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
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
    <div className="h-screen bg-white dark:bg-black overflow-hidden flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden p-4 border-b flex items-center justify-between bg-white dark:bg-zinc-900 z-10">
        <Link href={`/courses/${id}`} className="flex items-center gap-2 text-sm font-medium text-zinc-600">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <span className="font-semibold truncate max-w-[200px]">{currentTitle}</span>
        <Button variant="ghost" size="sm" className="p-2">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1 h-full">
        
        {/* Sidebar - Lesson List (Desktop) */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden lg:flex flex-col border-r bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="p-4 border-b">
            <Link
              href={`/courses/${id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors mb-4"
            >
              <ChevronLeft size={14} /> {t('backToCourse') || 'Back to Course'}
            </Link>
            <h2 className="font-bold text-lg leading-tight line-clamp-2">
              {course?.title[locale as keyof typeof course.title] || course?.title.vi}
            </h2>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-1">
              {course?.lessons.map((l: Lesson, idx: number) => {
                const isActive = l.id === lessonId;
                return (
                  <Link
                    key={l.id}
                    href={`/courses/${id}/lessons/${l.id}`}
                    className={`flex items-start gap-3 p-3 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-green-100 text-green-900 font-medium dark:bg-green-900/30 dark:text-green-100'
                        : 'hover:bg-zinc-100 text-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="mt-0.5">
                      {l.type === 'VIDEO' ? (
                        <PlayCircle size={16} className={isActive ? 'text-green-600' : 'opacity-50'} />
                      ) : (
                        <FileText size={16} className={isActive ? 'text-green-600' : 'opacity-50'} />
                      )}
                    </div>
                    <span className="leading-tight">
                      <span className="mr-2 opacity-50">{idx + 1}.</span>
                      {l.title[locale as keyof typeof l.title] || l.title.vi}
                    </span>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle className="hidden lg:flex" />

        {/* Main Content */}
        <ResizablePanel defaultSize={80}>
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto px-6 py-8 md:px-12 lg:py-12">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase dark:bg-blue-900/30 dark:text-blue-300">
                    {lesson.type} Lesson
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-8 tracking-tight">
                  {currentTitle}
                </h1>

                {lesson.type === 'VIDEO' && lesson.videoType === 'YOUTUBE' && lesson.videoKey && (
                  <div className="mb-10 rounded-xl overflow-hidden shadow-2xl bg-black">
                    <AspectRatio ratio={16 / 9}>
                      <YouTubeEmbed
                        videoId={
                          typeof lesson.videoKey === 'string'
                            ? lesson.videoKey
                            : JSON.parse(lesson.videoKey).videoId
                        }
                        onProgress={(state) => console.log('Progress:', state.playedSeconds)}
                        onEnded={() => console.log('Video ended')}
                        className="w-full h-full"
                      />
                    </AspectRatio>
                  </div>
                )}

                {lesson.type === 'VIDEO' && lesson.videoType !== 'YOUTUBE' && (
                  <div className="mb-10 rounded-xl overflow-hidden shadow-lg border bg-zinc-100 dark:bg-zinc-900">
                    <AspectRatio ratio={16 / 9}>
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                        <PlayCircle size={64} className="mb-4 text-green-600 opacity-80" />
                        <p className="font-medium">Local Video Player</p>
                        <p className="text-xs font-mono mt-2 bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded">{lesson.videoKey}</p>
                      </div>
                    </AspectRatio>
                  </div>
                )}

                <div className="prose prose-zinc dark:prose-invert max-w-none mb-16 lg:prose-lg">
                  {currentContent}
                </div>

                <Separator className="my-8" />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Button variant="outline" className="w-full sm:w-auto gap-2 h-12 text-base">
                    <ChevronLeft size={18} /> {t('prevLesson') || 'Previous'}
                  </Button>

                  <Button
                    onClick={markAsComplete}
                    className="w-full sm:w-auto px-8 gap-2 bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-base shadow-lg shadow-green-900/20"
                    isLoading={progressing}
                  >
                    <CheckCircle size={20} /> {t('markComplete') || 'Mark as Complete'}
                  </Button>

                  <Button variant="outline" className="w-full sm:w-auto gap-2 h-12 text-base">
                    {t('nextLesson') || 'Next'} <ChevronRight size={18} />
                  </Button>
                </div>
              </motion.div>
            </div>
          </ScrollArea>
        </ResizablePanel>
        
      </ResizablePanelGroup>
    </div>
  );
}
