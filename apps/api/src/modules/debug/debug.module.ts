import { Module } from '@nestjs/common';
import { AiModule } from '../../ai/ai.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { DatabaseModule } from '../../database/database.module';
import { SocialModule } from '../social/social.module';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';
import { QueryOptimizerController } from './query-optimizer.controller';
import { QueryOptimizerService } from './query-optimizer.service';

@Module({
  imports: [PrismaModule, AiModule, SocialModule, DatabaseModule],
  controllers: [DiagnosticController, QueryOptimizerController],
  providers: [DiagnosticService, QueryOptimizerService],
  exports: [DiagnosticService, QueryOptimizerService],
})
export class DebugModule {}
