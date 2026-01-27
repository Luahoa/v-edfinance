import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Prisma } from '@prisma/client';
import { AiService } from '../../ai/ai.service';
import { ValidationService } from '../../common/validation.service';
import { PrismaService } from '../../prisma/prisma.service';

interface SimulationEvent {
  eventTitle: string;
  description: string;
  options: Array<{
    id: string;
    text: string;
    impact: {
      savings: number;
      happiness: number;
    };
  }>;
  aiNudge: string;
  choice?: string;
}

interface LifeStatus {
  age: number;
  job: string;
  salary: number;
  savings: number;
  goals: string[];
  happiness?: number;
}

@Injectable()
export class SimulationService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private eventEmitter: EventEmitter2,
    private validation: ValidationService,
  ) {}

  // --- VIRTUAL PORTFOLIO (SIM-TRADE) ---
  async getPortfolio(userId: string) {
    let portfolio = await this.prisma.virtualPortfolio.findUnique({
      where: { userId },
    });

    if (!portfolio) {
      portfolio = await this.prisma.virtualPortfolio.create({
        data: {
          userId,
          assets: {},
          balance: 100000.0,
        },
      });
    }
    return portfolio;
  }

  async trade(
    userId: string,
    asset: string,
    amount: number,
    type: 'BUY' | 'SELL',
    price: number,
  ) {
    const portfolio = await this.getPortfolio(userId);
    const assets = portfolio.assets as Record<string, number>;
    const totalCost = amount * price;

    if (type === 'BUY') {
      if (portfolio.balance < totalCost)
        throw new Error('Insufficient virtual balance');
      assets[asset] = (assets[asset] || 0) + amount;

      const validatedAssets = this.validation.validate(
        'PORTFOLIO_ASSETS',
        assets,
      );

      return this.prisma.virtualPortfolio.update({
        where: { userId },
        data: {
          balance: { decrement: totalCost },
          assets: validatedAssets as unknown as Prisma.InputJsonValue,
        },
      });
    }
    if ((assets[asset] || 0) < amount) throw new Error('Insufficient assets');
    assets[asset] -= amount;
    if (assets[asset] === 0) delete assets[asset];

    const validatedAssets = this.validation.validate(
      'PORTFOLIO_ASSETS',
      assets,
    );

    return this.prisma.virtualPortfolio.update({
      where: { userId },
      data: {
        balance: { increment: totalCost },
        assets: validatedAssets as unknown as Prisma.InputJsonValue,
      },
    });
  }

  // --- AI LIFE SCENARIOS (SIM-LIFE) ---
  async startLifeScenario(userId: string) {
    const initialStatus = {
      age: 22,
      job: 'Junior Developer',
      salary: 15000000, // 15M VND
      savings: 5000000,
      goals: ['Buy a house', 'Emergency fund'],
    };

    const prompt = `
      System: You are an AI "Fate" engine for a financial life simulation. 
      Nudge Strategy: Use "Framing" and "Loss Aversion".
      Hooked Strategy: Create a "Trigger" for a decision.
      
      Current User Status: ${JSON.stringify(initialStatus)}
      
      Task: Generate a realistic life event (e.g., job offer, medical emergency, investment opportunity).
      The event must require a financial decision.
      
      Format: JSON { 
        "eventTitle": string, 
        "description": string, 
        "options": [
          { "id": "A", "text": string, "impact": { "savings": number, "happiness": number } },
          { "id": "B", "text": string, "impact": { "savings": number, "happiness": number } }
        ],
        "aiNudge": string 
      }
    `;

    const result = await this.ai.modelInstance.generateContent(prompt);
    const response = result.response.text();
    const scenarioData = JSON.parse(
      response.replace(/```json|```/g, '').trim(),
    );

    const validatedStatus = this.validation.validate(
      'SIMULATION_STATUS',
      initialStatus,
    );
    const validatedEvent = this.validation.validate(
      'SIMULATION_EVENT',
      scenarioData,
    );

    return this.prisma.simulationScenario.create({
      data: {
        userId,
        type: 'LIFE',
        currentStatus: validatedStatus as unknown as Prisma.InputJsonValue,
        decisions: [validatedEvent] as unknown as Prisma.InputJsonValue, // Store first event
        isActive: true,
      },
    });
  }

  async continueLifeScenario(
    userId: string,
    scenarioId: string,
    choiceId: string,
  ) {
    const scenario = await this.prisma.simulationScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario || scenario.userId !== userId)
      throw new Error('Scenario not found');

    const currentStatus = scenario.currentStatus as unknown as LifeStatus;
    const decisions = scenario.decisions as unknown as SimulationEvent[];
    const lastEvent = decisions[decisions.length - 1];
    const choice = lastEvent.options.find((o) => o.id === choiceId);

    if (!choice) throw new Error('Invalid choice');

    // Update status based on choice impact
    const newStatus = {
      ...currentStatus,
      savings: (currentStatus.savings || 0) + (choice.impact.savings || 0),
      happiness:
        (currentStatus.happiness || 100) + (choice.impact.happiness || 0),
      age: currentStatus.age + (Math.random() > 0.7 ? 1 : 0), // Occasional aging
    };

    // Generate next event
    const prompt = `
      System: You are an AI "Fate" engine for a financial life simulation. 
      Nudge Strategy: Use "Framing" and "Loss Aversion".
      Hooked Strategy: Create a "Trigger" for a decision.
      
      Previous Event: ${lastEvent.eventTitle}
      User Choice: ${choice.text}
      Current User Status: ${JSON.stringify(newStatus)}
      
      Task: Generate the NEXT realistic life event based on the previous choice.
      The event must require a financial decision.
      
      Format: JSON { 
        "eventTitle": string, 
        "description": string, 
        "options": [
          { "id": "A", "text": string, "impact": { "savings": number, "happiness": number } },
          { "id": "B", "text": string, "impact": { "savings": number, "happiness": number } }
        ],
        "aiNudge": string 
      }
    `;

    const result = await this.ai.modelInstance.generateContent(prompt);
    const response = result.response.text();
    const nextEvent = JSON.parse(
      response.replace(/```json|```/g, '').trim(),
    ) as SimulationEvent;

    decisions.push({ choice: choice.text, ...nextEvent });

    const validatedStatus = this.validation.validate(
      'SIMULATION_STATUS',
      newStatus,
    );
    const validatedDecisions = this.validation.validate(
      'SIMULATION_DECISIONS',
      decisions,
    );

    return this.prisma.simulationScenario.update({
      where: { id: scenarioId },
      data: {
        currentStatus: validatedStatus as unknown as Prisma.InputJsonValue,
        decisions: validatedDecisions as unknown as Prisma.InputJsonValue,
      },
    });
  }

  // --- BUDGETING WAR (SIM-BUDGET) ---
  async processBudgetDecision(
    userId: string,
    allocation: { needs: number; wants: number; savings: number },
  ) {
    const total = allocation.needs + allocation.wants + allocation.savings;
    if (total !== 100) throw new Error('Total allocation must be 100%');

    // Nudge: Defaulting 50/30/20
    const isOptimal =
      allocation.needs <= 50 &&
      allocation.wants <= 30 &&
      allocation.savings >= 20;

    return await Promise.resolve({
      success: true,
      feedback: isOptimal
        ? 'Excellent! You followed the 50/30/20 rule. Your financial future looks bright.'
        : "Warning: Your spending on 'Wants' is too high. You might struggle to reach your savings goals.",
      nudge:
        'Loss Aversion: Overspending now could cost you 15% in potential compound interest over 5 years.',
    });
  }

  // --- FINANCIAL STRESS TEST (SIM-STRESS) ---
  async runStressTest(
    userId: string,
    data: {
      monthlyIncome: number;
      monthlyExpenses: number;
      emergencyFund: number;
    },
  ) {
    const survivalMonths = data.emergencyFund / data.monthlyExpenses;

    // Scenarios
    const inflationImpact = 0.1; // 10% inflation
    const newExpenses = data.monthlyExpenses * (1 + inflationImpact);
    const newSurvivalMonths = data.emergencyFund / newExpenses;

    // Emit request for nudge instead of direct call
    this.eventEmitter.emit('nudge.request', {
      userId,
      context: 'INVESTMENT_DECISION',
      data: { riskLevel: 90 },
    });

    return await Promise.resolve({
      survivalMonths: survivalMonths.toFixed(1),
      inflationStress: {
        newExpenses,
        newSurvivalMonths: newSurvivalMonths.toFixed(1),
        impact: 'Severe',
      },
      nudge:
        'Social Proof: 80% of successful investors maintain a 6-month emergency fund to survive market crashes.',
    });
  }

  // --- TIME MACHINE LOGIC (LONG-TERM IMPACT NUDGE) ---
  async calculateLongTermImpact(userId: string, amount: number, years = 10) {
    const annualReturn = 0.08; // Giả định lợi nhuận 8%/năm
    const futureValue = amount * (1 + annualReturn) ** years;

    // Emit request for nudge
    this.eventEmitter.emit('nudge.request', {
      userId,
      context: 'BUDGETING',
      data: { amount },
    });

    return await Promise.resolve({
      originalAmount: amount,
      futureValue: Math.round(futureValue),
      years,
      nudge:
        'Time Machine: Every dollar saved today is worth more in the future.',
      impactStatement: {
        vi: `Số tiền này có thể trở thành ${Math.round(futureValue).toLocaleString()} VND sau ${years} năm nếu bạn đầu tư thay vì chi tiêu.`,
        en: `This amount could become ${Math.round(futureValue).toLocaleString()} VND in ${years} years if you invest instead of spending.`,
        zh: `如果您 choose 投资而非消费，这笔金额 trong ${years} 年后 có thể trở thành ${Math.round(futureValue).toLocaleString()} 越南盾。`,
      },
    });
  }

  // --- COMMITMENT DEVICES ---
  async createCommitment(
    userId: string,
    data: {
      goalName: string;
      targetAmount: number;
      lockedAmount: number;
      months: number;
    },
  ) {
    const unlockDate = new Date();
    unlockDate.setMonth(unlockDate.getMonth() + data.months);

    const portfolio = await this.getPortfolio(userId);
    if (portfolio.balance < data.lockedAmount)
      throw new Error('Insufficient virtual balance to lock');

    // Deduct from balance and create commitment
    await this.prisma.virtualPortfolio.update({
      where: { userId },
      data: { balance: { decrement: data.lockedAmount } },
    });

    return this.prisma.simulationCommitment.create({
      data: {
        userId,
        goalName: data.goalName,
        targetAmount: data.targetAmount,
        lockedAmount: data.lockedAmount,
        unlockDate,
      },
    });
  }

  async withdrawCommitment(userId: string, commitmentId: string) {
    const commitment = await this.prisma.simulationCommitment.findUnique({
      where: { id: commitmentId },
    });

    if (!commitment || commitment.userId !== userId)
      throw new Error('Commitment not found');

    const now = new Date();
    let amountToReturn = commitment.lockedAmount;

    // Loss Aversion Nudge: Penalty if withdrawn early
    if (now < commitment.unlockDate) {
      const penalty = commitment.lockedAmount * commitment.penaltyRate;
      amountToReturn -= penalty;

      await this.prisma.behaviorLog.create({
        data: {
          userId,
          sessionId: 'simulation-engine',
          path: '/simulation/commitment/withdraw-early',
          eventType: 'EARLY_WITHDRAWAL_PENALTY',
          payload: {
            commitmentId,
            penalty,
            originalAmount: commitment.lockedAmount,
          },
        },
      });
    }

    await this.prisma.$transaction([
      this.prisma.virtualPortfolio.update({
        where: { userId },
        data: { balance: { increment: amountToReturn } },
      }),
      this.prisma.simulationCommitment.delete({
        where: { id: commitmentId },
      }),
    ]);

    return {
      withdrawnAmount: amountToReturn,
      early: now < commitment.unlockDate,
      message:
        now < commitment.unlockDate
          ? 'Early withdrawal! You lost 10% of your savings due to lack of discipline.'
          : 'Goal achieved! Your locked funds have been returned to your balance.',
    };
  }
}
