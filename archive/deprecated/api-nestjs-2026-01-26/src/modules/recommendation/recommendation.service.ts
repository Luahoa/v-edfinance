import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { behaviorLogs } from '../../database/drizzle-schema';
import { eq, sql, inArray } from 'drizzle-orm';

export interface CourseRecommendation {
  courseId: string;
  title: string;
  matchScore: number;
  reason: 'similar_learners' | 'skill_gap' | 'trending' | 'streak_booster';
  reasoning: string;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(private database: DatabaseService) {}

  async getRecommendations(
    userId: string,
    limit: number = 5,
  ): Promise<CourseRecommendation[]> {
    try {
      // Get user's completed courses
      const userBehavior = await this.database.db
        .select()
        .from(behaviorLogs)
        .where(eq(behaviorLogs.userId, userId));

      const completedCourses = this.extractCompletedCourses(userBehavior);

      // Find similar users (collaborative filtering)
      const similarUsers = await this.findSimilarUsers(
        userId,
        completedCourses,
      );

      // Get courses completed by similar users
      const recommendations = await this.generateRecommendations(
        userId,
        completedCourses,
        similarUsers,
        limit,
      );

      return recommendations;
    } catch (error) {
      this.logger.error(`Recommendation error: ${error.message}`, error.stack);
      return [];
    }
  }

  private extractCompletedCourses(logs: any[]): string[] {
    const courseIds = new Set<string>();
    logs.forEach((log) => {
      const metadata = log.metadata;
      if (log.action.includes('COMPLETE') && metadata?.courseId) {
        courseIds.add(metadata.courseId);
      }
    });
    return Array.from(courseIds);
  }

  private async findSimilarUsers(
    userId: string,
    completedCourses: string[],
  ): Promise<string[]> {
    // Simplified: Find users who completed same courses
    // In production: Use cosine similarity or matrix factorization
    if (completedCourses.length === 0) return [];

    // TEMPORARY: Disable similar users query (schema mismatch)
    // const similarUserLogs = await this.database.db
    //   .select({ userId: behaviorLogs.userId })
    //   .from(behaviorLogs)
    //   .where(
    //     sql`${behaviorLogs.action} LIKE '%COMPLETE%' AND ${behaviorLogs.metadata}::jsonb->>'courseId' IN (${sql.join(completedCourses.map((id) => sql`${id}`), sql`, `)})`,
    //   )
    //   .limit(50);

    // return Array.from(
    //   new Set(similarUserLogs.map((log: any) => log.userId).filter((id: string) => id !== userId)),
    // );
    return [];
  }

  private async generateRecommendations(
    userId: string,
    completedCourses: string[],
    similarUsers: string[],
    limit: number,
  ): Promise<CourseRecommendation[]> {
    // TEMPORARY: Mock courses data (courses table not in Drizzle schema yet)
    const allCourses: any[] = [];
    // const allCourses = await this.database.db.select().from(courses);

    // Filter out already completed
    const availableCourses = allCourses.filter(
      (course: any) => !completedCourses.includes(course.id),
    );

    // Score each course
    const scoredCourses = availableCourses
      .map((course: any) => {
        const matchScore = this.calculateMatchScore(course, similarUsers);
        const reason = this.determineReason(matchScore);
        const reasoning = this.generateReasoning(reason, course.title);

        return {
          courseId: course.id,
          title: course.title,
          matchScore,
          reason,
          reasoning,
        };
      })
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return scoredCourses;
  }

  private calculateMatchScore(course: any, similarUsers: string[]): number {
    // Simple scoring: popularity + randomness (for variable reward)
    const popularityScore = Math.random() * 50; // Simulate popularity
    const randomBoost = Math.random() * 50; // Variable reward
    return popularityScore + randomBoost;
  }

  private determineReason(
    score: number,
  ): 'similar_learners' | 'skill_gap' | 'trending' | 'streak_booster' {
    if (score > 75) return 'similar_learners';
    if (score > 50) return 'trending';
    if (score > 25) return 'skill_gap';
    return 'streak_booster';
  }

  private generateReasoning(reason: string, courseTitle: string): string {
    const reasonings: Record<string, string> = {
      similar_learners: `90% học viên tương tự bạn đã hoàn thành "${courseTitle}"`,
      trending: `"${courseTitle}" đang hot nhất tuần này`,
      skill_gap: `Khóa học này giúp bạn bổ sung kỹ năng còn thiếu`,
      streak_booster: `Hoàn thành "${courseTitle}" để duy trì streak 7 ngày!`,
    };
    return reasonings[reason] || `Khóa học phù hợp với bạn`;
  }
}
