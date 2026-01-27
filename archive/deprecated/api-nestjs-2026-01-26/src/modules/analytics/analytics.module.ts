import { Module } from '@nestjs/common';
import { I18nService } from '../../common/i18n.service';
import { RedisCacheModule } from '../../common/redis-cache.module';
import { DynamicConfigService } from '../../config/dynamic-config.service';
import { GeminiService } from '../../config/gemini.service';
import { KyselyService } from '../../database/kysely.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './analytics.service';
import { HeatmapService } from './heatmap.service';
import { MentorService } from './mentor.service';
import { PredictiveService } from './predictive.service';
import { ReportsService } from './reports.service';

@Module({
  imports: [PrismaModule, RedisCacheModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsRepository,
    KyselyService,
    PredictiveService,
    MentorService,
    HeatmapService,
    ReportsService,
    GeminiService,
    DynamicConfigService,
    I18nService,
  ],
  exports: [
    AnalyticsService,
    AnalyticsRepository,
    PredictiveService,
    MentorService,
    HeatmapService,
    ReportsService,
    I18nService,
  ],
})
export class AnalyticsModule {}
