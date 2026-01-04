import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { ChatRole } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;
  let prismaService: any;
  let configService: any;
  let cacheManager: any;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      generateContent: vi.fn(),
      startChat: vi.fn(),
    };

    prismaService = {
      behaviorLog: {
        count: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      chatThread: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      chatMessage: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      course: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      userProgress: {
        findMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(prismaService)),
    };

    configService = {
      get: vi.fn((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        return null;
      }),
    };

    cacheManager = {
      get: vi.fn(),
      set: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: configService },
        { provide: PrismaService, useValue: prismaService },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    service.onModuleInit();

    // Mock the private model after initialization
    service['model'] = mockModel;
  });

  describe('onModuleInit', () => {
    it('should initialize with GEMINI_API_KEY from ConfigService', () => {
      expect(configService.get).toHaveBeenCalledWith('GEMINI_API_KEY');
      expect(service.modelInstance).toBeDefined();
    });

    it('should log error when GEMINI_API_KEY is missing', () => {
      configService.get.mockReturnValue(null);
      process.env.GEMINI_API_KEY = undefined;

      const loggerSpy = vi.spyOn(service['logger'], 'error');
      service.onModuleInit();

      expect(loggerSpy).toHaveBeenCalledWith(
        'GEMINI_API_KEY is not defined in environment variables',
      );
    });

    it('should fallback to process.env when ConfigService is unavailable', () => {
      const serviceWithoutConfig = new AiService(
        null as any,
        prismaService,
        cacheManager,
      );
      process.env.GEMINI_API_KEY = 'env-api-key';

      serviceWithoutConfig.onModuleInit();
      expect(process.env.GEMINI_API_KEY).toBe('env-api-key');
    });
  });

  describe('Rate Limiting & Token Budgeting', () => {
    const userId = 'user-123';

    it('should throw ForbiddenException when rate limit exceeded', async () => {
      prismaService.behaviorLog.count.mockResolvedValue(25);

      await expect(service['checkUserAIUsage'](userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service['checkUserAIUsage'](userId)).rejects.toThrow(
        'AI rate limit exceeded. Please wait a minute.',
      );
    });

    it('should throw ForbiddenException when monthly budget exceeded', async () => {
      prismaService.behaviorLog.count.mockResolvedValue(5);
      prismaService.behaviorLog.findMany.mockResolvedValue(
        Array(10).fill({ payload: { tokensUsed: 6000 } }),
      );

      await expect(service['checkUserAIUsage'](userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service['checkUserAIUsage'](userId)).rejects.toThrow(
        'Monthly AI token budget exceeded.',
      );
    });

    it('should return total tokens used when limits not exceeded', async () => {
      prismaService.behaviorLog.count.mockResolvedValue(5);
      prismaService.behaviorLog.findMany.mockResolvedValue([
        { payload: { tokensUsed: 100 } },
        { payload: { tokensUsed: 200 } },
        { payload: {} },
      ]);

      const result = await service['checkUserAIUsage'](userId);
      expect(result).toBe(300);
    });

    it('should handle missing tokensUsed in payload', async () => {
      prismaService.behaviorLog.count.mockResolvedValue(1);
      prismaService.behaviorLog.findMany.mockResolvedValue([
        { payload: null },
        { payload: {} },
        { payload: { tokensUsed: 50 } },
      ]);

      const result = await service['checkUserAIUsage'](userId);
      expect(result).toBe(50);
    });
  });

  describe('PII Masking', () => {
    it('should mask email addresses', () => {
      const data = { email: 'user@example.com', name: 'John' };
      const masked = service['maskPII'](data);

      expect(masked.email).toBe('***@***.***');
      expect(masked.name).toBe('John');
    });

    it('should mask displayName and fullName', () => {
      const data = { displayName: 'John Doe', fullName: 'Johnathan Doe' };
      const masked = service['maskPII'](data);

      expect(masked.displayName).toBe('J***e');
      expect(masked.fullName).toBe('J***e');
    });

    it('should mask phone and address recursively', () => {
      const data = {
        user: {
          phone: '0123456789',
          address: '123 Main Street',
          metadata: { email: 'test@test.com' },
        },
      };
      const masked = service['maskPII'](data);

      expect(masked.user.phone).toBe('0***9');
      expect(masked.user.address).toBe('1***t');
      expect(masked.user.metadata.email).toBe('***@***.***');
    });

    it('should handle null and undefined data', () => {
      expect(service['maskPII'](null)).toBeNull();
      expect(service['maskPII'](undefined)).toBeUndefined();
    });

    it('should mask short strings properly', () => {
      const data = { displayName: 'Jo' };
      const masked = service['maskPII'](data);
      expect(masked.displayName).toBe('***');
    });
  });

  describe('Thread Management', () => {
    const userId = 'user-123';
    const threadId = 'thread-456';

    it('should create thread with title and module', async () => {
      const mockThread = {
        id: threadId,
        userId,
        title: 'Test Thread',
        module: 'courses',
      };
      prismaService.chatThread.create.mockResolvedValue(mockThread);

      const result = await service.createThread(
        userId,
        'Test Thread',
        'courses',
      );

      expect(prismaService.chatThread.create).toHaveBeenCalledWith({
        data: { userId, title: 'Test Thread', module: 'courses' },
      });
      expect(result).toEqual(mockThread);
    });

    it('should create thread without module', async () => {
      const mockThread = { id: threadId, userId, title: 'General Chat' };
      prismaService.chatThread.create.mockResolvedValue(mockThread);

      await service.createThread(userId, 'General Chat');

      expect(prismaService.chatThread.create).toHaveBeenCalledWith({
        data: { userId, title: 'General Chat', module: undefined },
      });
    });

    it('should get threads ordered by updatedAt desc', async () => {
      const mockThreads = [
        { id: '1', title: 'Thread 1', updatedAt: new Date('2025-12-20') },
        { id: '2', title: 'Thread 2', updatedAt: new Date('2025-12-21') },
      ];
      prismaService.chatThread.findMany.mockResolvedValue(mockThreads);

      const result = await service.getThreads(userId);

      expect(prismaService.chatThread.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(mockThreads);
    });

    it('should get messages ordered by createdAt asc', async () => {
      const mockMessages = [
        {
          id: '1',
          content: 'Hello',
          createdAt: new Date('2025-12-20T10:00:00Z'),
        },
        { id: '2', content: 'Hi', createdAt: new Date('2025-12-20T10:01:00Z') },
      ];
      prismaService.chatMessage.findMany.mockResolvedValue(mockMessages);

      const result = await service.getMessages(threadId);

      expect(prismaService.chatMessage.findMany).toHaveBeenCalledWith({
        where: { threadId },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockMessages);
    });

    it('should save message and update thread timestamp', async () => {
      const mockMessage = {
        id: 'msg-1',
        threadId,
        role: ChatRole.USER,
        content: 'Test',
      };
      prismaService.chatMessage.create.mockResolvedValue(mockMessage);
      prismaService.chatThread.update.mockResolvedValue({});

      const result = await service.saveMessage(
        threadId,
        ChatRole.USER,
        'Test',
        { meta: 'data' },
      );

      expect(prismaService.chatMessage.create).toHaveBeenCalledWith({
        data: {
          threadId,
          role: ChatRole.USER,
          content: 'Test',
          metadata: { meta: 'data' },
        },
      });
      expect(prismaService.chatThread.update).toHaveBeenCalledWith({
        where: { id: threadId },
        data: { updatedAt: expect.any(Date) },
      });
      expect(result).toEqual([mockMessage]);
    });
  });

  describe('Course Advice Generation', () => {
    const userId = 'user-123';
    const courseId = 'course-456';

    beforeEach(() => {
      prismaService.behaviorLog.count.mockResolvedValue(0);
      prismaService.behaviorLog.findMany.mockResolvedValue([]);
    });

    it('should generate course advice with progress tracking', async () => {
      const mockCourse = {
        id: courseId,
        title: { vi: 'Khóa học Đầu tư', en: 'Investment Course' },
        lessons: [
          { id: 'l1', title: { vi: 'Bài 1' }, order: 1 },
          { id: 'l2', title: { vi: 'Bài 2' }, order: 2 },
        ],
      };
      const mockProgress = [{ lessonId: 'l1', status: 'COMPLETED' }];

      prismaService.course.findUnique.mockResolvedValue(mockCourse);
      prismaService.userProgress.findMany.mockResolvedValue(mockProgress);
      prismaService.behaviorLog.create.mockResolvedValue({});

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () =>
            '```json\n{"nudge":"Start now!","trigger":"Click here","nextStep":"l2"}\n```',
        },
      });

      const result = await service.getCourseAdvice(courseId, userId);

      expect(result).toEqual({
        nudge: 'Start now!',
        trigger: 'Click here',
        nextStep: 'l2',
      });
      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            eventType: 'AI_REQUEST',
            path: '/ai/advice',
            payload: expect.objectContaining({ courseId }),
          }),
        }),
      );
    });

    it('should use loss aversion for medium progress', async () => {
      const mockCourse = {
        id: courseId,
        title: { vi: 'Test Course' },
        lessons: Array(10)
          .fill(null)
          .map((_, i) => ({
            id: `l${i}`,
            title: { vi: `Lesson ${i}` },
            order: i,
          })),
      };
      const mockProgress = Array(5)
        .fill(null)
        .map((_, i) => ({ lessonId: `l${i}`, status: 'COMPLETED' }));

      prismaService.course.findUnique.mockResolvedValue(mockCourse);
      prismaService.userProgress.findMany.mockResolvedValue(mockProgress);

      mockModel.generateContent.mockImplementation((prompt) => {
        expect(prompt).toContain('Loss Aversion');
        return {
          response: {
            text: () => '{"nudge":"test","trigger":"test","nextStep":"l5"}',
          },
        };
      });

      await service.getCourseAdvice(courseId, userId);

      expect(mockModel.generateContent).toHaveBeenCalled();
    });

    it('should use goal gradient for near completion', async () => {
      const mockCourse = {
        id: courseId,
        title: { vi: 'Test Course' },
        lessons: Array(10)
          .fill(null)
          .map((_, i) => ({
            id: `l${i}`,
            title: { vi: `Lesson ${i}` },
            order: i,
          })),
      };
      const mockProgress = Array(9)
        .fill(null)
        .map((_, i) => ({ lessonId: `l${i}`, status: 'COMPLETED' }));

      prismaService.course.findUnique.mockResolvedValue(mockCourse);
      prismaService.userProgress.findMany.mockResolvedValue(mockProgress);

      mockModel.generateContent.mockImplementation((prompt) => {
        expect(prompt).toContain('Goal Gradient');
        return {
          response: {
            text: () => '{"nudge":"test","trigger":"test","nextStep":"l9"}',
          },
        };
      });

      await service.getCourseAdvice(courseId, userId);
    });

    it('should return fallback advice on JSON parse error', async () => {
      prismaService.course.findUnique.mockResolvedValue({
        id: courseId,
        title: { vi: 'Test' },
        lessons: [{ id: 'l1', title: { vi: 'Lesson 1' }, order: 1 }],
      });
      prismaService.userProgress.findMany.mockResolvedValue([]);

      mockModel.generateContent.mockResolvedValue({
        response: { text: () => 'Invalid JSON response from AI' },
      });

      const result = await service.getCourseAdvice(courseId, userId);

      expect(result).toEqual({
        nudge: 'Tiếp tục hành trình chinh phục tài chính của bạn!',
        trigger: 'Bắt đầu bài học tiếp theo ngay',
        nextStep: 'l1',
      });
    });

    it('should check user AI usage before generating advice', async () => {
      prismaService.behaviorLog.count.mockResolvedValue(25);

      await expect(service.getCourseAdvice(courseId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should log token usage for advice generation', async () => {
      prismaService.course.findUnique.mockResolvedValue({
        id: courseId,
        title: { vi: 'Test' },
        lessons: [],
      });
      prismaService.userProgress.findMany.mockResolvedValue([]);

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => '{"nudge":"test","trigger":"test","nextStep":"l1"}',
        },
      });

      await service.getCourseAdvice(courseId, userId);

      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              tokensUsed: expect.any(Number),
            }),
          }),
        }),
      );
    });
  });

  describe('Chat Response Generation', () => {
    const userId = 'user-123';
    const threadId = 'thread-456';
    const userPrompt = 'How do I invest?';

    beforeEach(() => {
      prismaService.behaviorLog.count.mockResolvedValue(0);
      prismaService.behaviorLog.findMany.mockResolvedValue([]);
      prismaService.behaviorLog.create.mockResolvedValue({});
    });

    it('should generate response with context and history', async () => {
      const mockThread = {
        id: threadId,
        userId,
        messages: [
          {
            id: '1',
            role: ChatRole.USER,
            content: 'Hello',
            createdAt: new Date(),
          },
          {
            id: '2',
            role: ChatRole.ASSISTANT,
            content: 'Hi!',
            createdAt: new Date(),
          },
          {
            id: '3',
            role: ChatRole.USER,
            content: 'Tell me more',
            createdAt: new Date(),
          },
        ],
      };

      prismaService.chatThread.findUnique.mockResolvedValue(mockThread);
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        metadata: { displayName: 'Test User' },
        investmentProfile: { riskTolerance: 'MODERATE' },
        progress: [],
      });
      prismaService.course.findMany.mockResolvedValue([]);

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: { text: () => 'Start with index funds' },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);

      prismaService.chatMessage.create.mockResolvedValue({
        id: 'msg-new',
        content: 'Start with index funds',
      });

      const result = await service.generateResponse(
        threadId,
        userPrompt,
        userId,
      );

      expect(mockModel.startChat).toHaveBeenCalledWith({
        history: expect.arrayContaining([
          expect.objectContaining({ role: 'user' }),
          expect.objectContaining({ role: 'model' }),
        ]),
        systemInstruction: expect.stringContaining('Financial Mentor'),
      });
      expect(mockChat.sendMessage).toHaveBeenCalledWith(userPrompt);
      expect(result.content).toBe('Start with index funds');
    });

    it('should throw NotFoundException when thread not found', async () => {
      prismaService.chatThread.findUnique.mockResolvedValue(null);

      await expect(
        service.generateResponse(threadId, userPrompt, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should summarize history when messages exceed threshold', async () => {
      const messages = Array(15)
        .fill(null)
        .map((_, i) => ({
          id: `msg-${i}`,
          role: i % 2 === 0 ? ChatRole.USER : ChatRole.ASSISTANT,
          content: `Message ${i}`,
          createdAt: new Date(),
        }));

      prismaService.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        userId,
        messages,
      });
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        progress: [],
      });
      prismaService.course.findMany.mockResolvedValue([]);

      mockModel.generateContent.mockResolvedValue({
        response: { text: () => 'Summary of conversation' },
      });

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: { text: () => 'Response with summary' },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);
      prismaService.chatMessage.create.mockResolvedValue({});

      await service.generateResponse(threadId, userPrompt, userId);

      expect(mockModel.startChat).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: expect.stringContaining(
            'PREVIOUS CONVERSATION SUMMARY',
          ),
        }),
      );
    });

    it('should mask PII in user context', async () => {
      prismaService.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        userId,
        messages: [],
      });
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        metadata: { displayName: 'John Doe', email: 'john@example.com' },
        progress: [],
      });
      prismaService.course.findMany.mockResolvedValue([]);

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: { text: () => 'Response' },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);
      prismaService.chatMessage.create.mockResolvedValue({});

      await service.generateResponse(threadId, userPrompt, userId);

      expect(mockModel.startChat).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: expect.not.stringContaining('john@example.com'),
        }),
      );
    });

    it('should log token usage after response', async () => {
      prismaService.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        userId,
        messages: [],
      });
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        progress: [],
      });
      prismaService.course.findMany.mockResolvedValue([]);

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: { text: () => 'Test response' },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);
      prismaService.chatMessage.create.mockResolvedValue({});

      await service.generateResponse(threadId, userPrompt, userId);

      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            eventType: 'AI_REQUEST',
            path: '/ai/chat',
            payload: expect.objectContaining({
              tokensUsed: expect.any(Number),
              threadId,
            }),
          }),
        }),
      );
    });

    it('should parse action cards from response', async () => {
      prismaService.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        userId,
        messages: [],
      });
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        progress: [],
      });
      prismaService.course.findMany.mockResolvedValue([]);

      const responseWithCard =
        'Here is advice [ACTION_CARD]{"action":"ENROLL","courseId":"c1"}[/ACTION_CARD] for you';

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: { text: () => responseWithCard },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);

      prismaService.chatMessage.create.mockResolvedValue({
        id: 'msg-1',
        content: 'Here is advice for you',
        metadata: { action: 'ENROLL', courseId: 'c1', hasActionCard: true },
      });

      const result = await service.generateResponse(
        threadId,
        userPrompt,
        userId,
      );

      expect(result.content).toBe('Here is advice for you');
      expect(result.metadata).toEqual({
        action: 'ENROLL',
        courseId: 'c1',
        hasActionCard: true,
      });
    });

    it('should use cache for FAQ questions', async () => {
      const faqPrompt = 'What is V-EdFinance?';
      const cachedResponse = {
        cleanText: 'V-EdFinance is a platform',
        metadata: { type: 'TEXT' },
      };

      cacheManager.get.mockResolvedValue(cachedResponse);

      prismaService.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        userId,
        messages: [],
      });
      prismaService.chatMessage.create.mockResolvedValue({
        id: 'msg-1',
        content: cachedResponse.cleanText,
      });

      const result = await service.generateResponse(
        threadId,
        faqPrompt,
        userId,
      );

      expect(cacheManager.get).toHaveBeenCalled();
      expect(mockModel.startChat).not.toHaveBeenCalled();
    });

    it('should cache FAQ responses', async () => {
      const faqPrompt = 'Cách làm thế nào để đầu tư?';

      cacheManager.get.mockResolvedValue(null);
      prismaService.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        userId,
        messages: [],
      });
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        progress: [],
      });
      prismaService.course.findMany.mockResolvedValue([]);

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: { text: () => 'Bạn nên bắt đầu với quỹ chỉ số' },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);
      prismaService.chatMessage.create.mockResolvedValue({});

      await service.generateResponse(threadId, faqPrompt, userId);

      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cleanText: 'Bạn nên bắt đầu với quỹ chỉ số',
        }),
        3600 * 24,
      );
    });
  });

  describe('Helper Functions', () => {
    describe('parseActionCards', () => {
      it('should parse valid action card JSON', () => {
        const text =
          'Some text [ACTION_CARD]{"action":"ENROLL","courseId":"c1"}[/ACTION_CARD] more text';
        const result = service['parseActionCards'](text);

        expect(result.cleanText).toBe('Some text  more text');
        expect(result.metadata).toEqual({
          action: 'ENROLL',
          courseId: 'c1',
          hasActionCard: true,
        });
      });

      it('should handle text without action cards', () => {
        const text = 'Regular text without cards';
        const result = service['parseActionCards'](text);

        expect(result.cleanText).toBe('Regular text without cards');
        expect(result.metadata).toEqual({ type: 'TEXT' });
      });

      it('should handle invalid JSON in action card', () => {
        const text = 'Text [ACTION_CARD]invalid json[/ACTION_CARD] more';
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const result = service['parseActionCards'](text);

        expect(result.cleanText).toBe('Text  more');
        expect(result.metadata).toEqual({ type: 'TEXT' });
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });
    });

    describe('generateCacheKey', () => {
      it('should generate consistent hash for same prompt', () => {
        const prompt = 'What is investment?';
        const key1 = service['generateCacheKey'](prompt);
        const key2 = service['generateCacheKey'](prompt);

        expect(key1).toBe(key2);
        expect(key1).toContain('ai_response:');
      });

      it('should be case-insensitive', () => {
        const key1 = service['generateCacheKey']('What is Investment?');
        const key2 = service['generateCacheKey']('what is investment?');

        expect(key1).toBe(key2);
      });

      it('should trim whitespace', () => {
        const key1 = service['generateCacheKey']('  test prompt  ');
        const key2 = service['generateCacheKey']('test prompt');

        expect(key1).toBe(key2);
      });
    });

    describe('classifyIntent', () => {
      it('should classify FAQ questions (Vietnamese)', () => {
        expect(service['classifyIntent']('Đầu tư là gì?')).toBe('GENERAL_FAQ');
        expect(service['classifyIntent']('Định nghĩa của cổ phiếu')).toBe(
          'GENERAL_FAQ',
        );
        expect(
          service['classifyIntent']('Cách làm thế nào để mua cổ phiếu?'),
        ).toBe('GENERAL_FAQ');
        expect(service['classifyIntent']('Tại sao phải đầu tư?')).toBe(
          'GENERAL_FAQ',
        );
      });

      it('should classify FAQ questions (English)', () => {
        expect(service['classifyIntent']('What is investment?')).toBe(
          'GENERAL_FAQ',
        );
        expect(service['classifyIntent']('How to buy stocks?')).toBe(
          'GENERAL_FAQ',
        );
      });

      it('should classify personalized queries', () => {
        expect(
          service['classifyIntent']('Should I invest in this stock?'),
        ).toBe('PERSONALIZED_ADVICE');
        expect(service['classifyIntent']('Help me with my portfolio')).toBe(
          'PERSONALIZED_ADVICE',
        );
      });

      it('should handle mixed case', () => {
        expect(service['classifyIntent']('WHAT IS INVESTMENT?')).toBe(
          'GENERAL_FAQ',
        );
      });
    });

    describe('summarizeHistory', () => {
      it('should summarize message history', async () => {
        const messages = [
          { role: ChatRole.USER, content: 'How do I start investing?' },
          { role: ChatRole.ASSISTANT, content: 'Start with index funds' },
          { role: ChatRole.USER, content: 'What about stocks?' },
        ];

        mockModel.generateContent.mockResolvedValue({
          response: { text: () => 'User asked about investing basics' },
        });

        const result = await service['summarizeHistory'](messages);

        expect(result).toBe('User asked about investing basics');
        expect(mockModel.generateContent).toHaveBeenCalledWith(
          expect.stringContaining('Summarize the following'),
        );
      });

      it('should return empty string on error', async () => {
        const messages = [{ role: ChatRole.USER, content: 'Test' }];

        mockModel.generateContent.mockRejectedValue(new Error('API Error'));
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const result = await service['summarizeHistory'](messages);

        expect(result).toBe('');
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should reverse messages for chronological order', async () => {
        const messages = [
          { role: ChatRole.ASSISTANT, content: 'Third' },
          { role: ChatRole.USER, content: 'Second' },
          { role: ChatRole.USER, content: 'First' },
        ];

        mockModel.generateContent.mockImplementation((prompt) => {
          expect(prompt).toContain('USER: First');
          expect(prompt).toContain('USER: Second');
          expect(prompt).toContain('ASSISTANT: Third');
          return { response: { text: () => 'Summary' } };
        });

        await service['summarizeHistory'](messages);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Gemini API timeout', async () => {
      const userId = 'user-123';
      const threadId = 'thread-456';

      prismaService.behaviorLog.count.mockResolvedValue(0);
      prismaService.behaviorLog.findMany.mockResolvedValue([]);
      prismaService.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        userId,
        messages: [],
      });
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        progress: [],
      });
      prismaService.course.findMany.mockResolvedValue([]);

      const mockChat = {
        sendMessage: vi.fn().mockRejectedValue(new Error('Request timeout')),
      };
      mockModel.startChat.mockReturnValue(mockChat);

      await expect(
        service.generateResponse(threadId, 'Test', userId),
      ).rejects.toThrow('Request timeout');
    });

    it('should handle invalid course ID in getCourseAdvice', async () => {
      prismaService.behaviorLog.count.mockResolvedValue(0);
      prismaService.behaviorLog.findMany.mockResolvedValue([]);
      prismaService.course.findUnique.mockResolvedValue(null);
      prismaService.userProgress.findMany.mockResolvedValue([]);

      await expect(
        service.getCourseAdvice('invalid-id', 'user-123'),
      ).rejects.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full chat flow with rate limiting and caching', async () => {
      const userId = 'user-123';
      const threadId = 'thread-456';
      const prompt = 'What is v-edfinance?';

      prismaService.behaviorLog.count.mockResolvedValue(5);
      prismaService.behaviorLog.findMany.mockResolvedValue([
        { payload: { tokensUsed: 1000 } },
      ]);
      cacheManager.get.mockResolvedValue(null);
      prismaService.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        userId,
        messages: [],
      });
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        progress: [],
      });
      prismaService.course.findMany.mockResolvedValue([]);

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: () => 'V-EdFinance is a financial education platform',
          },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);
      prismaService.chatMessage.create.mockResolvedValue({
        id: 'msg-1',
        content: 'V-EdFinance is a financial education platform',
      });

      await service.generateResponse(threadId, prompt, userId);

      expect(prismaService.behaviorLog.count).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
      expect(prismaService.behaviorLog.create).toHaveBeenCalled();
    });
  });
});
