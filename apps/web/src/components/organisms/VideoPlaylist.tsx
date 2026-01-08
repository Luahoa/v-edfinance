'use client';

/**
 * Video Playlist Component - Track 4 (RedWave)
 * Epic: ved-59th - Video System Optimization
 * Bead: ved-o5ph - Add Video Playlist & Auto-play
 * 
 * Features:
 * - Display playlist with current video
 * - Auto-play next video on completion
 * - Shuffle, repeat modes
 * - Progress tracking
 * - Drag-and-drop reordering
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Repeat, 
  Repeat1, 
  Shuffle, 
  List, 
  GripVertical,
  X,
  Clock
} from 'lucide-react';

import {
  usePlaylistStore,
  useCurrentVideo,
  useHasNextVideo,
  usePlaylistVideos,
  useVideoProgress,
  type PlayMode,
  type VideoItem,
} from '@/lib/stores/playlist-store';

interface VideoPlaylistProps {
  className?: string;
  onVideoChange?: (video: VideoItem) => void;
  autoPlay?: boolean;
}

export default function VideoPlaylist({
  className = '',
  onVideoChange,
  autoPlay = true,
}: VideoPlaylistProps) {
  const t = useTranslations('VideoPlaylist');
  const tCommon = useTranslations('Common');

  // Store state
  const currentVideo = useCurrentVideo();
  const hasNextVideo = useHasNextVideo();
  const videos = usePlaylistVideos();
  const {
    isPlaying,
    playMode,
    currentVideoIndex,
    play,
    pause,
    nextVideo,
    previousVideo,
    playVideo,
    setPlayMode,
    removeVideo,
    reorderVideos,
    updateProgress,
    markVideoComplete,
  } = usePlaylistStore();

  // Local UI state
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-play on video end
  const handleVideoEnd = useCallback(() => {
    if (!currentVideo) return;

    markVideoComplete(currentVideo.id);

    if (autoPlay && hasNextVideo) {
      nextVideo();
    } else {
      pause();
    }
  }, [currentVideo, autoPlay, hasNextVideo, nextVideo, pause, markVideoComplete]);

  // Progress tracking simulation (replace with actual video player integration)
  useEffect(() => {
    if (isPlaying && currentVideo) {
      progressInterval.current = setInterval(() => {
        const currentProgress = useVideoProgress(currentVideo.id);
        if (currentProgress < currentVideo.duration) {
          updateProgress(currentVideo.id, currentProgress + 1);
        } else {
          handleVideoEnd();
        }
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, currentVideo, updateProgress, handleVideoEnd]);

  // Notify parent on video change
  useEffect(() => {
    if (currentVideo && onVideoChange) {
      onVideoChange(currentVideo);
    }
  }, [currentVideo, onVideoChange]);

  // Play mode cycling
  const cyclePlayMode = () => {
    const modes: PlayMode[] = ['NORMAL', 'REPEAT', 'REPEAT_ONE', 'SHUFFLE'];
    const currentIndex = modes.indexOf(playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPlayMode(modes[nextIndex]);
  };

  // Play mode icon
  const PlayModeIcon = () => {
    switch (playMode) {
      case 'REPEAT':
        return <Repeat className="w-5 h-5 text-primary" />;
      case 'REPEAT_ONE':
        return <Repeat1 className="w-5 h-5 text-primary" />;
      case 'SHUFFLE':
        return <Shuffle className="w-5 h-5 text-primary" />;
      default:
        return <Repeat className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, endIndex: number) => {
    e.preventDefault();
    const startIndex = parseInt(e.dataTransfer.getData('index'));
    if (startIndex !== endIndex) {
      reorderVideos(startIndex, endIndex);
    }
    setIsDragging(false);
    setDragOverIndex(null);
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentVideo) {
    return (
      <div className={`bg-card rounded-lg p-6 ${className}`}>
        <p className="text-muted-foreground text-center">
          {t('noPlaylist', { default: 'No playlist loaded' })}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg shadow-lg ${className}`}>
      {/* Video Display (placeholder - integrate with actual video player) */}
      <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white text-lg">
            {currentVideo.title.en || currentVideo.title.vi}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1">
              {currentVideo.title.en || currentVideo.title.vi}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentVideoIndex + 1} / {videos.length}
            </p>
          </div>

          {/* Toggle playlist visibility */}
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label={t('togglePlaylist', { default: 'Toggle playlist' })}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={cyclePlayMode}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label={t('playMode', { default: 'Play mode' })}
          >
            <PlayModeIcon />
          </button>

          <button
            onClick={previousVideo}
            disabled={currentVideoIndex === 0 && playMode === 'NORMAL'}
            className="p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
            aria-label={t('previous', { default: 'Previous' })}
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={isPlaying ? pause : play}
            className="p-4 bg-primary hover:bg-primary/90 rounded-full transition-colors"
            aria-label={isPlaying ? t('pause', { default: 'Pause' }) : t('play', { default: 'Play' })}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            )}
          </button>

          <button
            onClick={nextVideo}
            disabled={!hasNextVideo}
            className="p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
            aria-label={t('next', { default: 'Next' })}
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Playlist */}
      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto p-4 space-y-2">
              {videos.map((video, index) => {
                const progress = useVideoProgress(video.id);
                const progressPercent = (progress / video.duration) * 100;
                const isActive = index === currentVideoIndex;

                return (
                  <motion.div
                    key={video.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('index', index.toString());
                      handleDragStart(index);
                    }}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={() => {
                      setIsDragging(false);
                      setDragOverIndex(null);
                    }}
                    className={`
                      relative flex items-center gap-3 p-3 rounded-lg cursor-pointer
                      transition-colors group
                      ${isActive ? 'bg-primary/10 border-2 border-primary' : 'bg-accent/50 hover:bg-accent'}
                      ${dragOverIndex === index ? 'border-2 border-dashed border-primary' : ''}
                    `}
                    onClick={() => playVideo(index)}
                  >
                    {/* Drag handle */}
                    <div className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>

                    {/* Thumbnail placeholder */}
                    <div className="w-20 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title.en || video.title.vi}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Video info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium line-clamp-1 ${isActive ? 'text-primary' : ''}`}>
                        {video.title.en || video.title.vi}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(video.duration)}</span>
                        {progressPercent > 0 && (
                          <span>• {Math.round(progressPercent)}% watched</span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {progressPercent > 0 && (
                        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeVideo(video.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all"
                      aria-label={t('remove', { default: 'Remove' })}
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
