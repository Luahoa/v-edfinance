import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadCertificateOptions {
  buffer: Buffer;
  certificateId: string;
  userId: string;
  courseId: string;
}

export interface UploadResult {
  url: string; // Public URL
  key: string; // R2 object key
  uploadedAt: Date;
}

/**
 * Cloudflare R2 Storage Service for Certificates
 * 
 * Uses S3-compatible API to upload certificates to Cloudflare R2
 * 
 * Configuration required in .env:
 * - CLOUDFLARE_R2_ACCOUNT_ID
 * - CLOUDFLARE_R2_ACCESS_KEY_ID
 * - CLOUDFLARE_R2_SECRET_ACCESS_KEY
 * - CLOUDFLARE_R2_BUCKET_NAME
 * - CLOUDFLARE_R2_PUBLIC_URL (optional, for custom domain)
 */
@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('CLOUDFLARE_R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME', 'v-edfinance-certificates');
    
    // Cloudflare R2 endpoint format
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    // Public URL for accessing certificates
    this.publicUrl = this.configService.get<string>(
      'CLOUDFLARE_R2_PUBLIC_URL',
      `https://pub-${accountId}.r2.dev`
    );

    this.s3Client = new S3Client({
      region: 'auto', // R2 uses 'auto' region
      endpoint,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });

    this.logger.log(`R2 Storage initialized: bucket=${this.bucketName}`);
  }

  /**
   * Upload certificate PDF to Cloudflare R2
   * 
   * Object key format: certificates/{userId}/{courseId}/{certificateId}.pdf
   */
  async uploadCertificate(
    options: UploadCertificateOptions
  ): Promise<UploadResult> {
    const { buffer, certificateId, userId, courseId } = options;

    // Generate R2 object key
    const key = `certificates/${userId}/${courseId}/${certificateId}.pdf`;

    this.logger.log(`Uploading certificate to R2: ${key}`);

    try {
      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
        Metadata: {
          certificateId,
          userId,
          courseId,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Construct public URL
      const url = `${this.publicUrl}/${this.bucketName}/${key}`;

      this.logger.log(`Certificate uploaded successfully: ${url}`);

      return {
        url,
        key,
        uploadedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to upload certificate to R2: ${key}`, error);
      throw error;
    }
  }

  /**
   * Generate presigned URL for private certificate access (7 days expiry)
   */
  async getPresignedUrl(key: string, expiresIn: number = 604800): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client as any, command, { expiresIn });
  }

  /**
   * Delete certificate from R2
   */
  async deleteCertificate(key: string): Promise<void> {
    this.logger.log(`Deleting certificate from R2: ${key}`);

    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.log(`Certificate deleted: ${key}`);
  }
}
