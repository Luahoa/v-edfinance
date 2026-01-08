/**
 * Offline Video Service - Track 4 (RedWave)
 * Epic: ved-59th - Video System Optimization
 * Bead: ved-k3xr - Implement Offline Video Download
 * 
 * Features:
 * - Download videos for offline viewing
 * - Store in IndexedDB with metadata
 * - Manage storage quota
 * - Auto-cleanup old downloads
 * - Progress tracking for downloads
 * 
 * Tech: IndexedDB, Fetch API with streams
 */

export interface OfflineVideo {
  id: string;
  videoId: string;
  title: Record<string, string>; // Localized
  url: string;
  blob: Blob;
  size: number; // in bytes
  downloadedAt: Date;
  lastAccessedAt: Date;
  metadata: {
    duration: number;
    thumbnailUrl?: string;
    lessonId?: string;
  };
}

export interface DownloadProgress {
  videoId: string;
  loaded: number;
  total: number;
  percentage: number;
  status: 'downloading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

const DB_NAME = 'v-edfinance-offline-videos';
const DB_VERSION = 1;
const STORE_NAME = 'videos';
const MAX_STORAGE_MB = 500; // 500MB max storage
const CLEANUP_THRESHOLD_MB = 450; // Cleanup when reaching 450MB
const MAX_AGE_DAYS = 30; // Auto-cleanup videos older than 30 days

class OfflineVideoService {
  private db: IDBDatabase | null = null;
  private activeDownloads = new Map<string, AbortController>();
  private progressCallbacks = new Map<string, (progress: DownloadProgress) => void>();

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('videoId', 'videoId', { unique: true });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
          store.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
        }
      };
    });
  }

  /**
   * Download video for offline viewing
   */
  async downloadVideo(
    videoId: string,
    url: string,
    title: Record<string, string>,
    metadata: OfflineVideo['metadata'],
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    await this.init();

    // Check if already downloaded
    const existing = await this.getOfflineVideo(videoId);
    if (existing) {
      throw new Error('Video already downloaded');
    }

    // Check storage quota
    const canStore = await this.checkStorageQuota();
    if (!canStore) {
      await this.cleanup();
      const stillCannotStore = await this.checkStorageQuota();
      if (stillCannotStore) {
        throw new Error('Insufficient storage space');
      }
    }

    // Setup download
    const abortController = new AbortController();
    this.activeDownloads.set(videoId, abortController);

    if (onProgress) {
      this.progressCallbacks.set(videoId, onProgress);
    }

    try {
      const response = await fetch(url, { signal: abortController.signal });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0');
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Stream not available');
      }

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        const progress: DownloadProgress = {
          videoId,
          loaded,
          total: contentLength,
          percentage: contentLength ? (loaded / contentLength) * 100 : 0,
          status: 'downloading',
        };

        onProgress?.(progress);
      }

      // Create blob from chunks
      const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'video/mp4' });

      // Store in IndexedDB
      const offlineVideo: Omit<OfflineVideo, 'id'> = {
        videoId,
        title,
        url,
        blob,
        size: blob.size,
        downloadedAt: new Date(),
        lastAccessedAt: new Date(),
        metadata,
      };

      await this.saveVideo(offlineVideo);

      onProgress?.({
        videoId,
        loaded,
        total: contentLength,
        percentage: 100,
        status: 'completed',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      
      onProgress?.({
        videoId,
        loaded: 0,
        total: 0,
        percentage: 0,
        status: 'failed',
        error: errorMessage,
      });

      throw error;
    } finally {
      this.activeDownloads.delete(videoId);
      this.progressCallbacks.delete(videoId);
    }
  }

  /**
   * Cancel active download
   */
  cancelDownload(videoId: string): void {
    const controller = this.activeDownloads.get(videoId);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(videoId);

      const callback = this.progressCallbacks.get(videoId);
      callback?.({
        videoId,
        loaded: 0,
        total: 0,
        percentage: 0,
        status: 'cancelled',
      });

      this.progressCallbacks.delete(videoId);
    }
  }

  /**
   * Get offline video
   */
  async getOfflineVideo(videoId: string): Promise<OfflineVideo | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('videoId');
      const request = index.get(videoId);

      request.onsuccess = () => {
        const video = request.result as OfflineVideo | undefined;

        if (video) {
          // Update last accessed time
          this.updateLastAccessed(video.id);
        }

        resolve(video || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all offline videos
   */
  async getAllOfflineVideos(): Promise<OfflineVideo[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as OfflineVideo[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete offline video
   */
  async deleteOfflineVideo(videoId: string): Promise<void> {
    await this.init();

    const video = await this.getOfflineVideo(videoId);
    if (!video) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(video.id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get total storage used
   */
  async getTotalStorageUsed(): Promise<number> {
    const videos = await this.getAllOfflineVideos();
    return videos.reduce((total, video) => total + video.size, 0);
  }

  /**
   * Get storage quota info
   */
  async getStorageInfo(): Promise<{
    used: number;
    available: number;
    percentage: number;
    maxStorage: number;
  }> {
    const used = await this.getTotalStorageUsed();
    const maxStorage = MAX_STORAGE_MB * 1024 * 1024; // Convert MB to bytes
    const available = maxStorage - used;
    const percentage = (used / maxStorage) * 100;

    return {
      used,
      available,
      percentage,
      maxStorage,
    };
  }

  /**
   * Check if storage quota allows new download
   */
  async checkStorageQuota(): Promise<boolean> {
    const info = await this.getStorageInfo();
    return info.percentage < (CLEANUP_THRESHOLD_MB / MAX_STORAGE_MB) * 100;
  }

  /**
   * Cleanup old videos to free space
   */
  async cleanup(): Promise<void> {
    const videos = await this.getAllOfflineVideos();
    const now = new Date();
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000; // Convert days to ms

    // Sort by last accessed (oldest first)
    const sortedVideos = videos.sort(
      (a, b) => new Date(a.lastAccessedAt).getTime() - new Date(b.lastAccessedAt).getTime()
    );

    // Delete old videos
    for (const video of sortedVideos) {
      const age = now.getTime() - new Date(video.lastAccessedAt).getTime();

      if (age > maxAge) {
        await this.deleteOfflineVideo(video.videoId);
      }
    }

    // If still over threshold, delete oldest videos
    const info = await this.getStorageInfo();
    if (info.percentage >= (CLEANUP_THRESHOLD_MB / MAX_STORAGE_MB) * 100) {
      // Delete oldest 20% of videos
      const deleteCount = Math.ceil(sortedVideos.length * 0.2);
      for (let i = 0; i < deleteCount; i++) {
        await this.deleteOfflineVideo(sortedVideos[i].videoId);
      }
    }
  }

  /**
   * Check if video is available offline
   */
  async isAvailableOffline(videoId: string): Promise<boolean> {
    const video = await this.getOfflineVideo(videoId);
    return video !== null;
  }

  /**
   * Get video blob URL for playback
   */
  async getVideoUrl(videoId: string): Promise<string | null> {
    const video = await this.getOfflineVideo(videoId);
    if (!video) return null;

    return URL.createObjectURL(video.blob);
  }

  // Private methods

  private async saveVideo(video: Omit<OfflineVideo, 'id'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(video);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async updateLastAccessed(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const video = getRequest.result as OfflineVideo;
        video.lastAccessedAt = new Date();

        const putRequest = store.put(video);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}

// Export singleton instance
export const offlineVideoService = new OfflineVideoService();
