import { Injectable, Logger } from '@nestjs/common';
import { type Storage, createStorage } from 'unstorage';
import fsDriver from 'unstorage/drivers/fs';
import httpDriver from 'unstorage/drivers/http';

/**
 * Unstorage Service - Multi-cloud storage abstraction
 *
 * Supports 3 storage backends via environment variable STORAGE_DRIVER:
 * - 'fs': Local filesystem (development)
 * - 'gcs': Google Cloud Storage (production backups)
 * - 'r2': Cloudflare R2 (CDN assets)
 */
@Injectable()
export class UnstorageService {
  private readonly logger = new Logger(UnstorageService.name);
  private storage: Storage;
  private driver: string;

  constructor() {
    this.driver = process.env.STORAGE_DRIVER || 'fs';
    this.initializeStorage();
  }

  private initializeStorage() {
    this.logger.log(`Initializing storage with driver: ${this.driver}`);

    switch (this.driver) {
      case 'fs':
        this.storage = createStorage({
          driver: fsDriver({
            base: process.env.STORAGE_FS_BASE || './uploads',
          }),
        });
        break;

      case 'gcs':
        // Google Cloud Storage driver
        // Note: GCS driver requires additional packages
        // Install: pnpm add @google-cloud/storage
        this.storage = createStorage({
          driver: httpDriver({
            base: process.env.GCS_BUCKET_URL || '',
            headers: {
              Authorization: `Bearer ${process.env.GCS_ACCESS_TOKEN}`,
            },
          }),
        });
        this.logger.warn(
          'GCS driver configured via HTTP (install @google-cloud/storage for native driver)',
        );
        break;

      case 'r2': {
        // Cloudflare R2 (S3-compatible)
        // Install: npm install @aws-sdk/client-s3
        const { S3Client } = require('@aws-sdk/client-s3');
        const s3Driver = require('unstorage/drivers/s3');

        this.logger.log(
          `R2 Config: Endpoint=${process.env.R2_ENDPOINT}, Bucket=${process.env.R2_BUCKET_NAME}, KeyID=${process.env.R2_ACCESS_KEY_ID?.substring(0, 5)}...`,
        );

        const s3Client = new S3Client({
          region: 'auto',
          endpoint: process.env.R2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          },
        });

        this.storage = createStorage({
          driver: (s3Driver.default || s3Driver)({
            client: s3Client,
            bucket: process.env.R2_BUCKET_NAME,
            endpoint: process.env.R2_ENDPOINT,
          }),
        });

        this.logger.log(
          'R2 driver configured for CDN assets with S3-compatible client',
        );
        break;
      }

      default:
        throw new Error(`Unsupported storage driver: ${this.driver}`);
    }

    this.logger.log('✅ Storage initialized successfully');
  }

  /**
   * Upload a file to storage
   * @param key - File path/key (e.g., 'avatars/user123.jpg')
   * @param data - File buffer or string content
   * @returns Public URL or storage key
   */
  async uploadFile(key: string, data: Buffer | string): Promise<string> {
    try {
      await this.storage.setItemRaw(key, data);
      this.logger.log(`File uploaded: ${key}`);
      return this.getPublicUrl(key);
    } catch (error) {
      this.logger.error(`Failed to upload file: ${key}`, error);
      throw error;
    }
  }

  /**
   * Download a file from storage
   * @param key - File path/key
   * @returns File buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const data = await this.storage.getItemRaw(key);
      if (!data) {
        throw new Error(`File not found: ${key}`);
      }
      return Buffer.from(data);
    } catch (error) {
      this.logger.error(`Failed to download file: ${key}`, error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   * @param key - File path/key
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.storage.removeItem(key);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists
   * @param key - File path/key
   * @returns Boolean indicating existence
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      return await this.storage.hasItem(key);
    } catch (error) {
      this.logger.error(`Failed to check file existence: ${key}`, error);
      return false;
    }
  }

  /**
   * List all files with a prefix
   * @param prefix - Key prefix (e.g., 'avatars/')
   * @returns Array of file keys
   */
  async listFiles(prefix = ''): Promise<string[]> {
    try {
      const keys = await this.storage.getKeys(prefix);
      return keys;
    } catch (error) {
      this.logger.error(`Failed to list files with prefix: ${prefix}`, error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   * @param key - File path/key
   * @returns Public URL
   */
  getPublicUrl(key: string): string {
    switch (this.driver) {
      case 'fs':
        return `http://localhost:3001/uploads/${key}`;
      case 'gcs':
        return `${process.env.GCS_PUBLIC_URL}/${key}`;
      case 'r2':
        return `${process.env.R2_PUBLIC_URL}/${key}`;
      default:
        return key;
    }
  }

  /**
   * Generate a presigned URL for direct upload (Client → Storage)
   * This is a placeholder - implement actual presigned URL generation
   * For R2/GCS, use their respective SDKs
   */
  async getPresignedUploadUrl(key: string, expiresIn = 3600): Promise<string> {
    this.logger.warn(
      'Presigned URL generation not yet implemented - returning placeholder',
    );
    // TODO: Implement presigned URL generation for R2/GCS
    // For R2: Use @aws-sdk/client-s3 with S3 presigned URL
    // For GCS: Use @google-cloud/storage signed URL
    return await Promise.resolve(
      `${this.getPublicUrl(key)}?upload=true&expires=${expiresIn}`,
    );
  }
}
