import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { YouTubeService, YouTubeMetadata } from './youtube.service';

class ValidateYouTubeDto {
  url: string;
}

@ApiTags('YouTube')
@Controller('youtube')
export class YouTubeController {
  private readonly logger = new Logger(YouTubeController.name);

  constructor(private readonly youtubeService: YouTubeService) {}

  @Post('validate')
  @ApiOperation({
    summary: 'Validate YouTube URL and fetch metadata',
    description:
      'Extract video ID from YouTube URL and return metadata (title, thumbnail, duration)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          description:
            'YouTube URL (supports youtube.com/watch?v=, youtu.be/, or yt: prefix)',
        },
      },
      required: ['url'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Video metadata retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        videoId: { type: 'string', example: 'dQw4w9WgXcQ' },
        title: {
          type: 'string',
          example: 'Introduction to Financial Literacy',
        },
        thumbnail: {
          type: 'string',
          example: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        },
        duration: { type: 'number', example: 300, description: 'Seconds' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid YouTube URL' })
  @ApiResponse({ status: 500, description: 'YouTube API quota exceeded' })
  async validateYouTubeUrl(
    @Body() dto: ValidateYouTubeDto,
  ): Promise<YouTubeMetadata> {
    this.logger.log(`Validating YouTube URL: ${dto.url}`);

    const videoId = this.youtubeService.extractVideoId(dto.url);
    const metadata = await this.youtubeService.fetchMetadata(videoId);

    return metadata;
  }
}
