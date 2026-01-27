import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { YouTubeService } from './youtube.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('YouTubeService', () => {
  let service: YouTubeService;
  let prisma: PrismaService;
  let configService: ConfigService;

  beforeEach(() => {
    // Create mock ConfigService
    configService = {
      get: vi.fn((key: string, defaultValue?: unknown) => {
        if (key === 'YOUTUBE_API_KEY') return '';
        return defaultValue;
      }),
    } as unknown as ConfigService;

    // Create mock PrismaService
    prisma = {
      lesson: {
        findFirst: vi.fn(),
      },
    } as unknown as PrismaService;

    // Directly instantiate service with mocks (bypasses NestJS DI metadata issues)
    service = new YouTubeService(configService, prisma);
  });

  describe('extractVideoId', () => {
    it('should extract video ID from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(service.extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from youtu.be short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(service.extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      expect(service.extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from yt: prefix format', () => {
      const url = 'yt:dQw4w9WgXcQ';
      expect(service.extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should throw BadRequestException for invalid URL', () => {
      const url = 'https://example.com/video';
      expect(() => service.extractVideoId(url)).toThrow(BadRequestException);
    });
  });

  describe('fetchMetadata - Mock Mode', () => {
    it('should return mock metadata when API key not set', async () => {
      const metadata = await service.fetchMetadata('testVideoId');

      expect(metadata).toEqual({
        videoId: 'testVideoId',
        title: 'Mock Video Title - testVideoId',
        thumbnail: 'https://i.ytimg.com/vi/testVideoId/maxresdefault.jpg',
        duration: 300,
      });
    });

    it('should use in-memory cache for subsequent calls with same videoId (when cached from DB)', async () => {
      const videoId = 'cacheTest123';
      const mockLesson = {
        videoKey: {
          videoId: 'cacheTest123',
          title: 'Cached Lesson',
          thumbnail: 'https://example.com/thumb.jpg',
        },
        duration: 600,
      };

      // Mock DB to return data (which populates the in-memory cache)
      const dbSpy = vi.spyOn(prisma.lesson, 'findFirst').mockResolvedValue(mockLesson as never);

      // First call (will check DB, cache result in memory)
      const metadata1 = await service.fetchMetadata(videoId);
      expect(dbSpy).toHaveBeenCalledTimes(1);

      // Second call (should hit in-memory cache, skipping DB)
      const metadata2 = await service.fetchMetadata(videoId);

      expect(metadata1).toEqual(metadata2);
      // In-memory cache hit means DB is only called once total
      expect(dbSpy).toHaveBeenCalledTimes(1);
    });

    it('should query Lesson cache before returning mock data', async () => {
      const videoId = 'dbCacheTest';
      const mockLesson = {
        videoKey: {
          videoId: 'dbCacheTest',
          title: 'Cached Lesson',
          thumbnail: 'https://example.com/thumb.jpg',
        },
        duration: 600,
      };

      vi.spyOn(prisma.lesson, 'findFirst').mockResolvedValue(mockLesson as never);

      const metadata = await service.fetchMetadata(videoId);

      expect(metadata).toEqual({
        videoId: 'dbCacheTest',
        title: 'Cached Lesson',
        thumbnail: 'https://example.com/thumb.jpg',
        duration: 600,
      });

      expect(prisma.lesson.findFirst).toHaveBeenCalledWith({
        where: {
          videoKey: {
            path: ['videoId'],
            equals: videoId,
          },
        },
        select: {
          videoKey: true,
          duration: true,
        },
      });
    });
  });

  describe('clearCache', () => {
    it('should clear all cached metadata', async () => {
      // Mock DB to return null
      vi.spyOn(prisma.lesson, 'findFirst').mockResolvedValue(null);

      // Cache some items
      await service.fetchMetadata('video1');
      await service.fetchMetadata('video2');

      // Clear and verify
      service.clearCache();

      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.videoIds).toEqual([]);
    });
  });

  describe('getCacheStats', () => {
    it('should return current cache size and video IDs', async () => {
      const mockLesson = (id: string) => ({
        videoKey: {
          videoId: id,
          title: `Lesson ${id}`,
          thumbnail: `https://example.com/${id}.jpg`,
        },
        duration: 600,
      });

      // Mock DB to return data (which populates the cache)
      vi.spyOn(prisma.lesson, 'findFirst')
        .mockResolvedValueOnce(mockLesson('video1') as never)
        .mockResolvedValueOnce(mockLesson('video2') as never)
        .mockResolvedValueOnce(mockLesson('video3') as never);

      // Cache some items (within same service instance)
      await service.fetchMetadata('video1');
      await service.fetchMetadata('video2');
      await service.fetchMetadata('video3');

      const stats = service.getCacheStats();

      // Cache contains exactly these 3 items
      expect(stats.size).toBe(3);
      expect(stats.videoIds).toContain('video1');
      expect(stats.videoIds).toContain('video2');
      expect(stats.videoIds).toContain('video3');
    });
  });
});
