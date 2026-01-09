import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * ved-ydjb: ThumbnailService - Video thumbnail & preview generation
 *
 * Responsibilities:
 * - Auto-generate thumbnails at 25%/50%/75% of video duration
 * - Generate hover preview clips (5 seconds)
 * - Add duration badge overlay
 * - Support WebM preview format
 *
 * Tech Stack:
 * - FFmpeg for thumbnail extraction
 * - Sharp for image processing (optional)
 * - Worker threads for async generation
 */

export interface ThumbnailPosition {
  percent: number;
  timestamp: string; // HH:MM:SS format
  path: string;
}

export interface VideoThumbnails {
  videoId: string;
  primaryThumbnail: string;
  thumbnails: ThumbnailPosition[];
  previewClipUrl?: string;
  duration: number;
  durationFormatted: string;
}

export interface ThumbnailJob {
  id: string;
  videoId: string;
  inputPath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  result?: VideoThumbnails;
  createdAt: Date;
  completedAt?: Date;
}

interface ThumbnailConfig {
  positions: number[]; // Percentages (e.g., [25, 50, 75])
  previewDuration: number; // Preview clip duration in seconds
  thumbnailWidth: number; // Default thumbnail width
  thumbnailFormat: 'jpg' | 'png' | 'webp';
  previewFormat: 'webm' | 'mp4' | 'gif';
}

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);
  private readonly jobs: Map<string, ThumbnailJob> = new Map();
  private readonly thumbnails: Map<string, VideoThumbnails> = new Map();

  // Default configuration for educational content
  private readonly config_: ThumbnailConfig = {
    positions: [25, 50, 75],
    previewDuration: 5,
    thumbnailWidth: 640,
    thumbnailFormat: 'jpg',
    previewFormat: 'webm',
  };

  constructor(private readonly configService: ConfigService) {
    this.logger.log('ThumbnailService initialized');
  }

  /**
   * Create thumbnail generation job for video
   * @param videoId Unique video identifier
   * @param inputPath Path to video file
   * @param duration Video duration in seconds (required for position calculation)
   */
  async createThumbnailJob(
    videoId: string,
    inputPath: string,
    duration: number,
  ): Promise<string> {
    const jobId = this.generateJobId();

    const job: ThumbnailJob = {
      id: jobId,
      videoId,
      inputPath,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.logger.log(
      `Created thumbnail job ${jobId} for video ${videoId}`,
    );

    // Start thumbnail generation in background
    this.processThumbnailJob(jobId, duration).catch(error => {
      this.logger.error(`Thumbnail job ${jobId} failed`, error);
      const failedJob = this.jobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = error.message;
      }
    });

    return jobId;
  }

  /**
   * Get thumbnail job status
   */
  getJobStatus(jobId: string): ThumbnailJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get thumbnails for video
   */
  getThumbnails(videoId: string): VideoThumbnails | null {
    return this.thumbnails.get(videoId) || null;
  }

  /**
   * Get primary thumbnail URL for video
   */
  getPrimaryThumbnail(videoId: string): string {
    const thumbs = this.thumbnails.get(videoId);
    if (!thumbs) {
      throw new NotFoundException(`Thumbnails not found for video ${videoId}`);
    }
    return thumbs.primaryThumbnail;
  }

  /**
   * Check if video has thumbnails
   */
  hasThumbnails(videoId: string): boolean {
    return this.thumbnails.has(videoId);
  }

  /**
   * Process thumbnail generation job
   * NOTE: Actual ffmpeg extraction pending - this is a stub for ved-ydjb
   */
  private async processThumbnailJob(
    jobId: string,
    duration: number,
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.status = 'processing';
    this.logger.log(`Starting thumbnail generation for job ${jobId}`);

    const thumbnailPositions: ThumbnailPosition[] = [];
    const totalSteps = this.config_.positions.length + 1; // +1 for preview clip

    // Generate thumbnails at specified positions
    for (let i = 0; i < this.config_.positions.length; i++) {
      const percent = this.config_.positions[i];
      const timestamp = this.calculateTimestamp(duration, percent);
      
      this.logger.log(
        `Extracting thumbnail at ${percent}% (${timestamp}) for job ${jobId}`,
      );

      // Simulate thumbnail extraction
      const thumbnailPath = await this.extractThumbnail(
        job.videoId,
        job.inputPath,
        percent,
        timestamp,
      );

      thumbnailPositions.push({
        percent,
        timestamp,
        path: thumbnailPath,
      });

      job.progress = ((i + 1) / totalSteps) * 100;
    }

    // Generate preview clip
    this.logger.log(`Generating preview clip for job ${jobId}`);
    const previewClipUrl = await this.generatePreviewClip(
      job.videoId,
      job.inputPath,
      duration,
    );
    job.progress = 100;

    // Store result
    const result: VideoThumbnails = {
      videoId: job.videoId,
      primaryThumbnail: thumbnailPositions[1]?.path || thumbnailPositions[0]?.path,
      thumbnails: thumbnailPositions,
      previewClipUrl,
      duration,
      durationFormatted: this.formatDuration(duration),
    };

    this.thumbnails.set(job.videoId, result);
    job.result = result;
    job.status = 'completed';
    job.completedAt = new Date();

    this.logger.log(`Thumbnail job ${jobId} completed`);
  }

  /**
   * Extract thumbnail at specific position
   * TODO ved-ydjb: Replace with actual ffmpeg extraction
   *
   * FFmpeg command example:
   * ffmpeg -ss 00:01:30 -i input.mp4 -frames:v 1 -q:v 2 thumbnail.jpg
   */
  private async extractThumbnail(
    videoId: string,
    inputPath: string,
    percent: number,
    timestamp: string,
  ): Promise<string> {
    // Simulate extraction time
    await new Promise(resolve => setTimeout(resolve, 50));

    const basePath = this.getThumbnailBasePath(videoId);
    return `${basePath}/thumb_${percent}.${this.config_.thumbnailFormat}`;
  }

  /**
   * Generate 5-second preview clip
   * TODO ved-ydjb: Replace with actual ffmpeg WebM generation
   *
   * FFmpeg command example:
   * ffmpeg -ss 00:00:30 -i input.mp4 -t 5 -c:v libvpx-vp9 -b:v 300k -an preview.webm
   */
  private async generatePreviewClip(
    videoId: string,
    inputPath: string,
    duration: number,
  ): Promise<string> {
    // Simulate preview generation
    await new Promise(resolve => setTimeout(resolve, 100));

    const basePath = this.getThumbnailBasePath(videoId);
    return `${basePath}/preview.${this.config_.previewFormat}`;
  }

  /**
   * Calculate timestamp from percentage
   */
  private calculateTimestamp(duration: number, percent: number): string {
    const seconds = Math.floor(duration * (percent / 100));
    return this.formatDuration(seconds);
  }

  /**
   * Format duration as HH:MM:SS
   */
  private formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Helper: Generate unique job ID
   */
  private generateJobId(): string {
    return `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Helper: Get thumbnail base path for video
   */
  private getThumbnailBasePath(videoId: string): string {
    const baseUrl = this.configService.get<string>('CDN_BASE_URL', '/videos');
    return `${baseUrl}/${videoId}/thumbnails`;
  }

  /**
   * Clean up old thumbnail jobs
   */
  async cleanupOldJobs(): Promise<number> {
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000; // 24 hours
    let deleted = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        job.status === 'completed' &&
        job.completedAt &&
        job.completedAt.getTime() < cutoff
      ) {
        this.jobs.delete(jobId);
        deleted++;
      }
    }

    if (deleted > 0) {
      this.logger.log(`Cleaned up ${deleted} old thumbnail jobs`);
    }

    return deleted;
  }

  /**
   * Get service statistics
   */
  getStats(): {
    activeJobs: number;
    completedJobs: number;
    videosWithThumbnails: number;
  } {
    const jobs = Array.from(this.jobs.values());
    return {
      activeJobs: jobs.filter(j => j.status === 'processing').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      videosWithThumbnails: this.thumbnails.size,
    };
  }

  /**
   * Get thumbnail for hover preview (for frontend component)
   */
  getHoverThumbnails(videoId: string): ThumbnailPosition[] | null {
    const thumbs = this.thumbnails.get(videoId);
    return thumbs?.thumbnails || null;
  }

  /**
   * Get duration badge info for video card
   */
  getDurationBadge(videoId: string): { formatted: string; seconds: number } | null {
    const thumbs = this.thumbnails.get(videoId);
    if (!thumbs) return null;
    return {
      formatted: thumbs.durationFormatted,
      seconds: thumbs.duration,
    };
  }
}
