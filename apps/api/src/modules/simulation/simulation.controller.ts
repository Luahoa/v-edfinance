import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SimulationService } from './simulation.service';

@ApiTags('simulation')
@ApiBearerAuth()
@Controller('simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get('portfolio')
  @ApiOperation({ summary: 'Get current simulation portfolio' })
  @ApiResponse({ status: 200, description: 'Return simulation portfolio.' })
  async getPortfolio(@Request() req: { user: { id: string } }) {
    return this.simulationService.getPortfolio(req.user.id);
  }

  @Post('trade')
  @ApiOperation({ summary: 'Execute a simulated trade' })
  @ApiResponse({ status: 201, description: 'Trade executed successfully.' })
  async trade(
    @Request() req: { user: { id: string } },
    @Body()
    body: {
      asset: string;
      amount: number;
      type: 'BUY' | 'SELL';
      price: number;
    },
  ) {
    return this.simulationService.trade(
      req.user.id,
      body.asset,
      body.amount,
      body.type,
      body.price,
    );
  }

  @Post('life/start')
  @ApiOperation({ summary: 'Start a life simulation scenario' })
  @ApiResponse({ status: 201, description: 'Scenario started successfully.' })
  async startLife(@Request() req: { user: { id: string } }) {
    return this.simulationService.startLifeScenario(req.user.id);
  }

  @Post('life/continue')
  @ApiOperation({ summary: 'Make a choice in a life scenario' })
  @ApiResponse({ status: 201, description: 'Choice processed successfully.' })
  async continueLife(
    @Request() req: { user: { id: string } },
    @Body() body: { scenarioId: string; choiceId: string },
  ) {
    return this.simulationService.continueLifeScenario(
      req.user.id,
      body.scenarioId,
      body.choiceId,
    );
  }

  @Post('budget/process')
  @ApiOperation({ summary: 'Process budget allocation decision' })
  @ApiResponse({ status: 201, description: 'Budget decision processed.' })
  async processBudget(
    @Request() req: { user: { id: string } },
    @Body() body: { allocation: any },
  ) {
    return this.simulationService.processBudgetDecision(
      req.user.id,
      body.allocation,
    );
  }

  @Post('stress-test')
  @ApiOperation({ summary: 'Run a financial stress test' })
  @ApiResponse({ status: 201, description: 'Stress test completed.' })
  async runStressTest(
    @Request() req: { user: { id: string } },
    @Body() body: any,
  ) {
    return this.simulationService.runStressTest(req.user.id, body);
  }

  @Post('impact-analysis')
  @ApiOperation({
    summary: 'Calculate long-term impact of financial decisions',
  })
  @ApiResponse({ status: 200, description: 'Return impact analysis.' })
  async getImpactAnalysis(
    @Request() req: { user: { id: string } },
    @Body() body: { amount: number; years?: number },
  ) {
    return this.simulationService.calculateLongTermImpact(
      req.user.id,
      body.amount,
      body.years,
    );
  }

  @Post('commitment/create')
  @ApiOperation({ summary: 'Create a financial commitment (Hooked theory)' })
  @ApiResponse({ status: 201, description: 'Commitment created.' })
  async createCommitment(
    @Request() req: { user: { id: string } },
    @Body()
    body: {
      goalName: string;
      targetAmount: number;
      lockedAmount: number;
      months: number;
    },
  ) {
    return this.simulationService.createCommitment(req.user.id, body);
  }

  @Post('commitment/withdraw')
  @ApiOperation({ summary: 'Withdraw/Cancel a commitment' })
  @ApiResponse({ status: 201, description: 'Commitment withdrawn.' })
  async withdrawCommitment(
    @Request() req: { user: { id: string } },
    @Body() body: { id: string },
  ) {
    return this.simulationService.withdrawCommitment(req.user.id, body.id);
  }
}
