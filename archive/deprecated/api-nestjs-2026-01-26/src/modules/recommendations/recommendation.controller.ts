import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('personalized')
  async getPersonalized(@Request() req: any) {
    return this.recommendationService.getPersonalizedRecommendations(
      req.user.id,
    );
  }
}
