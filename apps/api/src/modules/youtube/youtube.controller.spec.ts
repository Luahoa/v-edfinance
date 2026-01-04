import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { YouTubeController } from './youtube.controller';
import { YouTubeService, YouTubeMetadata } from './youtube.service';

describe('YouTubeController', () => {
  let controller: YouTubeController;
  let service: YouTubeService;

  const mockMetadata: YouTubeMetadata = {
    videoId: 'dQw4w9WgXcQ',
    title: 'Introduction to Financial Literacy',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: 300,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YouTubeController],
      providers: [
        {
          provide: YouTubeService,
          useValue: {
            extractVideoId: vi.fn(),
            fetchMetadata: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<YouTubeController>(YouTubeController);
    service = module.get<YouTubeService>(YouTubeService);
  });

  describe('POST /youtube/validate', () => {
    it('should validate YouTube URL and return metadata', async () => {
      const dto = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };

      vi.spyOn(service, 'extractVideoId').mockReturnValue('dQw4w9WgXcQ');
      vi.spyOn(service, 'fetchMetadata').mockResolvedValue(mockMetadata);

      const result = await controller.validateYouTubeUrl(dto);

      expect(result).toEqual(mockMetadata);
      expect(service.extractVideoId).toHaveBeenCalledWith(dto.url);
      expect(service.fetchMetadata).toHaveBeenCalledWith('dQw4w9WgXcQ');
    });

    it('should handle short YouTube URLs', async () => {
      const dto = { url: 'https://youtu.be/abc123' };

      vi.spyOn(service, 'extractVideoId').mockReturnValue('abc123');
      vi.spyOn(service, 'fetchMetadata').mockResolvedValue({
        ...mockMetadata,
        videoId: 'abc123',
      });

      const result = await controller.validateYouTubeUrl(dto);

      expect(result.videoId).toBe('abc123');
    });

    it('should handle yt: prefix format', async () => {
      const dto = { url: 'yt:xyz789' };

      vi.spyOn(service, 'extractVideoId').mockReturnValue('xyz789');
      vi.spyOn(service, 'fetchMetadata').mockResolvedValue({
        ...mockMetadata,
        videoId: 'xyz789',
      });

      const result = await controller.validateYouTubeUrl(dto);

      expect(result.videoId).toBe('xyz789');
    });

    it('should throw BadRequestException for invalid URL', async () => {
      const dto = { url: 'https://example.com/video' };

      vi.spyOn(service, 'extractVideoId').mockImplementation(() => {
        throw new BadRequestException('Invalid YouTube URL format');
      });

      await expect(controller.validateYouTubeUrl(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
