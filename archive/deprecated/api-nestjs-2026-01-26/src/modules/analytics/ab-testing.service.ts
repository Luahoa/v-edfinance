import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface Experiment {
  id: string;
  name: string;
  variants: Variant[];
  trafficAllocation: number;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  startDate?: Date;
  endDate?: Date;
  targetAudience?: {
    userType?: string[];
    minPoints?: number;
    maxPoints?: number;
  };
}

export interface Variant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
}

export interface VariantAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: Date;
}

export interface ConversionEvent {
  userId: string;
  experimentId: string;
  variantId: string;
  eventType: string;
  value?: number;
  timestamp: Date;
}

export interface VariantPerformance {
  variantId: string;
  variantName: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  totalValue: number;
  avgValue: number;
}

export interface StatisticalSignificance {
  experimentId: string;
  controlVariant: string;
  testVariant: string;
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;
  uplift: number;
  sampleSize: {
    control: number;
    test: number;
  };
}

@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);
  private experiments = new Map<string, Experiment>();

  constructor(private prisma: PrismaService) {}

  registerExperiment(experiment: Experiment): void {
    this.validateExperiment(experiment);
    this.experiments.set(experiment.id, experiment);
    this.logger.log(
      `Experiment registered: ${experiment.name} (${experiment.id})`,
    );
  }

  private validateExperiment(experiment: Experiment): void {
    const totalWeight = experiment.variants.reduce(
      (sum, v) => sum + v.weight,
      0,
    );
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Variant weights must sum to 100');
    }

    if (
      experiment.trafficAllocation < 0 ||
      experiment.trafficAllocation > 100
    ) {
      throw new Error('Traffic allocation must be between 0 and 100');
    }

    if (experiment.variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }
  }

  async assignVariant(
    userId: string,
    experimentId: string,
  ): Promise<VariantAssignment | null> {
    const experiment = this.experiments.get(experimentId);

    if (!experiment || experiment.status !== 'ACTIVE') {
      return null;
    }

    const existingAssignment = await this.prisma.behaviorLog.findFirst({
      where: {
        userId,
        eventType: 'AB_TEST_ASSIGNMENT',
        path: `experiment/${experimentId}`,
      },
      orderBy: { timestamp: 'desc' },
    });

    if (existingAssignment) {
      return {
        userId,
        experimentId,
        variantId: (existingAssignment.payload as any).variantId,
        assignedAt: existingAssignment.timestamp,
      };
    }

    if (!this.shouldIncludeUser(experiment)) {
      return null;
    }

    if (experiment.targetAudience) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });

      if (!user) return null;

      const { minPoints, maxPoints } = experiment.targetAudience;
      if (minPoints !== undefined && user.points < minPoints) return null;
      if (maxPoints !== undefined && user.points > maxPoints) return null;
    }

    const variant = this.selectVariantByWeight(experiment.variants, userId);

    const assignment: VariantAssignment = {
      userId,
      experimentId,
      variantId: variant.id,
      assignedAt: new Date(),
    };

    await this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: `experiment-${experimentId}`,
        path: `experiment/${experimentId}`,
        eventType: 'AB_TEST_ASSIGNMENT',
        payload: {
          experimentId,
          variantId: variant.id,
          variantName: variant.name,
        },
      },
    });

    return assignment;
  }

  private shouldIncludeUser(experiment: Experiment): boolean {
    const random = Math.random() * 100;
    return random < experiment.trafficAllocation;
  }

  private selectVariantByWeight(variants: Variant[], userId: string): Variant {
    const hash = this.hashUserId(userId);
    const random = (hash % 10000) / 100;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (random < cumulative) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async trackConversion(event: ConversionEvent): Promise<void> {
    await this.prisma.behaviorLog.create({
      data: {
        userId: event.userId,
        sessionId: `experiment-${event.experimentId}`,
        path: `experiment/${event.experimentId}/conversion`,
        eventType: 'AB_TEST_CONVERSION',
        payload: {
          experimentId: event.experimentId,
          variantId: event.variantId,
          conversionType: event.eventType,
          value: event.value,
        },
      },
    });
  }

  async getVariantPerformance(
    experimentId: string,
  ): Promise<VariantPerformance[]> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const assignments = await this.prisma.behaviorLog.findMany({
      where: {
        eventType: 'AB_TEST_ASSIGNMENT',
        path: `experiment/${experimentId}`,
      },
    });

    const conversions = await this.prisma.behaviorLog.findMany({
      where: {
        eventType: 'AB_TEST_CONVERSION',
        path: `experiment/${experimentId}/conversion`,
      },
    });

    const performanceMap = new Map<string, VariantPerformance>();

    for (const variant of experiment.variants) {
      const variantAssignments = assignments.filter(
        (a) => (a.payload as any).variantId === variant.id,
      );

      const variantConversions = conversions.filter(
        (c) => (c.payload as any).variantId === variant.id,
      );

      const totalValue = variantConversions.reduce(
        (sum, c) => sum + ((c.payload as any).value || 0),
        0,
      );

      performanceMap.set(variant.id, {
        variantId: variant.id,
        variantName: variant.name,
        impressions: variantAssignments.length,
        conversions: variantConversions.length,
        conversionRate:
          variantAssignments.length > 0
            ? variantConversions.length / variantAssignments.length
            : 0,
        totalValue,
        avgValue:
          variantConversions.length > 0
            ? totalValue / variantConversions.length
            : 0,
      });
    }

    return Array.from(performanceMap.values());
  }

  async calculateStatisticalSignificance(
    experimentId: string,
    controlVariantId: string,
    testVariantId: string,
  ): Promise<StatisticalSignificance> {
    const performance = await this.getVariantPerformance(experimentId);

    const control = performance.find((p) => p.variantId === controlVariantId);
    const test = performance.find((p) => p.variantId === testVariantId);

    if (!control || !test) {
      throw new Error('Variant not found in performance data');
    }

    const p1 = control.conversionRate;
    const p2 = test.conversionRate;
    const n1 = control.impressions;
    const n2 = test.impressions;

    if (n1 === 0 || n2 === 0) {
      throw new Error('Insufficient data for statistical analysis');
    }

    const pooledProportion =
      (control.conversions + test.conversions) / (n1 + n2);
    const standardError = Math.sqrt(
      pooledProportion * (1 - pooledProportion) * (1 / n1 + 1 / n2),
    );

    const zScore = standardError > 0 ? (p2 - p1) / standardError : 0;
    const pValue = this.calculatePValue(zScore);

    const uplift = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;

    return {
      experimentId,
      controlVariant: controlVariantId,
      testVariant: testVariantId,
      pValue,
      isSignificant: pValue < 0.05,
      confidenceLevel: (1 - pValue) * 100,
      uplift,
      sampleSize: {
        control: n1,
        test: n2,
      },
    };
  }

  private calculatePValue(zScore: number): number {
    const absZ = Math.abs(zScore);
    const t = 1 / (1 + 0.2316419 * absZ);
    const d = 0.3989423 * Math.exp((-absZ * absZ) / 2);
    const p =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return 2 * p;
  }

  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  async pauseExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.status = 'PAUSED';
      this.logger.log(`Experiment paused: ${experimentId}`);
    }
  }

  async completeExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.status = 'COMPLETED';
      this.logger.log(`Experiment completed: ${experimentId}`);
    }
  }
}
