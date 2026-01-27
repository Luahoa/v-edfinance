import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnstorageService } from './unstorage.service';

// Mock unstorage
vi.mock('unstorage', () => ({
  createStorage: vi.fn(() => ({
    setItemRaw: vi.fn(),
    getItemRaw: vi.fn(),
    removeItem: vi.fn(),
    hasItem: vi.fn(),
    getKeys: vi.fn(),
  })),
}));

// Mock drivers
vi.mock('unstorage/drivers/fs', () => ({
  default: vi.fn(() => ({})),
}));

vi.mock('unstorage/drivers/http', () => ({
  default: vi.fn(() => ({})),
}));

describe('UnstorageService', () => {
  let service: UnstorageService;
  let mockStorage: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.STORAGE_DRIVER = 'fs';
    process.env.STORAGE_FS_BASE = './test-uploads';

    const { createStorage } = await import('unstorage');
    mockStorage = {
      setItemRaw: vi.fn().mockResolvedValue(undefined),
      getItemRaw: vi.fn().mockResolvedValue(Buffer.from('test content')),
      removeItem: vi.fn().mockResolvedValue(undefined),
      hasItem: vi.fn().mockResolvedValue(true),
      getKeys: vi.fn().mockResolvedValue(['file1.txt', 'file2.txt']),
    };
    vi.mocked(createStorage).mockReturnValue(mockStorage);

    service = new UnstorageService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('File Operations', () => {
    it('should upload file successfully', async () => {
      const key = 'test/file.txt';
      const data = Buffer.from('test content');

      const result = await service.uploadFile(key, data);

      expect(mockStorage.setItemRaw).toHaveBeenCalledWith(key, data);
      expect(result).toContain(key);
    });

    it('should download file successfully', async () => {
      const key = 'test/file.txt';
      const expectedData = Buffer.from('test content');

      const result = await service.downloadFile(key);

      expect(mockStorage.getItemRaw).toHaveBeenCalledWith(key);
      expect(result).toEqual(expectedData);
    });

    it('should throw error when downloading non-existent file', async () => {
      mockStorage.getItemRaw.mockResolvedValue(null);

      await expect(service.downloadFile('missing.txt')).rejects.toThrow(
        'File not found',
      );
    });

    it('should delete file successfully', async () => {
      const key = 'test/file.txt';

      await service.deleteFile(key);

      expect(mockStorage.removeItem).toHaveBeenCalledWith(key);
    });

    it('should check file existence', async () => {
      const key = 'test/file.txt';

      const exists = await service.fileExists(key);

      expect(mockStorage.hasItem).toHaveBeenCalledWith(key);
      expect(exists).toBe(true);
    });

    it('should return false when file existence check fails', async () => {
      mockStorage.hasItem.mockRejectedValue(new Error('Storage error'));

      const exists = await service.fileExists('test.txt');

      expect(exists).toBe(false);
    });
  });

  describe('List Operations', () => {
    it('should list files with prefix', async () => {
      const prefix = 'test/';

      const files = await service.listFiles(prefix);

      expect(mockStorage.getKeys).toHaveBeenCalledWith(prefix);
      expect(files).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should list all files when no prefix provided', async () => {
      const files = await service.listFiles();

      expect(mockStorage.getKeys).toHaveBeenCalledWith('');
      expect(files).toHaveLength(2);
    });

    it('should throw error when listing fails', async () => {
      mockStorage.getKeys.mockRejectedValue(new Error('List error'));

      await expect(service.listFiles('test/')).rejects.toThrow('List error');
    });
  });

  describe('Public URL Generation', () => {
    it('should generate public URL for fs driver', () => {
      const key = 'test/file.txt';
      const url = service.getPublicUrl(key);

      expect(url).toBe('http://localhost:3001/uploads/test/file.txt');
    });

    it('should generate public URL for gcs driver', () => {
      process.env.STORAGE_DRIVER = 'gcs';
      process.env.GCS_PUBLIC_URL = 'https://storage.googleapis.com/bucket';

      const newService = new UnstorageService();
      const url = newService.getPublicUrl('test/file.txt');

      expect(url).toBe('https://storage.googleapis.com/bucket/test/file.txt');
    });

    it('should generate public URL for r2 driver', () => {
      process.env.STORAGE_DRIVER = 'r2';
      process.env.R2_PUBLIC_URL = 'https://r2.cloudflare.com/bucket';
      process.env.R2_ENDPOINT = 'https://account.r2.cloudflarestorage.com';
      process.env.R2_BUCKET_NAME = 'test-bucket';
      process.env.R2_ACCESS_KEY_ID = 'test-key';
      process.env.R2_SECRET_ACCESS_KEY = 'test-secret';

      const newService = new UnstorageService();
      const url = newService.getPublicUrl('test/file.txt');

      expect(url).toBe('https://r2.cloudflare.com/bucket/test/file.txt');
    });
  });

  describe('Presigned URLs', () => {
    it('should return presigned upload URL placeholder', async () => {
      const key = 'test/upload.txt';
      const expiresIn = 3600;

      const url = await service.getPresignedUploadUrl(key, expiresIn);

      expect(url).toContain(key);
      expect(url).toContain('upload=true');
      expect(url).toContain(`expires=${expiresIn}`);
    });

    it('should use default expiration time', async () => {
      const url = await service.getPresignedUploadUrl('test.txt');

      expect(url).toContain('expires=3600');
    });
  });

  describe('Error Handling', () => {
    it('should handle upload failure', async () => {
      mockStorage.setItemRaw.mockRejectedValue(new Error('Upload failed'));

      await expect(
        service.uploadFile('test.txt', Buffer.from('data')),
      ).rejects.toThrow('Upload failed');
    });

    it('should handle download failure', async () => {
      mockStorage.getItemRaw.mockRejectedValue(new Error('Download failed'));

      await expect(service.downloadFile('test.txt')).rejects.toThrow(
        'Download failed',
      );
    });

    it('should handle delete failure', async () => {
      mockStorage.removeItem.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteFile('test.txt')).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  describe('Driver Initialization', () => {
    it('should initialize with fs driver by default', () => {
      delete process.env.STORAGE_DRIVER;

      const newService = new UnstorageService();

      expect(newService).toBeDefined();
    });

    it('should throw error for unsupported driver', () => {
      process.env.STORAGE_DRIVER = 'invalid-driver';

      expect(() => new UnstorageService()).toThrow(
        'Unsupported storage driver',
      );
    });
  });
});
