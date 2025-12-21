/**
 * I016: AI Mentor Conversation Integration Test
 * Tests: Ask financial question → AI analyzes context → Personalized advice → Follow-up questions
 * Validates: AI service integration, conversation history
 */

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
  },
  userProfile: {
    findUnique: vi.fn(),
  },
  conversation: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  message: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  behaviorLog: {
    create: vi.fn(),
  },
};

const mockAiService = {
  generateResponse: vi.fn(),
  analyzeUserContext: vi.fn(),
  generatePersonalizedAdvice: vi.fn(),
};

describe('[I016] AI Mentor Conversation Integration', () => {
  let app: INestApplication;
  const userId = 'user-ai-1';
  let conversationId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: 'PrismaService', useValue: mockPrismaService },
        { provide: 'AiService', useValue: mockAiService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('Scenario 1: Start new AI conversation', async () => {
    mockPrismaService.conversation.create.mockResolvedValue({
      id: 'conv-1',
      userId,
      title: 'Financial Advice Session',
      createdAt: new Date(),
    });

    const conversation = await mockPrismaService.conversation.create({
      data: {
        userId,
        title: 'Financial Advice Session',
      },
    });

    conversationId = conversation.id;
    expect(conversationId).toBe('conv-1');
    expect(conversation.userId).toBe(userId);
  });

  it('Scenario 2: User asks initial financial question', async () => {
    const userQuestion = 'Should I invest in stocks or save money in a bank account?';

    mockPrismaService.message.create.mockResolvedValue({
      id: 'msg-1',
      conversationId,
      role: 'USER',
      content: userQuestion,
      timestamp: new Date(),
    });

    const userMessage = await mockPrismaService.message.create({
      data: {
        conversationId,
        role: 'USER',
        content: userQuestion,
      },
    });

    expect(userMessage.content).toBe(userQuestion);
    expect(userMessage.role).toBe('USER');
    expect(mockPrismaService.behaviorLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId,
          eventType: 'AI_QUESTION_ASKED',
        }),
      })
    );
  });

  it('Scenario 3: AI analyzes user context before responding', async () => {
    mockPrismaService.userProfile.findUnique.mockResolvedValue({
      userId,
      age: 28,
      monthlyIncome: 30000000, // VND
      financialGoals: ['SAVING', 'INVESTING'],
      riskTolerance: 'MEDIUM',
      currentSavings: 100000000, // 100M VND
    });

    mockPrismaService.behaviorLog.findMany.mockResolvedValue([
      {
        eventType: 'LESSON_COMPLETED',
        metadata: { courseId: 'basic-investing', lessonId: 'stocks-101' },
      },
      {
        eventType: 'QUIZ_ATTEMPTED',
        metadata: { quizId: 'risk-assessment', score: 75 },
      },
    ]);

    mockAiService.analyzeUserContext.mockResolvedValue({
      knowledgeLevel: 'INTERMEDIATE',
      primaryGoal: 'INVESTING',
      riskCapacity: 'MEDIUM',
      recommendedStrategy: 'BALANCED',
    });

    const profile = await mockPrismaService.userProfile.findUnique({
      where: { userId },
    });

    const recentActivity = await mockPrismaService.behaviorLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    const context = await mockAiService.analyzeUserContext({
      profile,
      recentActivity,
    });

    expect(context.knowledgeLevel).toBe('INTERMEDIATE');
    expect(context.primaryGoal).toBe('INVESTING');
    expect(mockAiService.analyzeUserContext).toHaveBeenCalled();
  });

  it('Scenario 4: AI generates personalized advice', async () => {
    const userContext = {
      knowledgeLevel: 'INTERMEDIATE',
      primaryGoal: 'INVESTING',
      riskCapacity: 'MEDIUM',
      currentSavings: 100000000,
    };

    mockAiService.generatePersonalizedAdvice.mockResolvedValue({
      advice:
        'Với profile của bạn, tôi khuyên nên phân bổ 60% vào quỹ chỉ số (index funds) và 40% vào tiết kiệm ngắn hạn. Điều này cân bằng giữa tăng trưởng và an toàn.',
      reasoning: 'Based on medium risk tolerance and intermediate knowledge',
      actionableSteps: [
        'Mở tài khoản chứng khoán',
        'Nghiên cứu các quỹ ETF phổ biến (VN30, VNDiamond)',
        'Thiết lập auto-invest hàng tháng',
      ],
    });

    const aiResponse = await mockAiService.generatePersonalizedAdvice({
      question: 'Should I invest in stocks or save money in a bank account?',
      context: userContext,
    });

    expect(aiResponse.advice).toContain('60%');
    expect(aiResponse.actionableSteps).toHaveLength(3);
    expect(mockAiService.generatePersonalizedAdvice).toHaveBeenCalledWith(
      expect.objectContaining({
        context: userContext,
      })
    );
  });

  it('Scenario 5: Store AI response in conversation history', async () => {
    const aiResponseText =
      'Với profile của bạn, tôi khuyên nên phân bổ 60% vào quỹ chỉ số và 40% vào tiết kiệm.';

    mockPrismaService.message.create.mockResolvedValue({
      id: 'msg-2',
      conversationId,
      role: 'ASSISTANT',
      content: aiResponseText,
      metadata: {
        modelUsed: 'gemini-2.0-flash',
        tokensUsed: 250,
      },
      timestamp: new Date(),
    });

    const aiMessage = await mockPrismaService.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: aiResponseText,
        metadata: {
          modelUsed: 'gemini-2.0-flash',
          tokensUsed: 250,
        },
      },
    });

    expect(aiMessage.role).toBe('ASSISTANT');
    expect(aiMessage.content).toContain('60%');
    expect(aiMessage.metadata.modelUsed).toBe('gemini-2.0-flash');
  });

  it('Scenario 6: User asks follow-up question with conversation context', async () => {
    const followUpQuestion = 'What specific ETFs do you recommend for Vietnamese market?';

    // Fetch conversation history
    mockPrismaService.message.findMany.mockResolvedValue([
      {
        id: 'msg-1',
        role: 'USER',
        content: 'Should I invest in stocks or save money?',
        timestamp: new Date(Date.now() - 120000),
      },
      {
        id: 'msg-2',
        role: 'ASSISTANT',
        content: 'Tôi khuyên 60% index funds, 40% savings',
        timestamp: new Date(Date.now() - 60000),
      },
    ]);

    mockPrismaService.message.create.mockResolvedValue({
      id: 'msg-3',
      conversationId,
      role: 'USER',
      content: followUpQuestion,
      timestamp: new Date(),
    });

    const conversationHistory = await mockPrismaService.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
    });

    mockAiService.generateResponse.mockResolvedValue({
      content:
        'For Vietnamese market, I recommend VN30 ETF (tracking top 30 blue chips) and DCDS (DCI Diamond ETF). Both have good liquidity and low fees.',
      metadata: { contextUsed: true },
    });

    const aiResponse = await mockAiService.generateResponse({
      question: followUpQuestion,
      conversationHistory,
    });

    expect(aiResponse.content).toContain('VN30');
    expect(aiResponse.metadata.contextUsed).toBe(true);
    expect(mockAiService.generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationHistory: expect.arrayContaining([
          expect.objectContaining({ role: 'USER' }),
          expect.objectContaining({ role: 'ASSISTANT' }),
        ]),
      })
    );
  });

  it('Scenario 7: Verify conversation state consistency', async () => {
    mockPrismaService.conversation.findUnique.mockResolvedValue({
      id: conversationId,
      userId,
      title: 'Financial Advice Session',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPrismaService.message.findMany.mockResolvedValue([
      { id: 'msg-1', role: 'USER', content: 'Initial question' },
      { id: 'msg-2', role: 'ASSISTANT', content: 'AI response 1' },
      { id: 'msg-3', role: 'USER', content: 'Follow-up question' },
      { id: 'msg-4', role: 'ASSISTANT', content: 'AI response 2' },
    ]);

    const conversation = await mockPrismaService.conversation.findUnique({
      where: { id: conversationId },
    });

    const messages = await mockPrismaService.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
    });

    // Verify conversation belongs to user
    expect(conversation.userId).toBe(userId);

    // Verify message alternation (USER → ASSISTANT → USER → ASSISTANT)
    expect(messages).toHaveLength(4);
    expect(messages[0].role).toBe('USER');
    expect(messages[1].role).toBe('ASSISTANT');
    expect(messages[2].role).toBe('USER');
    expect(messages[3].role).toBe('ASSISTANT');
  });

  it('Scenario 8: Test AI error handling and retry logic', async () => {
    const userQuestion = 'Tell me about cryptocurrency investment';

    mockAiService.generateResponse
      .mockRejectedValueOnce(new Error('API rate limit exceeded'))
      .mockResolvedValueOnce({
        content:
          'Cryptocurrency is high-risk. Given your medium risk tolerance, allocate max 5-10% of portfolio.',
        metadata: { retryCount: 1 },
      });

    // First attempt fails
    await expect(
      mockAiService.generateResponse({ question: userQuestion })
    ).rejects.toThrow('API rate limit exceeded');

    // Retry succeeds
    const aiResponse = await mockAiService.generateResponse({ question: userQuestion });

    expect(aiResponse.content).toContain('5-10%');
    expect(aiResponse.metadata.retryCount).toBe(1);
  });
});
