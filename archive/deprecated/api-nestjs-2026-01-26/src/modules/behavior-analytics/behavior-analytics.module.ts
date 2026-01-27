import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BehaviorAnalyticsController } from './behavior-analytics.controller';
import { BehaviorAnalyticsService } from './behavior-analytics.service';
import { RecommendationTriggerListener } from './recommendation-trigger.listener';

@Module({
  imports: [PrismaModule],
  controllers: [BehaviorAnalyticsController],
  providers: [BehaviorAnalyticsService, RecommendationTriggerListener],
  exports: [BehaviorAnalyticsService],
})
export class BehaviorAnalyticsModule {}
