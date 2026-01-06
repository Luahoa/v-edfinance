'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Play, Clock } from 'lucide-react';

interface VideoThumbnailProps {
  src: string;
  thumbnail?: string;
  duration?: number;
  title?: string;
  onClick?: () => void;
  className?: string;
  showDuration?: boolean;
  showPlayIcon?: boolean;
}

export default function VideoThumbnail({
  src,
  thumbnail,
  duration,
  title,
  onClick,
  className = '',
  showDuration = true,
  showPlayIcon = true,
}: VideoThumbnailProps) {
  const t = useTranslations('Video');
  const [isHovered, setIsHovered] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getThumbnailUrl = (): string => {
    if (thumbnail) return thumbnail;
    
    const videoId = extractYouTubeId(src);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    
    return '/placeholder-video.jpg';
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  return (
    <div
      className={`group relative aspect-video cursor-pointer overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Image */}
      <img
        src={getThumbnailUrl()}
        alt={title || t('thumbnailAlt')}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={() => setPreviewError(true)}
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Play Icon */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/50 p-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-black/70">
            <Play className="h-12 w-12 fill-white text-white" />
          </div>
        </div>
      )}

      {/* Duration Badge */}
      {showDuration && duration && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-xs font-semibold text-white">
          <Clock className="h-3 w-3" />
          {formatDuration(duration)}
        </div>
      )}

      {/* Title Overlay (on hover) */}
      {title && isHovered && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow-lg">
            {title}
          </p>
        </div>
      )}

      {/* Hover Preview (Future Enhancement) */}
      {isHovered && !previewError && (
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          {/* Video preview would go here - requires backend support */}
        </div>
      )}
    </div>
  );
}
