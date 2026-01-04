import { useCallback } from 'react';
import { useYouTubeProgress, ProgressEvent } from './useYouTubeProgress';
import { progressAPI } from '@/lib/api/progress';
import { ProgressStatus } from '@/types';

interface UseVideoProgressOptions {
  videoId: string;
  lessonId: string;
  userId: string;
  sessionId: string;
  authToken: string;
  videoDuration?: number;
}

export function useVideoProgress({
  videoId,
  lessonId,
  userId,
  sessionId,
  authToken,
  videoDuration,
}: UseVideoProgressOptions) {
  const handleProgressUpdate = useCallback(
    async (data: {
      status: ProgressStatus;
      durationSpent: number;
      progressPercentage: number;
    }) => {
      try {
        await progressAPI.updateProgress(
          lessonId,
          {
            status: data.status,
            durationSpent: data.durationSpent,
          },
          authToken
        );
      } catch (error) {
        console.error('[useVideoProgress] API error:', error);
        throw error;
      }
    },
    [lessonId, authToken]
  );

  const {
    onProgress,
    onEnded,
    progressPercentage,
    watchLogs,
    reset,
  } = useYouTubeProgress({
    videoId,
    lessonId,
    userId,
    sessionId,
    debounceMs: 5000,
    onProgressUpdate: handleProgressUpdate,
  });

  return {
    onProgress,
    onEnded,
    progressPercentage,
    watchLogs,
    reset,
  };
}
