import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AiService } from '../../ai/ai.service';

export enum NudgeType {
  SOCIAL_PROOF = 'SOCIAL_PROOF',
  LOSS_AVERSION = 'LOSS_AVERSION',
  GOAL_GRADIENT = 'GOAL_GRADIENT',
  DEFAULTING = 'DEFAULTING',
  SALIENCE = 'SALIENCE',
  COMMITMENT = 'COMMITMENT',
}

/**
 * Service responsible for calculating and delivering psychological triggers (nudges)
 * based on user behavior and persona.
 *
 * @see {@link NudgeType} for available nudge categories.
 */
@Injectable()
export class NudgeEngineService {
  private readonly logger = new Logger(NudgeEngineService.name);
  
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
    private aiService: AiService,
  ) {}

  /**
   * Generates a personalized nudge for a user based on the current context.
   *
   * @param userId - The unique identifier of the user
   * @param context - The trigger context (e.g., 'INVESTMENT_DECISION', 'STREAK_WARNING')
   * @param data - Contextual data used to customize the nudge content
   * @returns A localized nudge object or null if no nudge is applicable
   */
  async generateNudge(userId: string, context: string, data: any) {
    const persona = await this.analytics.getUserPersona(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { investmentProfile: true },
    });

    this.validateUser(user);
    const safeData = data || {};

    // Get base rule-based nudge
    const baseNudge = await this.getRuleBasedNudge(
      user,
      context,
      safeData,
      persona,
    );
    if (!baseNudge) return null;

    // A/B test AI variants (10% traffic)
    const shouldUseAI = Math.random() < 0.1;

    if (shouldUseAI && this.aiService) {
      try {
        const aiVariant = await this.generateAIVariant(baseNudge, userId);

        // Track which variant was used
        await this.trackNudgeVariant(userId, {
          base: baseNudge,
          ai: aiVariant,
          variant: 'AI',
          context,
        });

        return aiVariant;
      } catch (error) {
        // Fallback to base nudge on error
        console.error('AI variant generation failed:', error);
      }
    }

    // Default: Use rule-based nudge
    await this.trackNudgeVariant(userId, {
      base: baseNudge,
      variant: 'RULE_BASED',
      context,
    });

    return baseNudge;
  }

  private async getRuleBasedNudge(
    user: any,
    context: string,
    safeData: any,
    persona: string,
  ) {
    switch (context) {
      case 'INVESTMENT_DECISION':
        return this.getInvestmentNudge(user, safeData, persona);
      case 'BUDGETING':
        return this.getBudgetingNudge(user, safeData, persona);
      case 'STREAK_WARNING':
        return this.getStreakNudge(user, safeData, persona);
      case 'SOCIAL_PROOF_REALTIME':
        return this.getRealtimeSocialNudge(user, safeData, persona);
      case 'COURSE_COMPLETION':
        // FIXME: Method getCourseCompletionNudge not implemented
        // TODO: Implement or remove this nudge type
        this.logger.warn('getCourseCompletionNudge not implemented - returning null');
        return null;
      default:
        return null;
    }
  }

  private async generateAIVariant(baseNudge: any, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        preferredLocale: true,  // FIXED: locale → preferredLocale
        // REMOVED: knowledgeLevel and streak - fields don't exist in schema
      },
    });

    if (!user) return baseNudge;

    const prompt = `
Generate a personalized variant of this behavioral nudge:

BASE MESSAGE: ${JSON.stringify(baseNudge.message)}
NUDGE TYPE: ${baseNudge.type}

USER CONTEXT:
- Locale: ${user.preferredLocale || 'vi'}

REQUIREMENTS:
1. Keep the same nudge type (${baseNudge.type})
2. Make it more engaging and personal
3. Use Vietnamese cultural metaphors if locale=vi (e.g., farming, family values)
4. Use English metaphors if locale=en (e.g., sports, business)
5. Keep under 50 words
6. Output ONLY JSON format: {"vi": "...", "en": "...", "zh": "..."}

Example Vietnamese metaphor for LOSS_AVERSION: "Đừng để hạt lúa của bạn rơi vãi!" (Don't let your rice grains scatter!)
`;

    // Use AiService to generate variant
    const response = await this.aiService.modelInstance.generateContent(prompt);
    const responseText = response.response.text();

    let parsedMessage;
    try {
      // Clean JSON from markdown if needed
      const jsonStr = responseText.replace(/```json|```/g, '').trim();
      parsedMessage = JSON.parse(jsonStr);
    } catch {
      // Fallback to base message if parsing fails
      return baseNudge;
    }

    return {
      type: baseNudge.type,
      message: parsedMessage,
      priority: baseNudge.priority,
      metadata: {
        generatedBy: 'AI',
        baseTemplate: baseNudge.message.vi,
        model: 'gemini-2.0-flash',
      },
    };
  }

  private async trackNudgeVariant(userId: string, data: any) {
    // FIXED: Added required sessionId and path fields
    await this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: 'ai-variant-generator',  // System-generated session
        path: '/nudge/variant-test',  // Virtual path for tracking
        eventType: 'NUDGE_VARIANT_TEST',
        actionCategory: 'ENGAGEMENT',
        payload: data,
        timestamp: new Date(),
      },
    });
  }

  async getRealtimeSocialProof(action: string, targetId: string) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Đếm số lượng hành vi tương ứng trong 24h qua
    const count = await this.prisma.behaviorLog.count({
      where: {
        eventType: action,
        path: { contains: targetId },
        timestamp: { gte: twentyFourHoursAgo },
      },
    });

    return {
      count,
      action,
      targetId,
      timestamp: new Date(),
    };
  }

  private async getRealtimeSocialNudge(user: any, data: any, persona: string) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsersCount = await this.prisma.behaviorLog.count({
      where: {
        timestamp: { gte: twentyFourHoursAgo },
      },
    });

    if (activeUsersCount > 0) {
      return {
        type: NudgeType.SOCIAL_PROOF,
        message: {
          vi: `${activeUsersCount} người bạn đang tích cực học tập trong 24h qua. Đừng bỏ lỡ nhé!`,
          en: `${activeUsersCount} friends have been actively learning in the last 24h. Don't miss out!`,
          zh: `在过去的 24 小时内，有 ${activeUsersCount} 位朋友在积极学习。不要错过！`,
        },
        priority: 'MEDIUM',
      };
    }
    return null;
  }

  private validateUser(user: any) {
    if (!user) {
      throw new Error('User not found');
    }
  }

  private getInvestmentNudge(user: any, data: any, persona: string) {
    const riskLevel = data.riskLevel || 0;

    // Critical risk level overrides persona - always show loss aversion
    if (riskLevel > 80) {
      return {
        type: NudgeType.LOSS_AVERSION,
        message: {
          vi: 'Thận trọng: Khoản đầu tư này có thể khiến bạn mất 20% vốn chỉ trong 1 tuần.',
          en: 'Caution: This investment could cost you 20% of your capital in just a week.',
          zh: '注意：这项投资可能会在短短一周内让您损失 20% 的资本。',
        },
        priority: 'HIGH',
      };
    }

    // Nếu là HUNTER (thích rủi ro) -> Nudge về Social Proof (Cạnh tranh)
    if (persona === 'HUNTER') {
      return {
        type: NudgeType.SOCIAL_PROOF,
        message: {
          vi: 'Thách thức: 10% nhà đầu tư hàng đầu đang chốt lời tại đây. Bạn có muốn theo kịp họ?',
          en: 'Challenge: The top 10% of investors are taking profits here. Can you keep up?',
          zh: '挑战：前 10% 的投资者都在这里获利。你能跟上吗？',
        },
        priority: 'HIGH',
      };
    }

    // Nếu là SAVER (thận trọng) -> Nudge về Loss Aversion (for moderate risk)
    if (persona === 'SAVER') {
      return {
        type: NudgeType.LOSS_AVERSION,
        message: {
          vi: 'Thận trọng: Khoản đầu tư này có thể khiến bạn mất 20% vốn chỉ trong 1 tuần.',
          en: 'Caution: This investment could cost you 20% of your capital in just a week.',
          zh: '注意：这项投资可能会在短短一周内让您损失 20% 的资本。',
        },
        priority: 'HIGH',
      };
    }

    // Default Social Proof for OBSERVER
    return {
      type: NudgeType.SOCIAL_PROOF,
      message: {
        vi: '85% nhà đầu tư có hồ sơ giống bạn chọn danh mục đa dạng hóa này.',
        en: '85% of investors with your profile choose this diversified portfolio.',
        zh: '85% 的具有您背景的投资者选择了这个多元化的投资组合。',
      },
      priority: 'MEDIUM',
    };
  }

  private getBudgetingNudge(user: any, data: any, persona: string) {
    // Mapping Nudge: Chuyển đổi số tiền thành giá trị thực tế
    const savings = data.amount;
    const itemsCount = Math.floor(savings / 50000); // Giả sử 50k = 1 ly cafe

    if (persona === 'SAVER') {
      return {
        type: NudgeType.GOAL_GRADIENT,
        message: {
          vi: `Chỉ còn ${10 - itemsCount} bước nữa là bạn đạt mục tiêu tiết kiệm tháng này!`,
          en: `Just ${10 - itemsCount} more steps to reach your savings goal this month!`,
          zh: `只需再走 ${10 - itemsCount} 步即可实现本月的储蓄目标！`,
        },
        priority: 'HIGH',
      };
    }

    return {
      type: NudgeType.SALIENCE,
      message: {
        vi: `Tiết kiệm khoản này tương đương với ${itemsCount} ly cà phê mỗi tháng.`,
        en: `Saving this is equivalent to ${itemsCount} cups of coffee per month.`,
        zh: `节省这笔钱相当于每月 ${itemsCount} 杯咖啡。`,
      },
      priority: 'LOW',
    };
  }

  private getStreakNudge(user: any, data: any, persona: string) {
    return {
      type: NudgeType.GOAL_GRADIENT,
      message: {
        vi: `Bạn đã đi được 90% chặng đường để nhận huy hiệu 'Nhà đầu tư kỷ luật'!`,
        en: `You are 90% of the way to earning the 'Disciplined Investor' badge!`,
        zh: '您已经完成了获得“自律投资者”勋章的 90%！',
      },
      priority: 'HIGH',
    };
  }
}


