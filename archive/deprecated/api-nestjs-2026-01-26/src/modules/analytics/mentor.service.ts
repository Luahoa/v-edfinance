import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GeminiService } from '../../config/gemini.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { PredictiveService } from '../analytics/predictive.service';

@Injectable()
export class MentorService {
  constructor(
    private gemini: GeminiService,
    private prisma: PrismaService,
    private predictive: PredictiveService,
    private analytics: AnalyticsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getPersonalizedAdvice(
    userId: string,
    userQuery: string,
    context: { module: string; lesson: string; locale: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        investmentProfile: true,
        buddyMemberships: {
          include: { group: true },
        },
      },
    });

    const persona = await this.analytics.getUserPersona(userId);
    const churnRisk = await this.predictive.predictChurnRisk(userId);
    const groupStreak = user?.buddyMemberships?.[0]?.group?.streak || 0;

    // Improvement #3: Variable Reward Logic
    const reward = await this.checkAndAwardVariableReward(userId);

    // Determine Mentor Persona based on User Persona and Context
    let mentorPersona: 'WISE_SAGE' | 'STRICT_COACH' | 'SUPPORTIVE_BUDDY' =
      'SUPPORTIVE_BUDDY';
    if (persona === 'HUNTER') mentorPersona = 'STRICT_COACH';
    if (persona === 'SAVER') mentorPersona = 'WISE_SAGE';

    const aiPrompt = {
      context: {
        ...context,
        user_query: userQuery,
        behavior_prediction:
          churnRisk === 'HIGH' ? 'High risk of stopping learning' : null,
        variable_reward: reward
          ? `User just received a surprise reward: ${reward.name} (+${reward.points} points). Include a congratulatory note in your persona style.`
          : null,
      },
      user_profile: {
        knowledge_level:
          user?.investmentProfile?.currentKnowledge || 'BEGINNER',
        risk_score: user?.investmentProfile?.riskScore || 50,
      },
      mentor_config: {
        persona: mentorPersona,
        group_streak: groupStreak,
      },
    };

    return this.gemini.generateResponse(aiPrompt);
  }

  private async checkAndAwardVariableReward(userId: string) {
    // Logic: 20% chance to get a reward if they completed at least one lesson today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logsToday = await this.prisma.behaviorLog.findMany({
      where: {
        userId,
        timestamp: { gte: today },
        eventType: 'LESSON_COMPLETED',
      },
    });

    if (logsToday.length > 0 && Math.random() < 0.2) {
      const points = Math.floor(Math.random() * 50) + 10;
      const rewards = [
        { name: 'Hạt giống Lúa Thần', points },
        { name: 'Kinh nghiệm Nhà nông', points },
        { name: 'Túi Phân bón Trí tuệ', points },
      ];
      const selected = rewards[Math.floor(Math.random() * rewards.length)];

      this.eventEmitter.emit('points.earned', {
        userId,
        eventType: 'VARIABLE_REWARD_CLAIMED',
        pointsEarned: selected.points,
        metadata: { rewardName: selected.name },
      });

      return selected;
    }

    return null;
  }
}
