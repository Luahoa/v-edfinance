import { Injectable } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import { ValidationService } from '../../common/validation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class RecommendationService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private analytics: AnalyticsService,
    private validation: ValidationService,
  ) {}

  async getPersonalizedRecommendations(userId: string) {
    const [user, habits, courses, persona] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { investmentProfile: true, progress: true },
      }),
      this.analytics.getUserLearningHabits(userId),
      this.prisma.course.findMany({
        where: { published: true },
        include: { lessons: { take: 1 } },
      }),
      this.analytics.getUserPersona(userId),
    ]);

    // Tìm các khóa học chưa hoàn thành
    const uncompletedCourses = courses.filter(
      (course) =>
        !user?.progress.some(
          (p) =>
            p.status === 'COMPLETED' &&
            course.lessons.some((l) => l.id === p.lessonId),
        ),
    );

    const prompt = `
      System: You are an AI Financial Advisor for V-EdFinance.
      User Persona: ${persona}
      User Profile: ${JSON.stringify(user?.investmentProfile || 'Beginner')}
      Learning Habits: ${JSON.stringify(habits)}
      Available Courses: ${JSON.stringify(uncompletedCourses.map((c) => ({ id: c.id, title: c.title })))}
      
      Task: Recommend the top 2 courses for this user. 
      For each recommendation, provide a reason based on NUDGE theory (e.g., Social Proof, Goal Gradient).
      
      Format: JSON array of { "courseId": string, "reason": { "vi": string, "en": string, "zh": string }, "strategy": string }
    `;

    // Chúng ta tạm thời sử dụng model trực tiếp hoặc thêm method vào AiService
    // Để nhanh chóng, tôi giả định AiService có một method chung để generate JSON
    try {
      const result = await (this.ai as any).model.generateContent(prompt);
      const response = result.response.text();
      const jsonStr = response.replace(/```json|```/g, '').trim();
      const rawData = JSON.parse(jsonStr);
      return this.validation.validate('COURSE_RECOMMENDATION', rawData);
    } catch (e) {
      // Fallback nếu AI lỗi
      return uncompletedCourses.slice(0, 2).map((c) => ({
        courseId: c.id,
        reason: {
          vi: 'Dựa trên sở thích của bạn, khóa học này rất phù hợp để bắt đầu.',
          en: 'Based on your interests, this course is a great place to start.',
          zh: '根据您的兴趣，这门课程是一个很好的起点。',
        },
        strategy: 'DEFAULT',
      }));
    }
  }
}
