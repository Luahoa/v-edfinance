import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageService } from './storage.service';

// Mock S3Client
vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: vi.fn().mockImplementation(() => ({
      send: vi.fn(),
    })),
    PutObjectCommand: vi.fn().mockImplementation((args) => args),
    GetObjectCommand: vi.fn().mockImplementation((args) => args),
  };
});

// Mock getSignedUrl
vi.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    getSignedUrl: vi.fn().mockResolvedValue('https://signed.url/test'),
  };
});

describe('StorageService', () => {
  let service: StorageService;
  let mockConfigService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService = {
      get: vi.fn((key: string) => {
        const config = {
          R2_ACCOUNT_ID: 'test-account',
          R2_ACCESS_KEY_ID: 'test-key',
          R2_SECRET_ACCESS_KEY: 'test-secret',
          R2_BUCKET_NAME: 'test-bucket',
          R2_PUBLIC_URL: 'https://public.test.com',
        };
        return config[key as keyof typeof config];
      }),
    };
    service = new StorageService(mockConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const key = 'test.txt';
      const body = Buffer.from('hello');
      const contentType = 'text/plain';

      const result = await service.uploadFile(key, body, contentType);
      expect(result).toBe(key);
      // @ts-ignore
      expect(service.s3Client.send).toHaveBeenCalled();
    });

    it('should throw error if upload fails', async () => {
      const key = 'test.txt';
      const body = Buffer.from('hello');
      const contentType = 'text/plain';

      // @ts-ignore
      service.s3Client.send.mockRejectedValue(new Error('Upload failed'));

      await expect(service.uploadFile(key, body, contentType)).rejects.toThrow(
        'Upload failed',
      );
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate a GET presigned URL', async () => {
      const key = 'test.txt';
      const url = await service.getPresignedUrl(key, 'GET');
      expect(url).toBe('https://signed.url/test');
    });

    it('should generate a PUT presigned URL', async () => {
      const key = 'test.txt';
      const url = await service.getPresignedUrl(key, 'PUT');
      expect(url).toBe('https://signed.url/test');
    });
  });

  describe('getSignedUrl', () => {
    it('should return a presigned GET URL', async () => {
      const key = 'test.txt';
      const url = await service.getSignedUrl(key);
      expect(url).toBe('https://signed.url/test');
    });
  });

  describe('Error Handling', () => {
    it('should handle presigned URL generation failure', async () => {
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      vi.mocked(getSignedUrl).mockRejectedValueOnce(
        new Error('Presigner error'),
      );

      await expect(service.getPresignedUrl('test.txt', 'GET')).rejects.toThrow(
        'Presigner error',
      );
    });

    it('should use custom expiration time for presigned URLs', async () => {
      const key = 'test.txt';
      const customExpiry = 7200;
      await service.getPresignedUrl(key, 'GET', customExpiry);

      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: customExpiry },
      );
    });
  });

  describe('Configuration Fallback', () => {
    it('should fall back to environment variables if ConfigService unavailable', () => {
      process.env.R2_ACCOUNT_ID = 'env-account';
      process.env.R2_ACCESS_KEY_ID = 'env-key';
      process.env.R2_SECRET_ACCESS_KEY = 'env-secret';
      process.env.R2_BUCKET_NAME = 'env-bucket';

      const serviceWithoutConfig = new StorageService({} as ConfigService);
      expect(serviceWithoutConfig).toBeDefined();
    });
  });
});
