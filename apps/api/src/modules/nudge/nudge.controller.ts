import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { NudgeEngineService } from './nudge-engine.service';

@ApiTags('Nudge')
@Controller('nudge')
export class NudgeController {
  constructor(private readonly nudgeEngine: NudgeEngineService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('check')
  @ApiOperation({ summary: 'Trigger a nudge check' })
  async checkNudge(@Request() req: any, @Body() body: any) {
    return this.nudgeEngine.generateNudge(
      req.user.userId,
      body.context || 'GENERAL',
      body.data || {},
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('dashboard')
  @ApiOperation({ summary: 'Get personalized nudges for the dashboard' })
  async getDashboardNudges(@Request() req: any) {
    // Tổng hợp các nudge từ nhiều context khác nhau
    const userId = req.user.userId;

    // Ví dụ: Lấy nudge cho bối cảnh Dashboard chung
    const streakNudge = await this.nudgeEngine.generateNudge(
      userId,
      'STREAK_WARNING',
      {},
    );
    const socialNudge = await this.nudgeEngine.generateNudge(
      userId,
      'SOCIAL_PROOF_REALTIME',
      {},
    );

    return [streakNudge, socialNudge].filter((n) => n !== null);
  }

  @Get('social-proof')
  @ApiOperation({
    summary: 'Get realtime social proof for a specific course or action',
  })
  async getSocialProof(
    @Query('action') action: string,
    @Query('targetId') targetId: string,
  ) {
    return this.nudgeEngine.getRealtimeSocialProof(action, targetId);
  }
}
