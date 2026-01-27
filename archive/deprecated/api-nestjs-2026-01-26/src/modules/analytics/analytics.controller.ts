import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { AnalyticsService } from './analytics.service';
import { MentorService } from './mentor.service';
import { PredictiveService } from './predictive.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly predictiveService: PredictiveService,
    private readonly mentorService: MentorService,
  ) {}

  @Get('my-habits')
  async getMyHabits(@Request() req: any) {
    return this.analyticsService.getUserLearningHabits(req.user.id);
  }

  @Get('predictive/future')
  async getFutureSimulation(@Request() req: any) {
    return this.predictiveService.simulateFinancialFuture(req.user.id);
  }

  @Post('mentor/chat')
  async askMentor(
    @Request() req: any,
    @Body() body: { query: string; module?: string; lesson?: string },
  ) {
    return this.mentorService.getPersonalizedAdvice(req.user.id, body.query, {
      module: body.module || 'General',
      lesson: body.lesson || 'General',
      locale: req.user.preferredLocale || 'vi',
    });
  }

  @Get('system-stats')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getSystemStats() {
    return this.analyticsService.getGlobalSystemStats();
  }
}
