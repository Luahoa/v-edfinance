import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BehaviorAnalyticsService } from './behavior-analytics.service';

class TrackEventDto {
  userId: string;
  eventType: string;
  data?: Record<string, unknown>;
}

@ApiTags('Behavior Analytics')
@Controller('behavior')
export class BehaviorAnalyticsController {
  constructor(
    private readonly behaviorAnalyticsService: BehaviorAnalyticsService,
  ) {}

  @Post('track')
  @ApiOperation({ summary: 'Track a behavior event' })
  async trackEvent(@Body() dto: TrackEventDto) {
    const result = await this.behaviorAnalyticsService.trackEvent(
      dto.userId,
      dto.eventType,
      dto.data || {},
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('summary/:userId')
  @ApiOperation({ summary: 'Get user behavior summary' })
  async getUserSummary(@Param('userId') userId: string) {
    return this.behaviorAnalyticsService.getUserBehaviorSummary(userId);
  }

  @Post('refresh/:userId')
  @ApiOperation({ summary: 'Manually trigger recommendation refresh' })
  async triggerRefresh(@Param('userId') userId: string) {
    await this.behaviorAnalyticsService.triggerRecommendationRefresh(userId);
    return { success: true, message: 'Recommendation refresh triggered' };
  }
}
