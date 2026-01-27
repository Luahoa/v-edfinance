import { Module } from '@nestjs/common';
import { AiMetricsService } from './metrics.service';

@Module({
  providers: [AiMetricsService],
  exports: [AiMetricsService],
})
export class MetricsModule {}
