import { SkeletonGrid } from '@/components/atoms/Skeleton';

export default function CoursesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <div className="h-9 w-48 mx-auto mb-4 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="mt-4 h-1 w-20 bg-blue-600 mx-auto rounded-full" />
      </header>

      <SkeletonGrid cols={4} />
    </div>
  );
}
