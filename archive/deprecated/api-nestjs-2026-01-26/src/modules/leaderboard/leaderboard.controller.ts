import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('points')
  async getPointsLeaderboard(@Query('limit') limit?: string) {
    return this.leaderboardService.getTopUsers(
      limit ? Number.parseInt(limit) : 10,
    );
  }

  @Get('streaks')
  async getStreakLeaderboard(@Query('limit') limit?: string) {
    return this.leaderboardService.getStreakLeaderboard(
      limit ? Number.parseInt(limit) : 10,
    );
  }
}
