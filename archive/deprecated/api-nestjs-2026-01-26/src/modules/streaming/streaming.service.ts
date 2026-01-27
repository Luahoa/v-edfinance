import { Injectable, Logger } from '@nestjs/common';
import { CDNService } from '../cdn/cdn.service';

export interface TranscodingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoKey: string;
  qualities: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface HLSManifest {
  manifestUrl: string;
  qualities: string[];
  duration: number;
  format: 'hls';
}

export interface StreamingMetrics {
  videoKey: string;
  bandwidth: number;
  storageUsed: number;
  viewCount: number;
  avgBufferTime: number;
}

@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);
  private transcodingJobs = new Map<string, TranscodingJob>();

  constructor(private readonly cdnService: CDNService) {}

  async uploadVideo(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<{ videoKey: string; cdnUrl: string; size: number }> {
    this.logger.log(`Uploading video: ${fileName}`);

    const result = await this.cdnService.uploadVideo(buffer, fileName, mimeType);

    return {
      videoKey: result.key,
      cdnUrl: result.cdnUrl,
      size: result.size,
    };
  }

  async queueTranscoding(
    videoKey: string,
    qualities: string[] = ['360p', '720p', '1080p'],
  ): Promise<TranscodingJob> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const job: TranscodingJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      videoKey,
      qualities,
      createdAt: new Date(),
    };

    this.transcodingJobs.set(jobId, job);

    this.logger.log(`Transcoding job queued: ${jobId} for ${videoKey}`);

    this.simulateTranscoding(jobId);

    return job;
  }

  private async simulateTranscoding(jobId: string): Promise<void> {
    const job = this.transcodingJobs.get(jobId);
    if (!job) return;

    job.status = 'processing';

    const intervals = [0, 25, 50, 75, 100];
    for (const progress of intervals) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      job.progress = progress;
      this.logger.debug(`Job ${jobId} progress: ${progress}%`);
    }

    job.status = 'completed';
    job.completedAt = new Date();
    this.logger.log(`Transcoding completed: ${jobId}`);
  }

  async getHLSManifest(videoKey: string): Promise<HLSManifest | null> {
    const metadata = await this.cdnService.getVideoMetadata(videoKey);

    if (!metadata.exists) {
      return null;
    }

    const manifestUrl = await this.cdnService.getCDNUrl(`${videoKey}/manifest.m3u8`);

    return {
      manifestUrl,
      qualities: ['360p', '720p', '1080p'],
      duration: 0,
      format: 'hls',
    };
  }

  async getMetrics(videoKey: string): Promise<StreamingMetrics> {
    const metadata = await this.cdnService.getVideoMetadata(videoKey);

    return {
      videoKey,
      bandwidth: 0,
      storageUsed: metadata.size || 0,
      viewCount: 0,
      avgBufferTime: 0,
    };
  }

  async getJobStatus(jobId: string): Promise<TranscodingJob | null> {
    return this.transcodingJobs.get(jobId) || null;
  }

  async getHealthStatus(): Promise<{ queueSize: number; activeJobs: number }> {
    const jobs = Array.from(this.transcodingJobs.values());

    return {
      queueSize: jobs.filter((j) => j.status === 'pending').length,
      activeJobs: jobs.filter((j) => j.status === 'processing').length,
    };
  }
}
