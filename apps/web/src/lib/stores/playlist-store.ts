/**
 * Video Playlist Store - Track 4 (RedWave)
 * Epic: ved-59th - Video System Optimization
 * Bead: ved-o5ph - Add Video Playlist & Auto-play
 * 
 * Learnings from quizStore.ts:
 * - Use persist middleware with user-specific keys
 * - Partialize to exclude transient UI states
 * - Export selectors for memoization
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export interface VideoItem {
  id: string;
  title: Record<string, string>; // Localized: { vi, en, zh }
  description?: Record<string, string>;
  duration: number; // in seconds
  url: string;
  thumbnailUrl?: string;
  lessonId?: string;
  type: 'YOUTUBE' | 'FILE';
}

export interface Playlist {
  id: string;
  name: Record<string, string>; // Localized
  videos: VideoItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type PlayMode = 'NORMAL' | 'SHUFFLE' | 'REPEAT' | 'REPEAT_ONE';

interface PlaylistState {
  // State
  currentPlaylist: Playlist | null;
  currentVideoIndex: number;
  playMode: PlayMode;
  isPlaying: boolean;
  
  // Progress tracking
  videoProgress: Record<string, number>; // { videoId: watchedSeconds }
  
  // UI states (NOT persisted)
  isLoading: boolean;
  error: string | null;

  // Actions - Playlist Management
  loadPlaylist: (playlist: Playlist) => void;
  addVideo: (video: VideoItem) => void;
  removeVideo: (videoId: string) => void;
  reorderVideos: (startIndex: number, endIndex: number) => void;
  
  // Actions - Playback Control
  play: () => void;
  pause: () => void;
  playVideo: (index: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  setPlayMode: (mode: PlayMode) => void;
  
  // Actions - Progress Tracking
  updateProgress: (videoId: string, seconds: number) => void;
  markVideoComplete: (videoId: string) => void;
  
  // Actions - Auto-play Logic
  shouldAutoPlay: () => boolean;
  getNextVideoIndex: () => number | null;
  
  // Actions - Reset
  reset: () => void;
  clearError: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentPlaylist: null,
      currentVideoIndex: 0,
      playMode: 'NORMAL',
      isPlaying: false,
      videoProgress: {},
      isLoading: false,
      error: null,

      // Playlist Management
      loadPlaylist: (playlist) => {
        set({
          currentPlaylist: playlist,
          currentVideoIndex: 0,
          error: null,
        });
      },

      addVideo: (video) => {
        const state = get();
        if (!state.currentPlaylist) {
          set({ error: 'No playlist loaded' });
          return;
        }

        set({
          currentPlaylist: {
            ...state.currentPlaylist,
            videos: [...state.currentPlaylist.videos, video],
            updatedAt: new Date(),
          },
        });
      },

      removeVideo: (videoId) => {
        const state = get();
        if (!state.currentPlaylist) return;

        const newVideos = state.currentPlaylist.videos.filter(
          (v) => v.id !== videoId
        );

        set({
          currentPlaylist: {
            ...state.currentPlaylist,
            videos: newVideos,
            updatedAt: new Date(),
          },
          // Adjust current index if needed
          currentVideoIndex:
            state.currentVideoIndex >= newVideos.length
              ? Math.max(0, newVideos.length - 1)
              : state.currentVideoIndex,
        });
      },

      reorderVideos: (startIndex, endIndex) => {
        const state = get();
        if (!state.currentPlaylist) return;

        const videos = [...state.currentPlaylist.videos];
        const [removed] = videos.splice(startIndex, 1);
        videos.splice(endIndex, 0, removed);

        set({
          currentPlaylist: {
            ...state.currentPlaylist,
            videos,
            updatedAt: new Date(),
          },
        });
      },

      // Playback Control
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),

      playVideo: (index) => {
        const state = get();
        if (!state.currentPlaylist) return;

        if (index >= 0 && index < state.currentPlaylist.videos.length) {
          set({
            currentVideoIndex: index,
            isPlaying: true,
            error: null,
          });
        }
      },

      nextVideo: () => {
        const state = get();
        const nextIndex = state.getNextVideoIndex();

        if (nextIndex !== null) {
          set({
            currentVideoIndex: nextIndex,
            isPlaying: true,
          });
        } else {
          // End of playlist (no repeat)
          set({ isPlaying: false });
        }
      },

      previousVideo: () => {
        const state = get();
        if (!state.currentPlaylist) return;

        const prevIndex =
          state.currentVideoIndex > 0
            ? state.currentVideoIndex - 1
            : state.playMode === 'REPEAT'
            ? state.currentPlaylist.videos.length - 1
            : 0;

        set({
          currentVideoIndex: prevIndex,
          isPlaying: true,
        });
      },

      setPlayMode: (mode) => set({ playMode: mode }),

      // Progress Tracking
      updateProgress: (videoId, seconds) => {
        const state = get();
        set({
          videoProgress: {
            ...state.videoProgress,
            [videoId]: seconds,
          },
        });
      },

      markVideoComplete: (videoId) => {
        const state = get();
        const video = state.currentPlaylist?.videos.find((v) => v.id === videoId);
        if (!video) return;

        set({
          videoProgress: {
            ...state.videoProgress,
            [videoId]: video.duration,
          },
        });
      },

      // Auto-play Logic
      shouldAutoPlay: () => {
        const state = get();
        return state.isPlaying && state.playMode !== 'REPEAT_ONE';
      },

      getNextVideoIndex: () => {
        const state = get();
        if (!state.currentPlaylist) return null;

        const { videos } = state.currentPlaylist;
        const { currentVideoIndex, playMode } = state;

        switch (playMode) {
          case 'REPEAT_ONE':
            return currentVideoIndex;

          case 'REPEAT':
            return (currentVideoIndex + 1) % videos.length;

          case 'SHUFFLE': {
            // Simple shuffle: random video (excluding current)
            const availableIndices = videos
              .map((_, i) => i)
              .filter((i) => i !== currentVideoIndex);
            
            if (availableIndices.length === 0) return null;
            
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            return availableIndices[randomIndex];
          }

          case 'NORMAL':
          default:
            if (currentVideoIndex < videos.length - 1) {
              return currentVideoIndex + 1;
            }
            return null;
        }
      },

      // Reset
      reset: () => {
        set({
          currentPlaylist: null,
          currentVideoIndex: 0,
          playMode: 'NORMAL',
          isPlaying: false,
          videoProgress: {},
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'playlist-storage',
      // Partialize: exclude transient UI states
      partialize: (state) => ({
        currentPlaylist: state.currentPlaylist,
        currentVideoIndex: state.currentVideoIndex,
        playMode: state.playMode,
        videoProgress: state.videoProgress,
        // Exclude: isPlaying, isLoading, error
      }),
    }
  )
);

// ============================================================================
// SELECTORS (for memoization)
// ============================================================================

export const useCurrentVideo = () =>
  usePlaylistStore((state) => {
    if (!state.currentPlaylist) return null;
    return state.currentPlaylist.videos[state.currentVideoIndex] || null;
  });

export const useHasNextVideo = () =>
  usePlaylistStore((state) => state.getNextVideoIndex() !== null);

export const useVideoProgress = (videoId: string) =>
  usePlaylistStore((state) => state.videoProgress[videoId] || 0);

export const usePlaylistVideos = () =>
  usePlaylistStore((state) => state.currentPlaylist?.videos || []);
