'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ved-yil5: useVideoLazyLoad - Intersection Observer hook for lazy video loading
 *
 * Features:
 * - Detects when video enters viewport
 * - Configurable threshold and root margin
 * - Automatic cleanup on unmount
 * - Performance: Only loads videos when needed
 *
 * Usage:
 * ```tsx
 * const { isInView, ref } = useVideoLazyLoad({
 *   enabled: true,
 *   threshold: 0.25, // Load when 25% visible
 *   rootMargin: '100px', // Preload 100px before entering
 * });
 * ```
 */

interface UseVideoLazyLoadOptions {
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseVideoLazyLoadReturn {
  isInView: boolean;
  ref: React.RefObject<HTMLDivElement>;
}

export function useVideoLazyLoad({
  enabled = true,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
}: UseVideoLazyLoadOptions = {}): UseVideoLazyLoadReturn {
  const [isInView, setIsInView] = useState(!enabled); // If disabled, always in view
  const ref = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // If lazy loading disabled, mark as in view
    if (!enabled) {
      setIsInView(true);
      return;
    }

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true); // Fallback: Load immediately
      return;
    }

    const element = ref.current;
    if (!element) return;

    // Create observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);

          // Disconnect after first intersection if triggerOnce
          if (triggerOnce && observerRef.current) {
            observerRef.current.disconnect();
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Start observing
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, threshold, rootMargin, triggerOnce]);

  return {
    isInView,
    ref,
  };
}

/**
 * Preload video metadata without loading full video
 * Useful for showing duration, thumbnail, etc.
 */
export function useVideoMetadataPreload(videoUrl: string | undefined): {
  duration: number | null;
  loading: boolean;
} {
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoUrl) {
      setLoading(false);
      return;
    }

    // Create hidden video element to load metadata
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = videoUrl;

    const handleMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };

    const handleError = () => {
      setLoading(false);
    };

    video.addEventListener('loadedmetadata', handleMetadata);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleMetadata);
      video.removeEventListener('error', handleError);
      video.src = ''; // Release resources
    };
  }, [videoUrl]);

  return {
    duration,
    loading,
  };
}
