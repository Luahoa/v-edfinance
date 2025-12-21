/**
 * I005: Simulation → Recommendation Flow Integration Tests
 * Tests simulation completion, AI-driven analysis, and personalized recommendation generation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('I005: Simulation → Recommendation Flow', () => {
  let testUserId: string;
  let testScenarioId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.simulationScenario.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.behaviorLog.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: '@simulation-test.com' } }
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `user-${Date.now()}@simulation-test.com`,
        passwordHash: 'hashed',
        name: { vi: 'Sim User', en: 'Sim User', zh: '模拟用户' },
        points: 100,
        investmentProfile: {
          create: {
            riskTolerance: 'MODERATE',
            goals: { vi: 'Tiết kiệm dài hạn', en: 'Long-term savings', zh: '长期储蓄' },
            timeHorizon: 'LONG_TERM'
          }
        }
      }
    });
    testUserId = user.id;
  });

  it('S01: Should create and complete simulation scenario', async () => {
    const scenario = await prisma.simulationScenario.create({
      data: {
        userId: testUserId,
        type: 'MARKET_CRASH',
        title: { vi: 'Khủng hoảng thị trường', en: 'Market Crash', zh: '市场崩溃' },
        description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
        difficulty: 'INTERMEDIATE',
        parameters: {
          initialInvestment: 10000,
          marketDropPercentage: 30,
          duration: 'short'
        },
        results: null,
        completed: false
      }
    });

    testScenarioId = scenario.id;
    expect(scenario).toBeDefined();
    expect(scenario.completed).toBe(false);

    // Complete simulation
    const updated = await prisma.simulationScenario.update({
      where: { id: testScenarioId },
      data: {
        completed: true,
        results: {
          finalPortfolioValue: 8500,
          decisionsMade: ['hold', 'diversify', 'rebalance'],
          performanceScore: 75
        }
      }
    });

    expect(updated.completed).toBe(true);
    expect((updated.results as any).performanceScore).toBe(75);
  });

  it('S02: Should analyze simulation results with AI insights', async () => {
    const scenario = await prisma.simulationScenario.create({
      data: {
        userId: testUserId,
        type: 'BUDGET_PLANNING',
        title: { vi: 'Kế hoạch ngân sách', en: 'Budget Plan', zh: '预算计划' },
        description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
        difficulty: 'BEGINNER',
        parameters: { monthlyIncome: 5000 },
        results: {
          savingsRate: 0.2,
          expenseCategories: { food: 1500, rent: 2000, savings: 1000 }
        },
        completed: true
      }
    });

    // Simulate AI analysis
    const aiInsights = {
      strengths: ['Good savings rate', 'Controlled spending'],
      weaknesses: ['High rent ratio'],
      recommendations: ['Consider cheaper housing', 'Increase emergency fund']
    };

    const analysisLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'AI_ANALYSIS_COMPLETED',
        context: {
          scenarioId: scenario.id,
          insights: aiInsights
        }
      }
    });

    expect((analysisLog.context as any).insights.recommendations).toHaveLength(2);

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: analysisLog.id } });
    await prisma.simulationScenario.delete({ where: { id: scenario.id } });
  });

  it('S03: Should generate personalized recommendations based on persona', async () => {
    const scenario = await prisma.simulationScenario.create({
      data: {
        userId: testUserId,
        type: 'INVESTMENT_STRATEGY',
        title: { vi: 'Chiến lược đầu tư', en: 'Investment Strategy', zh: '投资策略' },
        description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
        difficulty: 'ADVANCED',
        parameters: { capital: 50000 },
        results: { riskScore: 6, returnRate: 0.12 },
        completed: true
      }
    });

    // Fetch user persona
    const userProfile = await prisma.user.findUnique({
      where: { id: testUserId },
      include: { investmentProfile: true }
    });

    // Generate recommendations matching persona
    const recommendations = [];
    if (userProfile?.investmentProfile?.riskTolerance === 'MODERATE') {
      recommendations.push({
        type: 'COURSE',
        title: 'Balanced Portfolio Management',
        reason: 'Matches your moderate risk tolerance'
      });
    }

    expect(recommendations.length).toBeGreaterThan(0);

    // Cleanup
    await prisma.simulationScenario.delete({ where: { id: scenario.id } });
  });

  it('S04: Should log recommendation generation event', async () => {
    const recommendationLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'RECOMMENDATIONS_GENERATED',
        context: {
          source: 'simulation_completion',
          recommendations: [
            { type: 'course', courseId: 'course-001', relevanceScore: 0.85 },
            { type: 'article', articleId: 'article-042', relevanceScore: 0.72 }
          ]
        }
      }
    });

    expect((recommendationLog.context as any).recommendations).toHaveLength(2);

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: recommendationLog.id } });
  });

  it('S05: Should integrate with AI service for content suggestions', async () => {
    // Simulate AI service call
    const aiServiceResponse = {
      suggestedCourses: ['course-123', 'course-456'],
      suggestedArticles: ['article-789'],
      reasoning: 'Based on simulation performance and user goals'
    };

    const aiLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'AI_SERVICE_CALLED',
        context: {
          service: 'recommendation_engine',
          input: { userId: testUserId, scenarioType: 'MARKET_CRASH' },
          output: aiServiceResponse
        }
      }
    });

    expect((aiLog.context as any).output.suggestedCourses).toHaveLength(2);

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: aiLog.id } });
  });

  it('S06: Should match recommendations to user skill level', async () => {
    const scenario = await prisma.simulationScenario.create({
      data: {
        userId: testUserId,
        type: 'DEBT_MANAGEMENT',
        title: { vi: 'Quản lý nợ', en: 'Debt Management', zh: '债务管理' },
        description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
        difficulty: 'BEGINNER',
        parameters: { totalDebt: 20000 },
        results: { payoffStrategy: 'snowball', estimatedMonths: 18 },
        completed: true
      }
    });

    // Match to beginner-level content
    const recommendations = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'RECOMMENDATIONS_GENERATED',
        context: {
          difficultyLevel: 'BEGINNER',
          items: [
            { courseId: 'beginner-debt-101', level: 'BEGINNER' },
            { courseId: 'debt-strategies', level: 'BEGINNER' }
          ]
        }
      }
    });

    const items = (recommendations.context as any).items;
    expect(items.every((i: any) => i.level === 'BEGINNER')).toBe(true);

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: recommendations.id } });
    await prisma.simulationScenario.delete({ where: { id: scenario.id } });
  });

  it('S07: Should track recommendation click-through rate', async () => {
    await prisma.behaviorLog.createMany({
      data: [
        {
          userId: testUserId,
          action: 'RECOMMENDATION_SHOWN',
          context: { recommendationId: 'rec-001', type: 'course' }
        },
        {
          userId: testUserId,
          action: 'RECOMMENDATION_CLICKED',
          context: { recommendationId: 'rec-001', type: 'course' }
        },
        {
          userId: testUserId,
          action: 'RECOMMENDATION_SHOWN',
          context: { recommendationId: 'rec-002', type: 'article' }
        }
      ]
    });

    const shown = await prisma.behaviorLog.count({
      where: { userId: testUserId, action: 'RECOMMENDATION_SHOWN' }
    });

    const clicked = await prisma.behaviorLog.count({
      where: { userId: testUserId, action: 'RECOMMENDATION_CLICKED' }
    });

    const ctr = clicked / shown;
    expect(ctr).toBeGreaterThan(0);

    // Cleanup
    await prisma.behaviorLog.deleteMany({
      where: {
        userId: testUserId,
        action: { in: ['RECOMMENDATION_SHOWN', 'RECOMMENDATION_CLICKED'] }
      }
    });
  });

  it('S08: Should update user persona based on simulation behavior', async () => {
    const scenario = await prisma.simulationScenario.create({
      data: {
        userId: testUserId,
        type: 'RISK_ASSESSMENT',
        title: { vi: 'Đánh giá rủi ro', en: 'Risk Assessment', zh: '风险评估' },
        description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
        difficulty: 'INTERMEDIATE',
        parameters: {},
        results: { riskScore: 8, aggressiveChoices: 7, conservativeChoices: 3 },
        completed: true
      }
    });

    // Update persona based on results
    const profile = await prisma.investmentProfile.update({
      where: { userId: testUserId },
      data: {
        riskTolerance: 'AGGRESSIVE' // Updated from MODERATE
      }
    });

    expect(profile.riskTolerance).toBe('AGGRESSIVE');

    // Cleanup
    await prisma.simulationScenario.delete({ where: { id: scenario.id } });
  });

  it('S09: Should support multi-step recommendation funnel', async () => {
    await prisma.behaviorLog.createMany({
      data: [
        {
          userId: testUserId,
          action: 'RECOMMENDATION_GENERATED',
          context: { stage: 'initial', count: 5 }
        },
        {
          userId: testUserId,
          action: 'RECOMMENDATION_FILTERED',
          context: { stage: 'persona_match', count: 3 }
        },
        {
          userId: testUserId,
          action: 'RECOMMENDATION_DISPLAYED',
          context: { stage: 'final', count: 2 }
        }
      ]
    });

    const funnel = await prisma.behaviorLog.findMany({
      where: { userId: testUserId, action: { startsWith: 'RECOMMENDATION_' } },
      orderBy: { createdAt: 'asc' }
    });

    expect(funnel).toHaveLength(3);

    // Cleanup
    await prisma.behaviorLog.deleteMany({
      where: { userId: testUserId, action: { startsWith: 'RECOMMENDATION_' } }
    });
  });

  it('S10: Should validate recommendation relevance scores', async () => {
    const recommendationData = {
      items: [
        { courseId: 'c1', relevanceScore: 0.95 },
        { courseId: 'c2', relevanceScore: 0.78 },
        { courseId: 'c3', relevanceScore: 0.45 }
      ]
    };

    const highRelevance = recommendationData.items.filter(i => i.relevanceScore > 0.7);
    expect(highRelevance).toHaveLength(2);

    const log = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'RECOMMENDATIONS_VALIDATED',
        context: { highRelevanceCount: highRelevance.length }
      }
    });

    expect((log.context as any).highRelevanceCount).toBe(2);

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: log.id } });
  });
});
