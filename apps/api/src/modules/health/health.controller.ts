import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health status' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async getHealth() {
    const health = await this.healthService.getHealthStatus();
    if (health.status !== 'healthy') {
      throw new HttpException(health, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return health;
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check for Kubernetes/load balancers' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready to accept traffic',
  })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async getReadiness() {
    const health = await this.healthService.getReadinessStatus();
    const isReady = health.checks.database?.status === 'up';
    if (!isReady) {
      throw new HttpException(health, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return health;
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness check' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getLiveness() {
    return this.healthService.getLivenessStatus();
  }
}
