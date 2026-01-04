'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading video...</p>
      </div>
    </div>
  ),
});

interface YouTubeEmbedProps {
  videoId: string;
  onProgress?: (state: { played: number; playedSeconds: number }) => void;
  onEnded?: () => void;
  className?: string;
}

export default function YouTubeEmbed({
  videoId,
  onProgress,
  onEnded,
  className = '',
}: YouTubeEmbedProps) {
  const t = useTranslations('Courses');
  const [error, setError] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    // 5s timeout detection for ad blockers
    const timeout = setTimeout(() => {
      if (!videoLoaded) {
        setTimeoutError(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [videoLoaded]);

  if (error || timeoutError) {
    return (
      <div
        className={`flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      >
        <div className="mb-4 text-6xl">🎥</div>
        <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
          {t('videoUnavailable')}
        </h3>
        <p className="mb-4 max-w-md text-zinc-600 dark:text-zinc-400">
          {timeoutError ? t('videoBlockedByAdBlocker') : t('videoFailedToLoad')}
        </p>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition-colors hover:bg-red-700"
        >
          {t('watchOnYouTube')} →
        </a>
      </div>
    );
  }

  return (
    <div className={`aspect-video w-full overflow-hidden rounded-lg ${className}`}>
      <ReactPlayer
        url={`https://www.youtube.com/watch?v=${videoId}`}
        width="100%"
        height="100%"
        controls
        onProgress={onProgress}
        onEnded={onEnded}
        onError={() => setError(true)}
        onReady={() => setVideoLoaded(true)}
        config={{
          youtube: {
            playerVars: {
              modestbranding: 1,
              rel: 0,
            },
          },
        }}
      />
    </div>
  );
}
