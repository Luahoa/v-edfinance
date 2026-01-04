import { Module } from '@nestjs/common';
import { GamificationService } from '../common/gamification.service';
import { ConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BehaviorController } from './behavior.controller';
import { BehaviorService } from './behavior.service';
import { InvestmentProfileService } from './investment-profile.service';
import { StreakService } from './streak.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    BehaviorService,
    InvestmentProfileService,
    StreakService,
    GamificationService,
  ],
  controllers: [BehaviorController],
  exports: [BehaviorService, InvestmentProfileService, StreakService],
})
export class BehaviorModule {}
