import { Module } from '@nestjs/common';
import { AiModule } from '../../ai/ai.module';
import { CommonModule } from '../../common/common.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LossAversionService } from './loss-aversion.service';
import { NudgeEngineService } from './nudge-engine.service';
import { NudgeController } from './nudge.controller';
import { NudgeListener } from './nudge.listener';
import { NudgeService } from './nudge.service';
import { SocialProofService } from './social-proof.service';

@Module({
  imports: [PrismaModule, AnalyticsModule, CommonModule, AiModule],
  controllers: [NudgeController],
  providers: [
    NudgeService,
    NudgeEngineService,
    NudgeListener,
    LossAversionService,
    SocialProofService,
  ],
  exports: [
    NudgeService,
    NudgeEngineService,
    LossAversionService,
    SocialProofService,
  ],
})
export class NudgeModule {}
