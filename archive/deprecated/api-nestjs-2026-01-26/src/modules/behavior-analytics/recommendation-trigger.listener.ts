import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BEHAVIOR_EVENTS } from './behavior-analytics.service';
import type { BehaviorEventData } from './behavior-analytics.service';

@Injectable()
export class RecommendationTriggerListener {
  private readonly logger = new Logger(RecommendationTriggerListener.name);

  @OnEvent(BEHAVIOR_EVENTS.RECOMMENDATION_REFRESH)
  async handleRecommendationRefresh(payload: BehaviorEventData) {
    this.logger.log(
      `Processing recommendation refresh for user ${payload.userId}`,
    );

    try {
      await this.processRefresh(payload);
      this.logger.log(
        `Recommendation refresh completed for user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to refresh recommendations for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent(BEHAVIOR_EVENTS.SIGNIFICANT_ACTION)
  async handleSignificantAction(payload: BehaviorEventData) {
    this.logger.debug(
      `Significant action detected for user ${payload.userId}: ${payload.eventType}`,
    );
  }

  private async processRefresh(payload: BehaviorEventData): Promise<void> {
    this.logger.debug(
      `Refreshing recommendations based on: ${payload.eventType}`,
    );
  }
}
