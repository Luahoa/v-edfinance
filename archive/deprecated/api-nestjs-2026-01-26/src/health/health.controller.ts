import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }

  @Get('db')
  async databaseCheck() {
    return this.healthService.checkDatabase();
  }

  @Get('redis')
  async redisCheck() {
    return this.healthService.checkRedis();
  }
}
