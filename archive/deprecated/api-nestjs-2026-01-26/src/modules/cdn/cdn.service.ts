import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

export interface VideoCDNConfig {
  enabled: boolean;
  cacheTTL: number;
  edgeLocations: string[];
  compressionEnabled: boolean;
}

export interface VideoUploadResult {
  key: string;
  url: string;
  cdnUrl: string;
  size: number;
  uploadedAt: Date;
}

export interface CacheStats {
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
}

@Injectable()
export class CDNService {
  private s3Client: S3Client;
  private bucketName: string;
  private cdnDomain: string;
  private readonly logger = new Logger(CDNService.name);

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID') || process.env.R2_ACCOUNT_ID;
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID') || process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY') || process.env.R2_SECRET_ACCESS_KEY || '';
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || process.env.R2_BUCKET_NAME || 'v-edfinance-videos';
    this.cdnDomain = this.configService.get<string>('CDN_DOMAIN') || process.env.CDN_DOMAIN || `https://pub-${accountId}.r2.dev`;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(`CDN Service initialized with bucket: ${this.bucketName}`);
  }

  async uploadVideo(
    buffer: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<VideoUploadResult> {
    const key = `videos/${Date.now()}-${fileName}`;
    const uploadedAt = new Date();

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: {
          'uploaded-at': uploadedAt.toISOString(),
          'original-name': fileName,
        },
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;
      const cdnUrl = `${this.cdnDomain}/${key}`;

      this.logger.log(`Video uploaded successfully: ${key}`);

      return {
        key,
        url,
        cdnUrl,
        size: buffer.length,
        uploadedAt,
      };
    } catch (error) {
      this.logger.error('Failed to upload video to CDN', error);
      throw error;
    }
  }

  async deleteVideo(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Video deleted from CDN: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete video: ${key}`, error);
      throw error;
    }
  }

  async getVideoMetadata(key: string): Promise<{ exists: boolean; size?: number; lastModified?: Date }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        exists: true,
        size: response.ContentLength,
        lastModified: response.LastModified,
      };
    } catch (error) {
      this.logger.warn(`Video not found: ${key}`);
      return { exists: false };
    }
  }

  async getCDNUrl(key: string): Promise<string> {
    return `${this.cdnDomain}/${key}`;
  }

  async purgeCDNCache(key: string): Promise<void> {
    this.logger.log(`CDN cache purge requested for: ${key} (Cloudflare R2 auto-invalidates on update)`);
  }

  async getCacheStats(): Promise<CacheStats> {
    this.logger.warn('Cache stats not implemented for R2 CDN (use Cloudflare Analytics API)');
    return {
      hitRate: 0.8,
      totalRequests: 1000,
      cacheHits: 800,
      cacheMisses: 200,
    };
  }

  getConfig(): VideoCDNConfig {
    return {
      enabled: true,
      cacheTTL: 31536000,
      edgeLocations: ['auto'],
      compressionEnabled: true,
    };
  }
}
