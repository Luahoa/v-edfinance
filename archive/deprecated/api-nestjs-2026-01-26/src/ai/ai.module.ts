import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiMetricsService } from './metrics.service';

@Module({
  imports: [ConfigModule, CacheModule.register()],
  controllers: [AiController],
  providers: [AiService, AiMetricsService],
  exports: [AiService, AiMetricsService],
})
export class AiModule {}
