import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { behaviorLogs } from '../../database/drizzle-schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface PredictionResult {
  courseId: string;
  predictedScore: number;
  confidence: number;
  recommendation: string;
  insights: {
    studyHoursNeeded: number;
    successProbability: number;
    similarUsersBenchmark: number;
  };
}

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(private database: DatabaseService) {}

  async predictCourseOutcome(
    userId: string,
    courseId: string,
  ): Promise<PredictionResult> {
    try {
      // Get user's behavior data
      const userBehavior = await this.database.db
        .select()
        .from(behaviorLogs)
        .where(eq(behaviorLogs.userId, userId))
        .orderBy(desc(behaviorLogs.timestamp))
        .limit(100);

      // Calculate features
      const totalSessions = userBehavior.length;
      const avgSessionTime = this.calculateAvgSessionTime(userBehavior);
      const completionRate = this.calculateCompletionRate(userBehavior);
      const engagementScore = this.calculateEngagementScore(userBehavior);

      // Simple ML model (linear regression simulation)
      // In production: Use ONNX Runtime or call Python Flask microservice
      const predictedScore = this.calculatePredictedScore({
        totalSessions,
        avgSessionTime,
        completionRate,
        engagementScore,
      });

      const confidence = this.calculateConfidence(totalSessions);
      const recommendation = this.generateRecommendation(predictedScore);

      return {
        courseId,
        predictedScore,
        confidence,
        recommendation,
        insights: {
          studyHoursNeeded: this.calculateStudyHoursNeeded(predictedScore),
          successProbability: this.calculateSuccessProbability(predictedScore),
          similarUsersBenchmark: 78, // TODO: Calculate from similar users
        },
      };
    } catch (error) {
      this.logger.error(`Prediction error: ${error.message}`, error.stack);
      throw error;
    }
  }

  private calculateAvgSessionTime(logs: any[]): number {
    if (logs.length === 0) return 0;
    const totalTime = logs.reduce((sum, log) => {
      const metadata = log.metadata;
      return sum + (metadata?.sessionDuration || 0);
    }, 0);
    return totalTime / logs.length;
  }

  private calculateCompletionRate(logs: any[]): number {
    const completedActions = logs.filter(
      (log) => log.action.includes('COMPLETE') || log.action.includes('FINISH'),
    ).length;
    return logs.length > 0 ? completedActions / logs.length : 0;
  }

  private calculateEngagementScore(logs: any[]): number {
    // Score based on diversity of actions
    const uniqueActions = new Set(logs.map((log) => log.action)).size;
    return Math.min(uniqueActions / 10, 1); // Normalize to 0-1
  }

  private calculatePredictedScore(features: {
    totalSessions: number;
    avgSessionTime: number;
    completionRate: number;
    engagementScore: number;
  }): number {
    // Simple weighted formula (replace with real ML model)
    const score =
      features.totalSessions * 0.2 +
      features.avgSessionTime * 0.3 +
      features.completionRate * 100 * 0.3 +
      features.engagementScore * 100 * 0.2;

    return Math.min(Math.max(score, 0), 100);
  }

  private calculateConfidence(totalSessions: number): number {
    // More sessions = higher confidence
    return Math.min((totalSessions / 50) * 100, 95);
  }

  private generateRecommendation(score: number): string {
    if (score >= 80) {
      return 'Bạn đang trên đà xuất sắc! Tiếp tục duy trì nhịp độ học tập.';
    } else if (score >= 60) {
      return 'Bạn có thể hoàn thành tốt nếu tăng thêm 2 giờ học/tuần.';
    } else if (score >= 40) {
      return 'Cần cải thiện thêm. Hãy tập trung vào các bài tập thực hành.';
    } else {
      return 'Nên xem xét lại lộ trình học tập hoặc tham gia nhóm học.';
    }
  }

  private calculateStudyHoursNeeded(score: number): number {
    // Lower score = more hours needed
    return Math.max(0, Math.ceil((80 - score) / 10) * 2);
  }

  private calculateSuccessProbability(score: number): number {
    return Math.min(score * 1.2, 100);
  }
}
