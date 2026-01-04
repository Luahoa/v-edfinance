import { useRef, useCallback, useState, useEffect } from 'react';
import { ProgressStatus } from '@/types/progress';

export interface ProgressEvent {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

interface WatchLog {
  timestamp: number;
  playedSeconds: number;
  played: number;
  sessionId: string;
  userId: string;
}

interface UseYouTubeProgressReturn {
  onProgress: (state: ProgressEvent) => void;
  onEnded: () => void;
  progressPercentage: number;
  watchLogs: WatchLog[];
  reset: () => void;
}

interface UseYouTubeProgressOptions {
  videoId: string;
  lessonId: string;
  userId: string;
  sessionId: string;
  debounceMs?: number;
  onProgressUpdate?: (data: {
    status: ProgressStatus;
    durationSpent: number;
    progressPercentage: number;
  }) => Promise<void>;
}

export function useYouTubeProgress({
  videoId,
  lessonId,
  userId,
  sessionId,
  debounceMs = 5000,
  onProgressUpdate,
}: UseYouTubeProgressOptions): UseYouTubeProgressReturn {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [watchLogs, setWatchLogs] = useState<WatchLog[]>([]);
  
  const lastUpdateTimeRef = useRef<Date>(new Date());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedSecondsRef = useRef(0);
  const lastProgressPercentageRef = useRef(0);
  const sessionStartTimeRef = useRef(Date.now());
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);

  const addWatchLog = useCallback((playedSeconds: number, played: number) => {
    const log: WatchLog = {
      timestamp: Date.now(),
      playedSeconds,
      played,
      sessionId,
      userId,
    };
    
    setWatchLogs((prev) => [...prev, log]);
    return log;
  }, [sessionId, userId]);

  const determineStatus = useCallback((played: number): ProgressStatus => {
    if (played >= 0.9) return ProgressStatus.COMPLETED;
    if (played > 0) return ProgressStatus.IN_PROGRESS;
    return ProgressStatus.STARTED;
  }, []);

  const updateProgress = useCallback(
    async (playedSeconds: number, played: number) => {
      if (!onProgressUpdate) return;

      const status = determineStatus(played);
      const percentage = Math.floor(played * 100);

      const durationDelta = Math.max(0, playedSeconds - lastPlayedSecondsRef.current);
      
      if (durationDelta > 0 || status === ProgressStatus.COMPLETED) {
        try {
          await onProgressUpdate({
            status,
            durationSpent: Math.round(durationDelta),
            progressPercentage: percentage,
          });
          
          lastUpdateTimeRef.current = new Date();
          lastPlayedSecondsRef.current = playedSeconds;
          lastProgressPercentageRef.current = percentage;
        } catch (error) {
          console.error('[useYouTubeProgress] Failed to update progress:', error);
        }
      }
    },
    [onProgressUpdate, determineStatus]
  );

  const onProgress = useCallback(
    (state: ProgressEvent) => {
      const { playedSeconds, played } = state;
      
      addWatchLog(playedSeconds, played);
      setProgressPercentage(Math.floor(played * 100));

      if (!hasStartedRef.current && played > 0) {
        hasStartedRef.current = true;
        updateProgress(playedSeconds, played);
        return;
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        updateProgress(playedSeconds, played);
      }, debounceMs);
    },
    [addWatchLog, updateProgress, debounceMs]
  );

  const onEnded = useCallback(() => {
    if (hasCompletedRef.current) return;
    
    hasCompletedRef.current = true;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const finalLog = watchLogs[watchLogs.length - 1];
    if (finalLog) {
      updateProgress(finalLog.playedSeconds, 1.0);
    }
  }, [watchLogs, updateProgress]);

  const reset = useCallback(() => {
    setProgressPercentage(0);
    setWatchLogs([]);
    lastPlayedSecondsRef.current = 0;
    lastProgressPercentageRef.current = 0;
    sessionStartTimeRef.current = Date.now();
    hasStartedRef.current = false;
    hasCompletedRef.current = false;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    onProgress,
    onEnded,
    progressPercentage,
    watchLogs,
    reset,
  };
}
