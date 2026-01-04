import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import { KyselyModule } from '../database/kysely.module';
import { RedisCacheModule } from '../common/redis-cache.module';

@Module({
  imports: [KyselyModule, RedisCacheModule],
  providers: [AnalyticsService, AnalyticsRepository],
  exports: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}
