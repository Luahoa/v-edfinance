import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DiagnosticService } from './diagnostic.service';

@Controller('debug')
export class DiagnosticController {
  constructor(private diagnosticService: DiagnosticService) {}

  @Get('run')
  async run() {
    return this.diagnosticService.runFullDiagnostics();
  }

  @Get('metrics')
  async getMetrics() {
    return this.diagnosticService.getMetrics();
  }

  @Get('verify-integrity')
  async verify() {
    return this.diagnosticService.runFullDiagnostics(); // integrity is part of full diagnostics
  }

  @Post('simulate')
  async simulate(@Body('userId') userId: string) {
    return this.diagnosticService.simulateUserFlow(userId);
  }

  @Post('mock-behaviors')
  async generateMock(
    @Body('userId') userId: string,
    @Body('count') count?: number,
  ) {
    return this.diagnosticService.generateMockBehavioralData(userId, count);
  }

  @Post('stress-test/ai')
  async stressTestAi(
    @Body('userId') userId: string,
    @Body('complexity') complexity: 'LOW' | 'MEDIUM' | 'HIGH',
  ) {
    return this.diagnosticService.runAiStressTest(userId, complexity);
  }
}
