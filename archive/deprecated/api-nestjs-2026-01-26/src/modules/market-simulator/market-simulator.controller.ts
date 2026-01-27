import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MarketSimulatorService } from './market-simulator.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface SimulationRequestDto {
  startingBudget: number;
  riskTolerance: 'low' | 'medium' | 'high';
  duration: '1month' | '6months' | '1year';
}

@Controller('market-simulator')
@UseGuards(JwtAuthGuard)
export class MarketSimulatorController {
  constructor(
    private readonly marketSimulatorService: MarketSimulatorService,
  ) {}

  @Post('run')
  async runSimulation(@Body() body: SimulationRequestDto) {
    return this.marketSimulatorService.runSimulation(body);
  }
}
