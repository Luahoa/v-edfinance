import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * ved-ifoa: HLSGeneratorService - Adaptive bitrate streaming with HLS
 *
 * Responsibilities:
 * - Convert compressed videos to HLS format (.m3u8 + .ts segments)
 * - Generate adaptive bitrate streaming manifests
 * - Support quality switching based on network conditions
 * - Provide fallback to progressive download for unsupported browsers
 *
 * HLS Format:
 * - Master playlist (.m3u8) with multiple quality variants
 * - Segment files (.ts) for each quality level
 * - 10-second segments for optimal buffering
 *
 * Browser Support:
 * - Native: Safari, iOS Safari
 * - hls.js: Chrome, Firefox, Edge
 * - Fallback: Progressive download for old browsers
 */

export interface HLSVariant {
  resolution: string;
  bandwidth: number;
  path: string;
}

export interface HLSManifest {
  masterPlaylistUrl: string;
  variants: HLSVariant[];
  segmentDuration: number;
  totalDuration: number;
}

export interface HLSGenerationJob {
  id: string;
  videoId: string;
  inputPaths: Record<string, string>; // quality -> file path
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  manifestUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

@Injectable()
export class HLSGeneratorService {
  private readonly logger = new Logger(HLSGeneratorService.name);
  private readonly jobs: Map<string, HLSGenerationJob> = new Map();
  private readonly manifests: Map<string, HLSManifest> = new Map();

  // HLS configuration
  private readonly SEGMENT_DURATION = 10; // seconds
  private readonly SEGMENT_LIST_SIZE = 5; // number of segments in memory

  // Bandwidth mapping for adaptive streaming
  private readonly BANDWIDTH_MAP: Record<string, number> = {
    '360p': 600000, // 600 Kbps
    '480p': 1000000, // 1 Mbps
    '720p': 2000000, // 2 Mbps
    '1080p': 4000000, // 4 Mbps
  };

  constructor(private readonly config: ConfigService) {
    this.logger.log('HLSGeneratorService initialized');
  }

  /**
   * Create HLS generation job from compressed videos
   * @param videoId Unique video identifier
   * @param inputPaths Map of quality level to file path
   * @returns Job ID for tracking
   */
  async createHLSJob(
    videoId: string,
    inputPaths: Record<string, string>,
  ): Promise<string> {
    const jobId = this.generateJobId();

    const job: HLSGenerationJob = {
      id: jobId,
      videoId,
      inputPaths,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.logger.log(
      `Created HLS job ${jobId} for video ${videoId} with ${Object.keys(inputPaths).length} quality levels`,
    );

    // Start HLS generation in background
    this.processHLSJob(jobId).catch(error => {
      this.logger.error(`HLS job ${jobId} failed`, error);
      const failedJob = this.jobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = error.message;
      }
    });

    return jobId;
  }

  /**
   * Get HLS job status
   */
  getJobStatus(jobId: string): HLSGenerationJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get HLS manifest for video
   */
  getManifest(videoId: string): HLSManifest | null {
    return this.manifests.get(videoId) || null;
  }

  /**
   * Get HLS manifest URL for playback
   */
  getManifestUrl(videoId: string): string {
    const manifest = this.manifests.get(videoId);
    if (!manifest) {
      throw new NotFoundException(`HLS manifest not found for video ${videoId}`);
    }
    return manifest.masterPlaylistUrl;
  }

  /**
   * Check if video has HLS support
   */
  hasHLSSupport(videoId: string): boolean {
    return this.manifests.has(videoId);
  }

  /**
   * Process HLS generation job
   * NOTE: Actual ffmpeg HLS conversion pending - this is a stub for ved-ifoa
   */
  private async processHLSJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.status = 'processing';
    this.logger.log(`Starting HLS generation for job ${jobId}`);

    // TODO: Implement actual HLS conversion with ffmpeg
    // Command example:
    // ffmpeg -i input.mp4 \
    //   -codec: copy \
    //   -start_number 0 \
    //   -hls_time 10 \
    //   -hls_list_size 0 \
    //   -f hls output.m3u8

    const qualities = Object.keys(job.inputPaths);
    const totalSteps = qualities.length + 1; // +1 for master playlist
    
    // Generate variant playlists for each quality
    const variants: HLSVariant[] = [];
    for (let i = 0; i < qualities.length; i++) {
      const quality = qualities[i];
      const path = job.inputPaths[quality];
      
      this.logger.log(
        `Generating HLS variant for ${quality} (${i + 1}/${qualities.length})`,
      );

      // Simulate HLS conversion
      await this.simulateHLSConversion(quality, path);
      
      variants.push({
        resolution: this.getResolution(quality),
        bandwidth: this.BANDWIDTH_MAP[quality] || 1000000,
        path: `${this.getHLSBasePath(job.videoId)}/${quality}/playlist.m3u8`,
      });

      job.progress = ((i + 1) / totalSteps) * 100;
    }

    // Generate master playlist
    this.logger.log(`Generating master playlist for job ${jobId}`);
    await this.generateMasterPlaylist(job.videoId, variants);
    job.progress = 100;

    // Store manifest
    const manifest: HLSManifest = {
      masterPlaylistUrl: `${this.getHLSBasePath(job.videoId)}/master.m3u8`,
      variants,
      segmentDuration: this.SEGMENT_DURATION,
      totalDuration: 0, // Will be filled by ffmpeg
    };

    this.manifests.set(job.videoId, manifest);
    job.manifestUrl = manifest.masterPlaylistUrl;
    job.status = 'completed';
    job.completedAt = new Date();

    this.logger.log(`HLS generation job ${jobId} completed`);
  }

  /**
   * Simulate HLS conversion (placeholder for ffmpeg)
   * TODO ved-ifoa: Replace with actual ffmpeg HLS conversion
   */
  private async simulateHLSConversion(
    quality: string,
    inputPath: string,
  ): Promise<void> {
    // Simulate conversion time
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Generate HLS master playlist
   * TODO ved-ifoa: Generate actual .m3u8 file
   */
  private async generateMasterPlaylist(
    videoId: string,
    variants: HLSVariant[],
  ): Promise<void> {
    // HLS master playlist format:
    // #EXTM3U
    // #EXT-X-VERSION:3
    // #EXT-X-STREAM-INF:BANDWIDTH=600000,RESOLUTION=640x360
    // 360p/playlist.m3u8
    // #EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=854x480
    // 480p/playlist.m3u8
    // ...

    const playlistContent = this.buildMasterPlaylistContent(variants);
    this.logger.debug(`Master playlist for ${videoId}:\n${playlistContent}`);

    // TODO: Write to storage (R2/local filesystem)
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Build master playlist content
   */
  private buildMasterPlaylistContent(variants: HLSVariant[]): string {
    let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    for (const variant of variants) {
      content += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.resolution}\n`;
      content += `${variant.path}\n\n`;
    }

    return content;
  }

  /**
   * Helper: Generate unique job ID
   */
  private generateJobId(): string {
    return `hls_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Helper: Get HLS base path for video
   */
  private getHLSBasePath(videoId: string): string {
    const baseUrl = this.config.get<string>('CDN_BASE_URL', '/videos');
    return `${baseUrl}/${videoId}/hls`;
  }

  /**
   * Helper: Get resolution string from quality label
   */
  private getResolution(quality: string): string {
    const resolutions: Record<string, string> = {
      '360p': '640x360',
      '480p': '854x480',
      '720p': '1280x720',
      '1080p': '1920x1080',
    };
    return resolutions[quality] || '1280x720';
  }

  /**
   * Clean up old HLS jobs
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
      this.logger.log(`Cleaned up ${deleted} old HLS jobs`);
    }

    return deleted;
  }

  /**
   * Get service statistics
   */
  getStats(): {
    activeJobs: number;
    completedJobs: number;
    availableManifests: number;
  } {
    const jobs = Array.from(this.jobs.values());
    return {
      activeJobs: jobs.filter(j => j.status === 'processing').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      availableManifests: this.manifests.size,
    };
  }
}
