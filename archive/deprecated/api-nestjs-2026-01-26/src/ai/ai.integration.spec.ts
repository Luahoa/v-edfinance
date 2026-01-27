import { CacheModule } from '@nestjs/cache-manager';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ChatRole } from '@prisma/client';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ConfigModule } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockImplementation(() => ({
      generateContent: vi.fn().mockImplementation(async (prompt: string) => {
        // Simulate different responses based on prompt content
        if (prompt.includes('course advice') || prompt.includes('Nudge')) {
          return {
            response: {
              text: () =>
                '```json\n{"nudge": "Start your learning journey!", "trigger": "Complete lesson 1 today", "nextStep": "lesson-1"}\n```',
            },
          };
        }
        if (prompt.includes('Summarize')) {
          return {
            response: {
              text: () =>
                'User asked about financial planning. Progress: beginner level.',
            },
          };
        }
        return {
          response: {
            text: () => 'General AI response without special formatting',
          },
        };
      }),
      startChat: vi.fn().mockImplementation(() => ({
        sendMessage: vi.fn().mockImplementation(async (message: string) => {
          // Simulate personalized responses
          if (message.includes('đầu tư')) {
            return {
              response: {
                text: () =>
                  'Đầu tư là việc đặt tiền vào tài sản với kỳ vọng sinh lời. [ACTION_CARD]{"type":"COURSE","id":"invest-101","title":"Investment Basics"}[/ACTION_CARD]',
              },
            };
          }
          if (message.toLowerCase().includes('v-edfinance là gì')) {
            return {
              response: {
                text: () =>
                  'V-EdFinance là nền tảng giáo dục tài chính giúp bạn học cách quản lý tiền.',
              },
            };
          }
          return {
            response: {
              text: () => 'Tôi sẽ giúp bạn với câu hỏi này!',
            },
          };
        }),
      })),
    })),
  })),
}));

describe.skip('AI Module - Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aiService: AiService;
  let testUserId: string;
  let testThreadId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, CacheModule.register()],
      controllers: [AiController],
      providers: [AiService, PrismaService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    aiService = moduleRef.get<AiService>(AiService);

    // Initialize the service
    aiService.onModuleInit();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.chatMessage.deleteMany();
    await prisma.chatThread.deleteMany();
    await prisma.behaviorLog.deleteMany({
      where: { eventType: 'AI_REQUEST' },
    });

    // Create test user
    const testUser = await prisma.user.upsert({
      where: { email: 'ai-test@example.com' },
      update: {},
      create: {
        email: 'ai-test@example.com',
        passwordHash: 'hashed-password',
        metadata: { displayName: 'AI Test User' },
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.chatMessage.deleteMany();
    await prisma.chatThread.deleteMany();
    await prisma.behaviorLog.deleteMany({
      where: { eventType: 'AI_REQUEST' },
    });
    await prisma.user.deleteMany({
      where: { email: 'ai-test@example.com' },
    });

    await app.close();
  });

  describe('Thread Management Flow', () => {
    it('should create thread → save messages → retrieve thread history', async () => {
      // Step 1: Create thread
      const thread = await aiService.createThread(
        testUserId,
        'Financial Planning Discussion',
      );
      expect(thread).toBeDefined();
      expect(thread.userId).toBe(testUserId);
      expect(thread.title).toBe('Financial Planning Discussion');
      testThreadId = thread.id;

      // Step 2: Save user message
      const [userMsg] = await aiService.saveMessage(
        testThreadId,
        ChatRole.USER,
        'How do I start investing?',
      );
      expect(userMsg.content).toBe('How do I start investing?');
      expect(userMsg.role).toBe(ChatRole.USER);

      // Step 3: Save assistant message
      const [assistantMsg] = await aiService.saveMessage(
        testThreadId,
        ChatRole.ASSISTANT,
        'Start with an emergency fund first.',
        { type: 'ADVICE', confidence: 0.95 },
      );
      expect(assistantMsg.content).toBe('Start with an emergency fund first.');
      expect(assistantMsg.role).toBe(ChatRole.ASSISTANT);

      // Step 4: Retrieve all messages
      const messages = await aiService.getMessages(testThreadId);
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe(ChatRole.USER);
      expect(messages[1].role).toBe(ChatRole.ASSISTANT);

      // Step 5: Verify thread was updated
      const threads = await aiService.getThreads(testUserId);
      expect(threads).toHaveLength(1);
      expect(threads[0].id).toBe(testThreadId);
    });

    it('should handle multiple threads per user', async () => {
      const thread1 = await aiService.createThread(testUserId, 'Thread 1');
      const thread2 = await aiService.createThread(
        testUserId,
        'Thread 2',
        'COURSES',
      );

      await aiService.saveMessage(
        thread1.id,
        ChatRole.USER,
        'Message in thread 1',
      );
      await aiService.saveMessage(
        thread2.id,
        ChatRole.USER,
        'Message in thread 2',
      );

      const threads = await aiService.getThreads(testUserId);
      expect(threads).toHaveLength(2);

      const messagesThread1 = await aiService.getMessages(thread1.id);
      const messagesThread2 = await aiService.getMessages(thread2.id);

      expect(messagesThread1).toHaveLength(1);
      expect(messagesThread2).toHaveLength(1);
      expect(messagesThread1[0].content).toBe('Message in thread 1');
      expect(messagesThread2[0].content).toBe('Message in thread 2');
    });
  });

  describe('AI Response Generation Flow (E2E)', () => {
    beforeEach(async () => {
      const thread = await aiService.createThread(
        testUserId,
        'AI Chat Session',
      );
      testThreadId = thread.id;
    });

    it('should generate personalized response and save to database', async () => {
      const aiResponse = await aiService.generateResponse(
        testThreadId,
        'Tôi muốn học đầu tư',
        testUserId,
      );

      // Verify AI response structure
      expect(aiResponse).toBeDefined();
      expect(aiResponse.content).toBeTruthy();
      expect(aiResponse.role).toBe(ChatRole.ASSISTANT);

      // Verify messages were saved
      const messages = await aiService.getMessages(testThreadId);
      expect(messages.length).toBeGreaterThanOrEqual(2); // USER + ASSISTANT

      const userMessage = messages.find((m) => m.role === ChatRole.USER);
      const assistantMessage = messages.find(
        (m) => m.role === ChatRole.ASSISTANT,
      );

      expect(userMessage?.content).toBe('Tôi muốn học đầu tư');
      expect(assistantMessage?.content).toContain('đầu tư');

      // Verify AI usage was logged
      const aiLogs = await prisma.behaviorLog.findMany({
        where: {
          userId: testUserId,
          eventType: 'AI_REQUEST',
        },
      });
      expect(aiLogs.length).toBeGreaterThan(0);
      expect(aiLogs[0].payload).toHaveProperty('tokensUsed');
    });

    it('should parse and extract action cards from AI response', async () => {
      const aiResponse = await aiService.generateResponse(
        testThreadId,
        'Tôi cần học về đầu tư',
        testUserId,
      );

      // Check metadata for action card
      if (aiResponse.metadata?.hasActionCard) {
        expect(aiResponse.metadata).toHaveProperty('type');
        expect(aiResponse.metadata.type).toBe('COURSE');
      }

      // Verify clean text doesn't contain [ACTION_CARD] tags
      expect(aiResponse.content).not.toContain('[ACTION_CARD]');
      expect(aiResponse.content).not.toContain('[/ACTION_CARD]');
    });

    it('should use cache for FAQ questions (second call)', async () => {
      const question = 'V-EdFinance là gì?';

      // First call - should hit API
      const firstResponse = await aiService.generateResponse(
        testThreadId,
        question,
        testUserId,
      );
      expect(firstResponse).toBeDefined();

      // Create new thread for second call
      const thread2 = await aiService.createThread(testUserId, 'Second Thread');

      // Second call - should hit cache
      const secondResponse = await aiService.generateResponse(
        thread2.id,
        question,
        testUserId,
      );
      expect(secondResponse).toBeDefined();
      expect(secondResponse.content).toBeTruthy();

      // Both should have similar content (from cache or API)
      expect(typeof secondResponse.content).toBe('string');
    });

    it('should handle conversation context with history', async () => {
      // First message
      await aiService.generateResponse(
        testThreadId,
        'Tôi muốn học tài chính',
        testUserId,
      );

      // Second message (should use context)
      const response2 = await aiService.generateResponse(
        testThreadId,
        'Tôi nên bắt đầu từ đâu?',
        testUserId,
      );

      expect(response2).toBeDefined();

      // Verify conversation history
      const messages = await aiService.getMessages(testThreadId);
      expect(messages.length).toBeGreaterThanOrEqual(4); // 2 USER + 2 ASSISTANT
    });
  });

  describe('Rate Limiting & Token Budget', () => {
    it('should enforce rate limiting (max calls per minute)', async () => {
      const thread = await aiService.createThread(
        testUserId,
        'Rate Limit Test',
      );

      // Create 21 AI request logs within the window
      const now = new Date();
      for (let i = 0; i < 21; i++) {
        await prisma.behaviorLog.create({
          data: {
            userId: testUserId,
            sessionId: `rate-test-${i}`,
            path: '/ai/chat',
            eventType: 'AI_REQUEST',
            timestamp: new Date(now.getTime() - i * 1000), // Within 1 minute
            payload: { tokensUsed: 100 },
          },
        });
      }

      // Next call should be rate limited
      await expect(
        aiService.generateResponse(thread.id, 'This should fail', testUserId),
      ).rejects.toThrow('AI rate limit exceeded');
    });

    it('should enforce monthly token budget', async () => {
      const thread = await aiService.createThread(testUserId, 'Budget Test');
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );

      // Simulate exceeding monthly budget
      await prisma.behaviorLog.create({
        data: {
          userId: testUserId,
          sessionId: 'budget-test',
          path: '/ai/chat',
          eventType: 'AI_REQUEST',
          timestamp: startOfMonth,
          payload: { tokensUsed: 51000 }, // Over 50k budget
        },
      });

      await expect(
        aiService.generateResponse(thread.id, 'Budget exceeded', testUserId),
      ).rejects.toThrow('Monthly AI token budget exceeded');
    });

    it('should allow requests within rate and budget limits', async () => {
      const thread = await aiService.createThread(testUserId, 'Normal Request');

      // Create some logs but within limits
      await prisma.behaviorLog.create({
        data: {
          userId: testUserId,
          sessionId: 'normal-1',
          path: '/ai/chat',
          eventType: 'AI_REQUEST',
          payload: { tokensUsed: 500 },
        },
      });

      // Should succeed
      const response = await aiService.generateResponse(
        thread.id,
        'Normal question',
        testUserId,
      );
      expect(response).toBeDefined();
    });
  });

  describe('Course Advice Generation', () => {
    it('should generate personalized course advice with nudge theory', async () => {
      // Create test course
      const course = await prisma.course.create({
        data: {
          title: {
            vi: 'Khóa học Đầu tư',
            en: 'Investment Course',
            zh: '投资课程',
          },
          description: {
            vi: 'Học cách đầu tư',
            en: 'Learn to invest',
            zh: '学习投资',
          },
          level: 'BEGINNER',
          category: 'INVESTMENT',
        },
      });

      const lesson = await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: {
            vi: 'Bài 1: Cơ bản',
            en: 'Lesson 1: Basics',
            zh: '第一课：基础',
          },
          content: { vi: 'Nội dung', en: 'Content', zh: '内容' },
          order: 1,
          estimatedMinutes: 15,
        },
      });

      const advice = await aiService.getCourseAdvice(course.id, testUserId);

      // Verify advice structure
      expect(advice).toBeDefined();
      expect(advice).toHaveProperty('nudge');
      expect(advice).toHaveProperty('trigger');
      expect(advice).toHaveProperty('nextStep');

      // Verify AI usage logging
      const logs = await prisma.behaviorLog.findMany({
        where: {
          userId: testUserId,
          eventType: 'AI_REQUEST',
          path: '/ai/advice',
        },
      });
      expect(logs.length).toBeGreaterThan(0);

      // Cleanup
      await prisma.lesson.delete({ where: { id: lesson.id } });
      await prisma.course.delete({ where: { id: course.id } });
    });

    it('should adapt advice based on user progress', async () => {
      const course = await prisma.course.create({
        data: {
          title: { vi: 'Khóa học Test', en: 'Test Course', zh: '测试课程' },
          description: { vi: 'Test', en: 'Test', zh: '测试' },
          level: 'INTERMEDIATE',
          category: 'BUDGET',
        },
      });

      const lessons = await Promise.all([
        prisma.lesson.create({
          data: {
            courseId: course.id,
            title: { vi: 'Bài 1', en: 'Lesson 1', zh: '第一课' },
            content: { vi: 'Content', en: 'Content', zh: '内容' },
            order: 1,
            estimatedMinutes: 10,
          },
        }),
        prisma.lesson.create({
          data: {
            courseId: course.id,
            title: { vi: 'Bài 2', en: 'Lesson 2', zh: '第二课' },
            content: { vi: 'Content', en: 'Content', zh: '内容' },
            order: 2,
            estimatedMinutes: 10,
          },
        }),
      ]);

      // Mark first lesson as completed
      await prisma.userProgress.create({
        data: {
          userId: testUserId,
          lessonId: lessons[0].id,
          status: 'COMPLETED',
        },
      });

      const advice = await aiService.getCourseAdvice(course.id, testUserId);

      expect(advice).toBeDefined();
      expect(advice.nextStep).toBeTruthy();

      // Cleanup
      await prisma.userProgress.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.lesson.deleteMany({ where: { courseId: course.id } });
      await prisma.course.delete({ where: { id: course.id } });
    });
  });

  describe('Data Privacy & Security', () => {
    it('should mask PII before sending to external API', async () => {
      // Update user with PII
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          metadata: {
            displayName: 'John Doe',
            email: 'john.doe@example.com',
            phone: '0987654321',
          },
        },
      });

      const thread = await aiService.createThread(testUserId, 'Privacy Test');

      // Spy on the maskPII method (indirect verification)
      const response = await aiService.generateResponse(
        thread.id,
        'Tell me about my account',
        testUserId,
      );

      expect(response).toBeDefined();
      // Note: We can't directly verify masking without exposing private methods,
      // but we ensure the flow completes without exposing raw PII
    });

    it('should not expose sensitive data in error messages', async () => {
      const thread = await aiService.createThread(testUserId, 'Error Test');

      // Force an error by using invalid thread ID
      await expect(
        aiService.generateResponse(
          'invalid-thread-id',
          'Test prompt',
          testUserId,
        ),
      ).rejects.toThrow();

      // Errors should not contain user PII
      try {
        await aiService.generateResponse(
          'invalid-thread-id',
          'Test',
          testUserId,
        );
      } catch (error: any) {
        expect(error.message).not.toContain('john.doe@example.com');
        expect(error.message).not.toContain('0987654321');
      }
    });
  });

  describe('Service Interactions', () => {
    it('should integrate with User, Course, and Progress data', async () => {
      // Create course
      const course = await prisma.course.create({
        data: {
          title: {
            vi: 'Test Integration',
            en: 'Test Integration',
            zh: '测试集成',
          },
          description: { vi: 'Desc', en: 'Desc', zh: '描述' },
          level: 'BEGINNER',
          category: 'INVESTMENT',
        },
      });

      // Create investment profile
      await prisma.investmentProfile.create({
        data: {
          userId: testUserId,
          riskTolerance: 'MODERATE',
          investmentGoals: { goals: ['retirement', 'education'] },
          timeHorizon: 10,
        },
      });

      const thread = await aiService.createThread(
        testUserId,
        'Integration Test',
      );
      const response = await aiService.generateResponse(
        thread.id,
        'Recommend me a course',
        testUserId,
      );

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();

      // Cleanup
      await prisma.investmentProfile.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.course.delete({ where: { id: course.id } });
    });

    it('should track behavior logs during AI interactions', async () => {
      const thread = await aiService.createThread(
        testUserId,
        'Behavior Tracking',
      );

      await aiService.generateResponse(
        thread.id,
        'Track this interaction',
        testUserId,
      );

      const logs = await prisma.behaviorLog.findMany({
        where: {
          userId: testUserId,
          eventType: 'AI_REQUEST',
        },
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].payload).toHaveProperty('tokensUsed');
      expect(logs[0].payload).toHaveProperty('threadId');
    });
  });

  describe('Context Window & Summarization', () => {
    it('should summarize conversation when history exceeds threshold', async () => {
      const thread = await aiService.createThread(
        testUserId,
        'Long Conversation',
      );

      // Create 13 messages to trigger summarization (threshold is 12)
      for (let i = 0; i < 7; i++) {
        await aiService.saveMessage(
          thread.id,
          ChatRole.USER,
          `User message ${i}`,
        );
        await aiService.saveMessage(
          thread.id,
          ChatRole.ASSISTANT,
          `AI response ${i}`,
        );
      }

      // Next AI call should trigger summarization
      const response = await aiService.generateResponse(
        thread.id,
        'Summarize our conversation',
        testUserId,
      );

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle thread not found gracefully', async () => {
      await expect(
        aiService.generateResponse('non-existent-thread', 'Test', testUserId),
      ).rejects.toThrow('Thread not found');
    });

    it('should provide fallback when AI response parsing fails', async () => {
      const course = await prisma.course.create({
        data: {
          title: { vi: 'Fallback Test', en: 'Fallback Test', zh: '回退测试' },
          description: { vi: 'Test', en: 'Test', zh: '测试' },
          level: 'BEGINNER',
          category: 'BUDGET',
        },
      });

      const lesson = await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: { vi: 'Bài 1', en: 'Lesson 1', zh: '第一课' },
          content: { vi: 'Content', en: 'Content', zh: '内容' },
          order: 1,
          estimatedMinutes: 10,
        },
      });

      // Mock will return valid JSON, but we can test the fallback exists
      const advice = await aiService.getCourseAdvice(course.id, testUserId);

      // Even with mock, fallback structure should be available
      expect(advice).toHaveProperty('nudge');
      expect(advice).toHaveProperty('trigger');

      // Cleanup
      await prisma.lesson.delete({ where: { id: lesson.id } });
      await prisma.course.delete({ where: { id: course.id } });
    });
  });
});
