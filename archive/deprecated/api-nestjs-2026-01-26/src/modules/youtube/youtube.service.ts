import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * VED-YT2: YouTubeService - Fetch and validate YouTube video metadata
 *
 * Responsibilities:
 * - Fetch video metadata from YouTube Data API v3
 * - Cache metadata in-memory and in Lesson.duration
 * - Handle quota limits gracefully
 * - Anti-cheat: Server-side duration validation
 */

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number; // in seconds
}

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly metadataCache: Map<string, YouTubeMetadata> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = this.config.get<string>('YOUTUBE_API_KEY', '');

    if (!this.apiKey) {
      this.logger.warn(
        'YOUTUBE_API_KEY not set - YouTubeService will run in mock mode',
      );
    }

    this.client = axios.create({
      baseURL: 'https://www.googleapis.com/youtube/v3',
      timeout: 10000,
    });
  }

  /**
   * Extract YouTube video ID from URL
   * Supports formats:
   * - https://www.youtube.com/watch?v=VIDEO_ID
   * - https://youtu.be/VIDEO_ID
   * - yt:VIDEO_ID (internal format)
   */
  extractVideoId(url: string): string {
    // Internal format
    if (url.startsWith('yt:')) {
      return url.substring(3);
    }

    // Standard YouTube URLs
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^?&\s]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    throw new BadRequestException(
      `Invalid YouTube URL format: ${url}. Use https://youtube.com/watch?v=VIDEO_ID or yt:VIDEO_ID`,
    );
  }

  /**
   * Convert ISO 8601 duration (PT1M30S) to seconds
   */
  private parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) {
      this.logger.warn(`Failed to parse duration: ${isoDuration}`);
      return 0;
    }

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Fetch metadata from YouTube Data API v3
   * @param videoId YouTube video ID
   * @returns Video metadata (title, thumbnail, duration)
   */
  async fetchMetadata(videoId: string): Promise<YouTubeMetadata> {
    // Check in-memory cache first
    const cached = this.metadataCache.get(videoId);
    if (cached) {
      this.logger.log(`Cache HIT for videoId: ${videoId}`);
      return cached;
    }

    // Check database cache (Lesson table)
    const lessonCache = await this.findInLessonCache(videoId);
    if (lessonCache) {
      this.metadataCache.set(videoId, lessonCache);
      return lessonCache;
    }

    // Mock mode (no API key)
    if (!this.apiKey) {
      return this.getMockMetadata(videoId);
    }

    // Fetch from YouTube API
    try {
      this.logger.log(`Fetching metadata for videoId: ${videoId}`);

      const response = await this.client.get('/videos', {
        params: {
          part: 'snippet,contentDetails',
          id: videoId,
          key: this.apiKey,
        },
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new BadRequestException(`Video not found: ${videoId}`);
      }

      const video = response.data.items[0];
      const metadata: YouTubeMetadata = {
        videoId,
        title: video.snippet.title,
        thumbnail:
          video.snippet.thumbnails.maxresdefault?.url ||
          video.snippet.thumbnails.high?.url ||
          video.snippet.thumbnails.default?.url,
        duration: this.parseDuration(video.contentDetails.duration),
      };

      // Cache in memory
      this.metadataCache.set(videoId, metadata);

      // Schedule cache cleanup (TTL)
      setTimeout(() => {
        this.metadataCache.delete(videoId);
        this.logger.debug(`Cache expired for videoId: ${videoId}`);
      }, this.CACHE_TTL);

      return metadata;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 403) {
          this.logger.error('YouTube API quota exceeded', error.response.data);
          throw new InternalServerErrorException(
            'YouTube API quota exceeded. Please try again later.',
          );
        }
        if (error.response?.status === 400) {
          throw new BadRequestException(
            `Invalid video ID: ${videoId}`,
            error.response.data,
          );
        }
      }

      this.logger.error('Failed to fetch YouTube metadata', error);
      throw new InternalServerErrorException(
        'Failed to fetch video metadata from YouTube',
      );
    }
  }

  /**
   * Find metadata in Lesson cache (DB)
   */
  private async findInLessonCache(
    videoId: string,
  ): Promise<YouTubeMetadata | null> {
    try {
      const lesson = await this.prisma.lesson.findFirst({
        where: {
          videoKey: {
            path: ['videoId'],
            equals: videoId,
          },
        },
        select: {
          videoKey: true,
          duration: true,
        },
      });

      if (lesson && lesson.videoKey && lesson.duration) {
        const metadata = lesson.videoKey as any;
        return {
          videoId: metadata.videoId,
          title: metadata.title || 'Unknown',
          thumbnail: metadata.thumbnail || '',
          duration: lesson.duration,
        };
      }
    } catch (error) {
      this.logger.warn('Failed to query lesson cache', error);
    }

    return null;
  }

  /**
   * Mock metadata for testing (when API key not available)
   */
  private getMockMetadata(videoId: string): YouTubeMetadata {
    this.logger.warn(`Returning MOCK metadata for videoId: ${videoId}`);
    return {
      videoId,
      title: `Mock Video Title - ${videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      duration: 300, // 5 minutes default
    };
  }

  /**
   * Clear all caches (for testing)
   */
  clearCache(): void {
    this.metadataCache.clear();
    this.logger.log('All caches cleared');
  }

  /**
   * Get cache stats (for monitoring)
   */
  getCacheStats(): { size: number; videoIds: string[] } {
    return {
      size: this.metadataCache.size,
      videoIds: Array.from(this.metadataCache.keys()),
    };
  }
}
