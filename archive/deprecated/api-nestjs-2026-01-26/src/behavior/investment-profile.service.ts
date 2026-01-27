import { Injectable } from '@nestjs/common';
import { Level, type Prisma } from '@prisma/client';
import { ValidationService } from '../common/validation.service';
import { GeminiService } from '../config/gemini.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvestmentProfileService {
  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
    private validation: ValidationService,
  ) {}

  async analyzeBehaviorAndSyncProfile(userId: string) {
    const logs = await this.prisma.behaviorLog.findMany({
      where: { userId },
      take: 50,
      orderBy: { timestamp: 'desc' },
    });

    const progress = await this.prisma.userProgress.findMany({
      where: { userId },
      include: { lesson: true },
    });

    const prompt = {
      context: {
        user_query:
          'Hãy phân tích hành vi học tập và đầu tư của tôi dựa trên dữ liệu nhật ký và tiến độ.',
        locale: 'vi',
      },
      user_profile: {
        logs: logs.map((l) => ({ type: l.eventType, path: l.path })),
        completed_lessons: progress.filter((p) => p.status === 'COMPLETED')
          .length,
      },
    };

    const analysis = await this.geminiService.generateResponse(prompt);

    const validatedPhilosophy = this.validation.validate(
      'INVESTMENT_PHILOSOPHY',
      {
        ai_summary: analysis.text,
      },
    );

    // Update investment profile based on AI analysis (simplified)
    return this.prisma.investmentProfile.upsert({
      where: { userId },
      update: {
        investmentPhilosophy:
          validatedPhilosophy as unknown as Prisma.InputJsonValue,
      },
      create: {
        userId,
        riskScore: 5,
        investmentPhilosophy:
          validatedPhilosophy as unknown as Prisma.InputJsonValue,
        financialGoals: [] as unknown as Prisma.InputJsonValue,
        currentKnowledge: Level.BEGINNER,
      },
    });
  }
}
