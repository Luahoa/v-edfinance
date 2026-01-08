'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import VideoControls from '@/components/atoms/VideoControls';
import { useVideoKeyboard } from '@/lib/hooks/useVideoKeyboard';

interface Subtitle {
  start: number;
  end: number;
  text: string;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  subtitles?: {
    vi?: string;
    en?: string;
    zh?: string;
  };
  onProgress?: (state: { played: number; playedSeconds: number }) => void;
  onEnded?: () => void;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  locale?: string;
}

export default function VideoPlayer({
  src,
  poster,
  subtitles,
  onProgress,
  onEnded,
  className = '',
  autoPlay = false,
  muted = false,
  locale = 'vi',
}: VideoPlayerProps) {
  const t = useTranslations('Video');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [parsedSubtitles, setParsedSubtitles] = useState<Subtitle[]>([]);
  const [showSubtitles, setShowSubtitles] = useState(true);

  useEffect(() => {
    if (subtitles && subtitles[locale as keyof typeof subtitles]) {
      const subtitleUrl = subtitles[locale as keyof typeof subtitles];
      if (subtitleUrl) {
        fetch(subtitleUrl)
          .then(res => res.text())
          .then(vtt => setParsedSubtitles(parseVTT(vtt)))
          .catch(err => console.error('Failed to load subtitles:', err));
      }
    }
  }, [subtitles, locale]);

  useEffect(() => {
    if (parsedSubtitles.length > 0) {
      const current = parsedSubtitles.find(
        sub => currentTime >= sub.start && currentTime <= sub.end
      );
      setCurrentSubtitle(current?.text || '');
    }
  }, [currentTime, parsedSubtitles]);

  const parseVTT = (vttContent: string): Subtitle[] => {
    const lines = vttContent.split('\n');
    const subtitles: Subtitle[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map(s => s.trim());
        const start = parseTimeToSeconds(startStr);
        const end = parseTimeToSeconds(endStr);
        
        i++;
        let text = '';
        while (i < lines.length && lines[i].trim() !== '') {
          text += lines[i].trim() + ' ';
          i++;
        }
        
        subtitles.push({ start, end, text: text.trim() });
      }
      i++;
    }
    
    return subtitles;
  };

  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const [hrs, mins, secs] = parts;
      return parseInt(hrs) * 3600 + parseInt(mins) * 60 + parseFloat(secs);
    } else if (parts.length === 2) {
      const [mins, secs] = parts;
      return parseInt(mins) * 60 + parseFloat(secs);
    }
    return parseFloat(timeStr);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onProgress) {
        onProgress({
          played: video.currentTime / video.duration,
          playedSeconds: video.currentTime,
        });
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onProgress, onEnded]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setCurrentTime(time);
  };

  const handlePlaybackRateChange = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleFullscreenToggle = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handlePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  useVideoKeyboard({
    videoRef,
    onPlayPause: handlePlayPause,
    onMuteToggle: handleMuteToggle,
    onFullscreenToggle: handleFullscreenToggle,
    onVolumeChange: handleVolumeChange,
    onSeek: handleSeek,
    enabled: true,
  });

  let hideControlsTimeout: NodeJS.Timeout;

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      className={`group relative aspect-video w-full overflow-hidden rounded-lg bg-black ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="h-full w-full"
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        onClick={handlePlayPause}
      >
        {subtitles && Object.entries(subtitles).map(([lang, url]) => (
          <track
            key={lang}
            kind="subtitles"
            src={url}
            srcLang={lang}
            label={lang.toUpperCase()}
            default={lang === locale}
          />
        ))}
      </video>

      {/* Subtitle Display */}
      {showSubtitles && currentSubtitle && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center px-4">
          <div className="rounded bg-black/80 px-4 py-2 text-center">
            <p className="text-lg font-semibold text-white drop-shadow-lg">
              {currentSubtitle}
            </p>
          </div>
        </div>
      )}

      <div
        className={`transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        <VideoControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          isFullscreen={isFullscreen}
          onPlayPause={handlePlayPause}
          onMuteToggle={handleMuteToggle}
          onVolumeChange={handleVolumeChange}
          onSeek={handleSeek}
          onPlaybackRateChange={handlePlaybackRateChange}
          onFullscreenToggle={handleFullscreenToggle}
          onPictureInPicture={handlePictureInPicture}
        />
      </div>
    </div>
  );
}
