'use client';

import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { useVideoLazyLoad } from '@/lib/hooks/useVideoLazyLoad';

/**
 * ved-yil5: OptimizedVideo - Lazy-loaded video with HLS support
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - HLS adaptive streaming (when available)
 * - Fallback to progressive download
 * - Loading skeleton placeholder
 * - Preload metadata only (not full video)
 *
 * Performance:
 * - Videos below fold: Load only when in viewport
 * - Reduces initial page load time
 * - Saves bandwidth for users
 */

const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => <VideoSkeleton />,
});

interface OptimizedVideoProps {
  videoId: string;
  videoUrl?: string;
  hlsUrl?: string;
  onProgress?: (state: { played: number; playedSeconds: number }) => void;
  onEnded?: () => void;
  className?: string;
  lazyLoad?: boolean;
  thumbnail?: string;
}

function VideoSkeleton() {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading video...</p>
      </div>
    </div>
  );
}

export default function OptimizedVideo({
  videoId,
  videoUrl,
  hlsUrl,
  onProgress,
  onEnded,
  className = '',
  lazyLoad = true,
  thumbnail,
}: OptimizedVideoProps) {
  const t = useTranslations('Courses');
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Lazy load hook - only load video when in viewport
  const { isInView, ref } = useVideoLazyLoad({
    enabled: lazyLoad,
    threshold: 0.25, // Load when 25% visible
    rootMargin: '100px', // Preload 100px before entering viewport
  });

  // Determine video source (HLS preferred, fallback to progressive)
  const videoSource = hlsUrl || videoUrl;

  if (error) {
    return (
      <div
        ref={ref}
        className={`flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      >
        <div className="mb-4 text-6xl">🎥</div>
        <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
          {t('videoUnavailable')}
        </h3>
        <p className="mb-4 max-w-md text-zinc-600 dark:text-zinc-400">
          {t('videoFailedToLoad')}
        </p>
      </div>
    );
  }

  // Show thumbnail placeholder if not in view yet
  if (lazyLoad && !isInView) {
    return (
      <div
        ref={ref}
        className={`group relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 ${className}`}
        onClick={() => setPlaying(true)}
      >
        {thumbnail && (
          <img
            src={thumbnail}
            alt="Video thumbnail"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover:bg-black/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 rounded bg-black/70 px-2 py-1 text-sm text-white">
          {t('clickToLoad')}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`aspect-video w-full overflow-hidden rounded-lg ${className}`}>
      <Suspense fallback={<VideoSkeleton />}>
        <ReactPlayer
          url={videoSource}
          width="100%"
          height="100%"
          controls
          playing={playing}
          onProgress={onProgress}
          onEnded={onEnded}
          onError={() => setError(true)}
          preload="metadata" // Only preload metadata, not full video
          config={{
            file: {
              attributes: {
                preload: 'metadata',
                controlsList: 'nodownload',
              },
              hlsOptions: {
                // HLS.js configuration for adaptive streaming
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90,
              },
            },
          }}
        />
      </Suspense>
    </div>
  );
}
