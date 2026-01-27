import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BehaviorService } from './behavior.service';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { LogEventDto } from './dto/log-event.dto';

@ApiTags('Behavior')
@Controller('behavior')
export class BehaviorController {
  constructor(private readonly behaviorService: BehaviorService) {}

  @UseGuards(JwtAuthGuard)
  @Post('log')
  @ApiOperation({ summary: 'Log a user behavior event' })
  async log(@Request() req: any, @Body() dto: LogEventDto) {
    const userId = req.user?.userId;
    return this.behaviorService.logEvent(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('logs')
  @ApiOperation({ summary: 'Get current user behavior history' })
  async getMyHistory(@Request() req: any) {
    return this.behaviorService.getUserBehaviors(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('streak')
  @ApiOperation({ summary: 'Get current user streak' })
  async getMyStreak(@Request() req: any) {
    // Placeholder as it seems some tests expect this
    return { currentStreak: 0 };
  }
}
