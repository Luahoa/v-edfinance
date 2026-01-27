import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdaptiveService } from './adaptive.service';

@Controller('adaptive')
@UseGuards(JwtAuthGuard)
export class AdaptiveController {
  constructor(private readonly adaptiveService: AdaptiveService) {}

  @Post('complete-lesson')
  async completeLesson(
    @Request() req: any,
    @Body() body: { lessonId: string; score?: number; timeSpent: number },
  ) {
    return this.adaptiveService.adjustLearningPath(req.user.id, body.lessonId, {
      score: body.score,
      timeSpent: body.timeSpent,
    });
  }
}
