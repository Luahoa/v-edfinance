import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Course, Lesson } from '@/types';
import { BookOpen, CheckCircle, Clock, FileText, PlayCircle, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getCourse(id: string): Promise<Course | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`, {
      cache: 'no-store', // Consider 'force-cache' with revalidate for prod
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch course:', error);
    return null;
  }
}

export default async function CourseDetailPage({
  params,
}: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const course = await getCourse(id);

  if (!course) notFound();

  // Mock data for UI polish (replace with real data later)
  const studentsCount = 1234;
  const rating = 4.8;
  const reviewsCount = 156;
  const totalDuration = '2h 15m';

  const localizedTitle = course.title[locale as keyof typeof course.title] || course.title['en'] || course.title['vi'];
  const localizedDesc = course.description[locale as keyof typeof course.description] || course.description['en'] || course.description['vi'];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Hero Section */}
      <div className="bg-white dark:bg-zinc-900 border-b dark:border-zinc-800">
        <div className="container mx-auto max-w-7xl px-4 py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200">
                    {course.level}
                  </Badge>
                  <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                    Finance
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                  {localizedTitle}
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  {localizedDesc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-white ml-1">{rating}</span>
                  <span>({reviewsCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{studentsCount.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{totalDuration}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-8 text-lg" asChild>
                  <Link href={`/${locale}/courses/${id}/lessons/${course.lessons[0]?.id}`}>
                    Start Learning Now
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12">
                  View Syllabus
                </Button>
              </div>
              
              <div className="text-sm text-zinc-500">
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Free access for all students
                </p>
              </div>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 shadow-xl lg:aspect-square lg:h-auto">
              {/* Placeholder for Course Thumbnail */}
              <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                <div className="text-center">
                  <PlayCircle className="mx-auto h-16 w-16 opacity-50" />
                  <p className="mt-2 font-medium">Preview Course</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <Tabs defaultValue="curriculum" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Course Content</h2>
              <span className="text-sm text-zinc-500">{course.lessons.length} lessons</span>
            </div>

            <div className="space-y-4">
              {course.lessons.map((lesson: Lesson, index: number) => {
                const lessonTitle = lesson.title[locale as keyof typeof lesson.title] || lesson.title['en'] || lesson.title['vi'];
                return (
                  <Card key={lesson.id} className="overflow-hidden transition-all hover:border-green-500/50 hover:shadow-md">
                    <Link href={`/${locale}/courses/${id}/lessons/${lesson.id}`}>
                      <CardContent className="flex items-center gap-4 p-4 sm:p-6">
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate pr-4">{lessonTitle}</h3>
                          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                            <span className="uppercase tracking-wider font-medium flex items-center gap-1">
                              {lesson.type === 'VIDEO' ? <PlayCircle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                              {lesson.type}
                            </span>
                            <span>•</span>
                            <span>10 min</span>
                          </div>
                        </div>
                        <div className="flex-none">
                          <Button variant="ghost" size="sm" className="hidden sm:flex">
                            Start
                          </Button>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardContent className="p-8 text-center text-zinc-500">
                <BookOpen className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <p>Student reviews coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
