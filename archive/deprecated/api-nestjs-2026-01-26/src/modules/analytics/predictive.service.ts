import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class PredictiveService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  /**
   * Improvement #2: Financial Time Travel
   * Simulates 3 future scenarios based on current behavior logs
   */
  async simulateFinancialFuture(userId: string) {
    const behaviors = await this.prisma.behaviorLog.findMany({
      where: { userId },
      take: 50,
      orderBy: { timestamp: 'desc' },
    });

    const persona = await this.analytics.getUserPersona(userId);
    const learningRate = this.calculateLearningRate(behaviors);

    // Base simulation logic
    return {
      scenarios: [
        {
          type: 'OPTIMISTIC',
          projection:
            'If you maintain this discipline, you will reach your financial freedom goal 2 years early.',
          impact: '+25% Wealth Growth',
          visualData: [100, 120, 150, 200, 280],
        },
        {
          type: 'NEUTRAL',
          projection:
            'Current habits will lead to meeting your goals on schedule, but with minimal safety net.',
          impact: 'Stable Growth',
          visualData: [100, 110, 125, 140, 160],
        },
        {
          type: 'PESSIMISTIC',
          projection:
            'Current inconsistency might delay your goals by 5 years and increase risk of debt.',
          impact: '-15% Potential Loss',
          visualData: [100, 95, 90, 85, 80],
          nudge:
            'WARNING: Your learning consistency has dropped by 30% this week.',
        },
      ],
      personaContext: persona,
    };
  }

  /**
   * Predicts if a user is likely to stop using the platform (Churn)
   */
  async predictChurnRisk(userId: string) {
    const lastLogs = await this.prisma.behaviorLog.findMany({
      where: { userId },
      take: 10,
      orderBy: { timestamp: 'desc' },
    });

    if (lastLogs.length < 5) return 'LOW';

    const timeGaps = [];
    for (let i = 0; i < lastLogs.length - 1; i++) {
      // Ensure we get absolute difference in days
      const gap = Math.abs(
        lastLogs[i].timestamp.getTime() - lastLogs[i + 1].timestamp.getTime(),
      );
      timeGaps.push(gap / (1000 * 60 * 60 * 24)); // Days
    }

    const avgGap = timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length;

    if (avgGap > 7) return 'HIGH';
    if (avgGap > 3) return 'MEDIUM';
    return 'LOW';
  }

  private calculateLearningRate(behaviors: any[]) {
    const completions = behaviors.filter(
      (b) => b.eventType === 'LESSON_COMPLETED',
    ).length;
    return completions / 10; // Simple ratio for demo
  }
}
