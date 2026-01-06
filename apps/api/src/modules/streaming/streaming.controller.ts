import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StreamingService } from './streaming.service';

export interface HLSManifestResponse {
  manifestUrl: string;
  qualities: string[];
  duration: number;
  format: 'hls';
}

export interface TranscodingJobResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoKey: string;
}

export interface VideoStreamMetrics {
  videoKey: string;
  bandwidth: number;
  storageUsed: number;
  viewCount: number;
  avgBufferTime: number;
}

@Controller('api/streaming')
export class StreamingController {
  private readonly logger = new Logger(StreamingController.name);

  constructor(private readonly streamingService: StreamingService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
      );
    }

    this.logger.log(`Upload video: ${file.originalname} (${file.size} bytes)`);

    const result = await this.streamingService.uploadVideo(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post(':videoKey/transcode')
  async startTranscoding(
    @Param('videoKey') videoKey: string,
    @Body('qualities') qualities?: string[],
  ): Promise<TranscodingJobResponse> {
    this.logger.log(`Start transcoding: ${videoKey} → ${qualities || 'default'}`);

    const job = await this.streamingService.queueTranscoding(
      videoKey,
      qualities,
    );

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      videoKey,
    };
  }

  @Get(':videoKey/manifest.m3u8')
  async getHLSManifest(
    @Param('videoKey') videoKey: string,
  ): Promise<HLSManifestResponse> {
    const manifest = await this.streamingService.getHLSManifest(videoKey);

    if (!manifest) {
      throw new NotFoundException(`HLS manifest not found for: ${videoKey}`);
    }

    return manifest;
  }

  @Get(':videoKey/metrics')
  async getStreamingMetrics(
    @Param('videoKey') videoKey: string,
  ): Promise<VideoStreamMetrics> {
    return this.streamingService.getMetrics(videoKey);
  }

  @Get('jobs/:jobId')
  async getTranscodingStatus(
    @Param('jobId') jobId: string,
  ): Promise<TranscodingJobResponse> {
    const job = await this.streamingService.getJobStatus(jobId);

    if (!job) {
      throw new NotFoundException(`Transcoding job not found: ${jobId}`);
    }

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      videoKey: job.videoKey,
    };
  }

  @Get('health')
  async healthCheck() {
    const health = await this.streamingService.getHealthStatus();

    return {
      status: 'ok',
      uptime: process.uptime(),
      ...health,
    };
  }
}
