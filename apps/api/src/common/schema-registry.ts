import { z } from 'zod';

/**
 * Anti-Hallucination Schema Registry
 * Every JSONB field in Prisma MUST have a corresponding Zod schema here.
 */
export const SchemaRegistry = {
  // BehaviorLog.payload
  BEHAVIOR_LOG_PAYLOAD: z.object({
    isMock: z.boolean().optional(),
    generatedAt: z.string().datetime().optional(),
    action: z.string().optional(),
    details: z.record(z.string(), z.any()).optional(),
  }),

  // BehaviorLog.deviceInfo
  DEVICE_INFO: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    screenResolution: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
  }),

  // User.metadata
  USER_METADATA: z.object({
    displayName: z.string().optional(),
    avatar: z.string().url().optional(),
    preferences: z.record(z.string(), z.any()).optional(),
  }),

  // Course.title, Course.description, Lesson.title, Lesson.content, Lesson.videoKey
  I18N_TEXT: z.object({
    vi: z.string(),
    en: z.string(),
    zh: z.string(),
  }),

  // SocialPost.content
  SOCIAL_POST_CONTENT: z
    .object({
      text: z.string().optional(),
      mediaKey: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .passthrough(),

  // SimulationEvent (Scenarios)
  SIMULATION_EVENT: z.object({
    eventTitle: z.string(),
    description: z.string(),
    options: z.array(
      z.object({
        id: z.string(),
        text: z.string(),
        impact: z.object({
          savings: z.number(),
          happiness: z.number(),
        }),
      }),
    ),
    aiNudge: z.string(),
    choice: z.string().optional(),
  }),

  // InvestmentProfile
  INVESTMENT_PHILOSOPHY: z
    .object({
      riskTolerance: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
      strategy: z.string().optional(),
      ai_summary: z.string().optional(),
    })
    .passthrough(),

  FINANCIAL_GOALS: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      targetAmount: z.number(),
      deadline: z.string().datetime().optional(),
    }),
  ),

  // UserChecklist.items
  CHECKLIST_ITEMS: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      isCompleted: z.boolean(),
      completedAt: z.string().datetime().optional(),
    }),
  ),

  // VirtualPortfolio.assets
  PORTFOLIO_ASSETS: z.record(
    z.string(),
    z.union([
      z.number(),
      z.object({
        quantity: z.number(),
        averagePrice: z.number(),
        symbol: z.string(),
      }),
    ]),
  ),

  // SimulationScenario
  SIMULATION_STATUS: z
    .object({
      age: z.number().optional(),
      job: z.string().optional(),
      salary: z.number().optional(),
      savings: z.number().optional(),
      goals: z.array(z.string()).optional(),
      happiness: z.number().optional(),
      stage: z.string().optional(),
      metrics: z.record(z.string(), z.number()).optional(),
    })
    .passthrough(),

  SIMULATION_DECISIONS: z.array(
    z.union([
      z.object({
        step: z.number(),
        choice: z.string(),
        timestamp: z.string().datetime(),
      }),
      z.object({
        eventTitle: z.string(),
        description: z.string(),
        options: z.array(
          z.object({
            id: z.string(),
            text: z.string(),
            impact: z.object({
              savings: z.number(),
              happiness: z.number(),
            }),
          }),
        ),
        aiNudge: z.string(),
        choice: z.string().optional(),
      }),
    ]),
  ),

  // CourseRecommendation (AI output)
  COURSE_RECOMMENDATION: z.array(
    z.object({
      courseId: z.string(),
      reason: z.object({
        vi: z.string(),
        en: z.string(),
        zh: z.string(),
      }),
      strategy: z.string(),
    }),
  ),

  // ChatMessage.metadata
  CHAT_MESSAGE_METADATA: z
    .object({
      type: z.enum(['TEXT', 'ACTION_CARD', 'SYSTEM']),
      hasActionCard: z.boolean().optional(),
      suggestions: z.array(z.string()).optional(),
    })
    .passthrough(),

  // YouTube Video Metadata (Lesson.metadata)
  YOUTUBE_VIDEO_METADATA: z.object({
    videoId: z.string(),
    title: z.string(),
    thumbnail: z.string().url(),
    duration: z.number().positive(),
  }),
};

export type SchemaKey = keyof typeof SchemaRegistry;
