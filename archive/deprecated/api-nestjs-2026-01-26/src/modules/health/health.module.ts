import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { CircuitBreakerService } from './circuit-breaker.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, CircuitBreakerService],
  exports: [HealthService, CircuitBreakerService],
})
export class HealthModule {}
