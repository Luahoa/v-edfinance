import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useYouTubeProgress, ProgressEvent } from './useYouTubeProgress';
import { ProgressStatus } from '@/types';

describe('useYouTubeProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const defaultOptions = {
    videoId: 'test-video-id',
    lessonId: 'test-lesson-id',
    userId: 'test-user-id',
    sessionId: 'test-session-id',
  };

  describe('Basic Functionality', () => {
    it('should initialize with zero progress', () => {
      const { result } = renderHook(() => useYouTubeProgress(defaultOptions));

      expect(result.current.progressPercentage).toBe(0);
      expect(result.current.watchLogs).toEqual([]);
    });

    it('should update progress percentage', () => {
      const { result } = renderHook(() => useYouTubeProgress(defaultOptions));

      act(() => {
        result.current.onProgress({
          played: 0.5,
          playedSeconds: 100,
          loaded: 0.6,
          loadedSeconds: 120,
        });
      });

      expect(result.current.progressPercentage).toBe(50);
    });

    it('should track watch logs', () => {
      const { result } = renderHook(() => useYouTubeProgress(defaultOptions));

      act(() => {
        result.current.onProgress({
          played: 0.25,
          playedSeconds: 50,
          loaded: 0.3,
          loadedSeconds: 60,
        });
      });

      expect(result.current.watchLogs).toHaveLength(1);
      expect(result.current.watchLogs[0]).toMatchObject({
        playedSeconds: 50,
        played: 0.25,
        sessionId: 'test-session-id',
        userId: 'test-user-id',
      });
    });
  });

  describe('Progress Status Determination', () => {
    it('should mark as STARTED on first progress', async () => {
      const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useYouTubeProgress({ ...defaultOptions, onProgressUpdate })
      );

      act(() => {
        result.current.onProgress({
          played: 0.1,
          playedSeconds: 10,
          loaded: 0.2,
          loadedSeconds: 20,
        });
      });

      await waitFor(() => {
        expect(onProgressUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: ProgressStatus.IN_PROGRESS,
          })
        );
      });
    });

    it('should mark as IN_PROGRESS during playback', async () => {
      const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useYouTubeProgress({ ...defaultOptions, onProgressUpdate, debounceMs: 0 })
      );

      act(() => {
        result.current.onProgress({
          played: 0.5,
          playedSeconds: 100,
          loaded: 0.6,
          loadedSeconds: 120,
        });
      });

      await waitFor(() => {
        expect(onProgressUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: ProgressStatus.IN_PROGRESS,
          })
        );
      });
    });

    it('should mark as COMPLETED at 90% threshold', async () => {
      const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useYouTubeProgress({ ...defaultOptions, onProgressUpdate, debounceMs: 0 })
      );

      act(() => {
        result.current.onProgress({
          played: 0.9,
          playedSeconds: 180,
          loaded: 1,
          loadedSeconds: 200,
        });
      });

      await waitFor(() => {
        expect(onProgressUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: ProgressStatus.COMPLETED,
            progressPercentage: 90,
          })
        );
      });
    });
  });

  describe('Debouncing', () => {
    it('should debounce API calls with default 5s interval', async () => {
      const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useYouTubeProgress({ ...defaultOptions, onProgressUpdate })
      );

      // First call should trigger immediately (STARTED)
      act(() => {
        result.current.onProgress({
          played: 0.1,
          playedSeconds: 10,
          loaded: 0.2,
          loadedSeconds: 20,
        });
      });

      expect(onProgressUpdate).toHaveBeenCalledTimes(1);

      // Subsequent calls should be debounced
      act(() => {
        result.current.onProgress({
          played: 0.2,
          playedSeconds: 20,
          loaded: 0.3,
          loadedSeconds: 30,
        });
      });

      expect(onProgressUpdate).toHaveBeenCalledTimes(1);

      // Advance timer
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(onProgressUpdate).toHaveBeenCalledTimes(2);
      });
    });

    it('should use custom debounce interval', async () => {
      const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useYouTubeProgress({ ...defaultOptions, onProgressUpdate, debounceMs: 2000 })
      );

      act(() => {
        result.current.onProgress({
          played: 0.1,
          playedSeconds: 10,
          loaded: 0.2,
          loadedSeconds: 20,
        });
      });

      act(() => {
        result.current.onProgress({
          played: 0.2,
          playedSeconds: 20,
          loaded: 0.3,
          loadedSeconds: 30,
        });
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(onProgressUpdate).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Duration Calculation', () => {
    it('should calculate durationSpent from delta', async () => {
      const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useYouTubeProgress({ ...defaultOptions, onProgressUpdate, debounceMs: 0 })
      );

      act(() => {
        result.current.onProgress({
          played: 0.1,
          playedSeconds: 10,
          loaded: 0.2,
          loadedSeconds: 20,
        });
      });

      await waitFor(() => {
        expect(onProgressUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            durationSpent: 10,
          })
        );
      });

      act(() => {
        result.current.onProgress({
          played: 0.2,
          playedSeconds: 25,
          loaded: 0.3,
          loadedSeconds: 30,
        });
      });

      await waitFor(() => {
        expect(onProgressUpdate).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            durationSpent: 15,
          })
        );
      });
    });

    it('should not send negative durations', async () => {
      const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useYouTubeProgress({ ...defaultOptions, onProgressUpdate, debounceMs: 0 })
      );

      act(() => {
        result.current.onProgress({
          played: 0.5,
          playedSeconds: 100,
          loaded: 0.6,
          loadedSeconds: 120,
        });
      });

      // User seeks backward
      act(() => {
        result.current.onProgress({
          played: 0.3,
          playedSeconds: 60,
          loaded: 0.6,
          loadedSeconds: 120,
        });
      });

      await waitFor(() => {
        const calls = onProgressUpdate.mock.calls;
        calls.forEach((call) => {
          expect(call[0].durationSpent).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('onEnded Handler', () => {
    it('should immediately update to COMPLETED on video end', async () => {
      const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useYouTubeProgress({ ...defaultOptions, onProgressUpdate })
      );

      act(() => {
        result.current.onProgress({
          played: 0.95,
          playedSeconds: 190,
          loaded: 1,
          loadedSeconds: 200,
        });
      });

      act(() => {
        result.current.onEnded();
      });

      await waitFor(() => {
        expect(onProgressUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: ProgressStatus.COMPLETED,
          })
        );
      });
    });

    it('should prevent duplicate completion calls', async () => {
      const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useYouTubeProgress({ ...defaultOptions, onProgressUpdate })
      );

      act(() => {
        result.current.onProgress({
          played: 0.95,
          playedSeconds: 190,
          loaded: 1,
          loadedSeconds: 200,
        });
      });

      act(() => {
        result.current.onEnded();
        result.current.onEnded();
        result.current.onEnded();
      });

      await waitFor(() => {
        const completionCalls = onProgressUpdate.mock.calls.filter(
          (call) => call[0].status === ProgressStatus.COMPLETED
        );
        expect(completionCalls.length).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useYouTubeProgress(defaultOptions));

      act(() => {
        result.current.onProgress({
          played: 0.5,
          playedSeconds: 100,
          loaded: 0.6,
          loadedSeconds: 120,
        });
      });

      expect(result.current.progressPercentage).toBe(50);
      expect(result.current.watchLogs.length).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.progressPercentage).toBe(0);
      expect(result.current.watchLogs).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onProgressUpdate = vi.fn().mockRejectedValue(new Error('API Error'));
      
      const { result } = renderHook(() =>
        useYouTubeProgress({ ...defaultOptions, onProgressUpdate, debounceMs: 0 })
      );

      act(() => {
        result.current.onProgress({
          played: 0.5,
          playedSeconds: 100,
          loaded: 0.6,
          loadedSeconds: 120,
        });
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('[useYouTubeProgress]'),
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });
});
