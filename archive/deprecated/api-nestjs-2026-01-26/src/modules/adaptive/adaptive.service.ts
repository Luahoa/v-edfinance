import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Service for dynamically adjusting the user's learning path based on performance metrics.
 * Implements adaptive difficulty logic to maintain a "Flow State" for the learner.
 */
@Injectable()
export class AdaptiveService {
  constructor(private prisma: PrismaService) {}

  /**
   * Evaluates user performance on a lesson and calculates path adjustments.
   *
   * @param userId - The unique identifier of the user
   * @param lessonId - The lesson being evaluated
   * @param performance - Performance metrics including score and time spent
   * @returns An adjustment recommendation (e.g., 'LEVEL_UP', 'REINFORCE')
   */
  async adjustLearningPath(
    userId: string,
    lessonId: string,
    performance: { score?: number; timeSpent: number },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { investmentProfile: true },
    });

    let difficultyAdjustment = 'STAY';

    // Logic đơn giản: Nếu hoàn thành bài học (giả định score > 80 hoặc timeSpent < 50% trung bình)
    if (performance.score && performance.score > 80) {
      difficultyAdjustment = 'LEVEL_UP';
    } else if (performance.score && performance.score < 50) {
      difficultyAdjustment = 'REINFORCE';
    }

    // Ghi log hành vi adaptive
    await this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: 'adaptive-engine',
        path: `/adaptive/adjust/${lessonId}`,
        eventType: 'ADAPTIVE_ADJUSTMENT',
        payload: {
          lessonId,
          performance,
          adjustment: difficultyAdjustment,
        },
      },
    });

    return {
      userId,
      lessonId,
      adjustment: difficultyAdjustment,
      suggestedLevel:
        difficultyAdjustment === 'LEVEL_UP' ? 'INTERMEDIATE' : 'BEGINNER',
      message:
        difficultyAdjustment === 'LEVEL_UP'
          ? 'Great job! You are ready for more advanced topics.'
          : 'Take your time. We suggest reviewing some basics.',
    };
  }
}
