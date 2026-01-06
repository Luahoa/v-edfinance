import { useEffect, RefObject } from 'react';

interface UseVideoKeyboardOptions {
  videoRef: RefObject<HTMLVideoElement>;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (seconds: number) => void;
  enabled?: boolean;
}

export function useVideoKeyboard({
  videoRef,
  onPlayPause,
  onMuteToggle,
  onFullscreenToggle,
  onVolumeChange,
  onSeek,
  enabled = true,
}: UseVideoKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      switch (event.key.toLowerCase()) {
        case ' ':
        case 'k':
          event.preventDefault();
          onPlayPause();
          break;

        case 'arrowleft':
          event.preventDefault();
          onSeek(Math.max(0, video.currentTime - 5));
          break;

        case 'arrowright':
          event.preventDefault();
          onSeek(Math.min(video.duration, video.currentTime + 5));
          break;

        case 'arrowup':
          event.preventDefault();
          onVolumeChange(Math.min(1, video.volume + 0.1));
          break;

        case 'arrowdown':
          event.preventDefault();
          onVolumeChange(Math.max(0, video.volume - 0.1));
          break;

        case 'm':
          event.preventDefault();
          onMuteToggle();
          break;

        case 'f':
          event.preventDefault();
          onFullscreenToggle();
          break;

        case '0':
        case 'home':
          event.preventDefault();
          onSeek(0);
          break;

        case 'end':
          event.preventDefault();
          onSeek(video.duration);
          break;

        default:
          if (event.key >= '1' && event.key <= '9') {
            event.preventDefault();
            const percent = parseInt(event.key) * 10;
            onSeek((video.duration * percent) / 100);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    videoRef,
    onPlayPause,
    onMuteToggle,
    onFullscreenToggle,
    onVolumeChange,
    onSeek,
  ]);
}
