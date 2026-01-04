import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { YouTubeService } from './youtube.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('YouTubeService', () => {
  let service: YouTubeService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YouTubeService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string, defaultValue?: any) => {
              if (key === 'YOUTUBE_API_KEY') return '';
              return defaultValue;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            lesson: {
              findFirst: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<YouTubeService>(YouTubeService);
    prisma = module.get<PrismaService>(PrismaService);
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

    it('should use in-memory cache for subsequent calls with same videoId', async () => {
      const videoId = 'cacheTest123';

      // Mock DB to return null for first call
      const dbSpy = vi.spyOn(prisma.lesson, 'findFirst').mockResolvedValue(null);

      // First call (will check DB, then cache in memory)
      const metadata1 = await service.fetchMetadata(videoId);
      expect(dbSpy).toHaveBeenCalledTimes(1);

      // Reset spy counter
      dbSpy.mockClear();

      // Second call (should hit in-memory cache, skipping DB)
      const metadata2 = await service.fetchMetadata(videoId);

      expect(metadata1).toEqual(metadata2);
      expect(dbSpy).not.toHaveBeenCalled(); // Proves in-memory cache was hit
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

      vi.spyOn(prisma.lesson, 'findFirst').mockResolvedValue(mockLesson as any);

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
      // Mock DB to return null
      vi.spyOn(prisma.lesson, 'findFirst').mockResolvedValue(null);

      // Cache some items
      await service.fetchMetadata('video1');
      await service.fetchMetadata('video2');
      await service.fetchMetadata('video3');

      const stats = service.getCacheStats();

      // Cache contains at least these 3 items
      expect(stats.size).toBeGreaterThanOrEqual(3);
      expect(stats.videoIds).toContain('video1');
      expect(stats.videoIds).toContain('video2');
      expect(stats.videoIds).toContain('video3');
    });
  });
});
