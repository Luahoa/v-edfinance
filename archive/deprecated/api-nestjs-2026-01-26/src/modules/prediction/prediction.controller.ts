import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('prediction')
@UseGuards(JwtAuthGuard)
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Get('course-outcome')
  async predictCourseOutcome(
    @Query('courseId') courseId: string,
    @Query('userId') userId: string,
  ) {
    return this.predictionService.predictCourseOutcome(userId, courseId);
  }
}
