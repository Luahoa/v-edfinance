import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('courses')
  async getCourseRecommendations(
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getRecommendations(
      userId,
      limit ? parseInt(limit) : 5,
    );
  }
}
