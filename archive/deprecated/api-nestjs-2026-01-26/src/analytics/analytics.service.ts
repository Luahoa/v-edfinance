import { Injectable } from '@nestjs/common';

export interface AnalyticsEvent {
  name: string;
  userId?: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

@Injectable()
export class AnalyticsService {
  async track(event: AnalyticsEvent): Promise<void> {
    // Stub implementation
  }

  async identify(
    userId: string,
    traits: Record<string, unknown>,
  ): Promise<void> {
    // Stub implementation
  }

  async getMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    activeUsers: number;
    newUsers: number;
    sessions: number;
  }> {
    // Stub implementation
    return {
      activeUsers: 0,
      newUsers: 0,
      sessions: 0,
    };
  }
}
