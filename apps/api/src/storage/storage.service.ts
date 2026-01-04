import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    const accountId = this.configService?.get
      ? this.configService.get<string>('R2_ACCOUNT_ID')
      : process.env.R2_ACCOUNT_ID;
    const accessKeyId =
      (this.configService?.get
        ? this.configService.get<string>('R2_ACCESS_KEY_ID')
        : process.env.R2_ACCESS_KEY_ID) || '';
    const secretAccessKey =
      (this.configService?.get
        ? this.configService.get<string>('R2_SECRET_ACCESS_KEY')
        : process.env.R2_SECRET_ACCESS_KEY) || '';
    this.bucketName =
      (this.configService?.get
        ? this.configService.get<string>('R2_BUCKET_NAME')
        : process.env.R2_BUCKET_NAME) || '';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: accountId
        ? `https://${accountId}.r2.cloudflarestorage.com`
        : undefined,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  }

  async uploadFile(key: string, body: Buffer, contentType: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      await this.s3Client.send(command);
      return key;
    } catch (error) {
      this.logger.error('Error uploading to R2', error);
      throw error;
    }
  }

  async getPresignedUrl(
    key: string,
    operation: 'GET' | 'PUT' = 'GET',
    expiresIn = 3600,
  ) {
    try {
      const command =
        operation === 'GET'
          ? new GetObjectCommand({ Bucket: this.bucketName, Key: key })
          : new PutObjectCommand({ Bucket: this.bucketName, Key: key });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Error generating presigned ${operation} URL`, error);
      throw error;
    }
  }

  async getSignedUrl(key: string) {
    return this.getPresignedUrl(key, 'GET');
  }
}
