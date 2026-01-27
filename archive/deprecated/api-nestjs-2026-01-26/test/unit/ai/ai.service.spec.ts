import { ForbiddenException } from '@nestjs/common';
import { ChatRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiService } from '../../../src/ai/ai.service';

describe('AiService', () => {
  let service: AiService;
  let prisma: any;
  let configService: any;
  let cacheManager: any;
  let model: any;

  beforeEach(() => {
    prisma = {
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
        findMany: vi.fn(),
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      course: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      userProgress: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(prisma)),
    };
    configService = {
      get: vi.fn().mockReturnValue('mock-api-key'),
    };
    cacheManager = {
      get: vi.fn(),
      set: vi.fn(),
    };
    model = {
      generateContent: vi.fn(),
      startChat: vi.fn(),
    };

    service = new AiService(configService, prisma, cacheManager);
    (service as any).model = model;
  });

  describe('checkUserAIUsage', () => {
    it('should throw ForbiddenException if rate limit is exceeded', async () => {
      prisma.behaviorLog.count.mockResolvedValue(20);
      await expect((service as any).checkUserAIUsage('user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if monthly budget is exceeded', async () => {
      prisma.behaviorLog.count.mockResolvedValue(10);
      prisma.behaviorLog.findMany.mockResolvedValue([
        { payload: { tokensUsed: 40000 } },
        { payload: { tokensUsed: 15000 } },
      ]);
      await expect((service as any).checkUserAIUsage('user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return total tokens used if within limits', async () => {
      prisma.behaviorLog.count.mockResolvedValue(5);
      prisma.behaviorLog.findMany.mockResolvedValue([
        { payload: { tokensUsed: 5000 } },
      ]);
      const result = await (service as any).checkUserAIUsage('user-1');
      expect(result).toBe(5000);
    });
  });

  describe('maskPII', () => {
    it('should mask email and sensitive fields', () => {
      const data = {
        email: 'test@example.com',
        displayName: 'John Doe',
        nested: { email: 'nested@test.com' },
      };
      const masked = (service as any).maskPII(data);
      expect(masked.email).toBe('***@***.***');
      expect(masked.displayName).toBe('J***e');
      expect(masked.nested.email).toBe('***@***.***');
    });
  });

  describe('generateResponse', () => {
    it('should return cached response for FAQ if available', async () => {
      const prompt = 'What is RSI?';
      const cached = { cleanText: 'RSI is...', metadata: { type: 'FAQ' } };
      cacheManager.get.mockResolvedValue(cached);

      const aiMsg = {
        id: 'msg-1',
        content: 'RSI is...',
        role: ChatRole.ASSISTANT,
      };
      prisma.chatMessage.create.mockResolvedValue(aiMsg);
      prisma.chatThread.update.mockResolvedValue({});

      const result = await service.generateResponse(
        'thread-1',
        prompt,
        'user-1',
      );

      expect(prisma.chatMessage.create).toHaveBeenCalled();
      expect(result.content).toBeDefined();
    });

    it('should generate new response and cache it for FAQ', async () => {
      const prompt = 'What is RSI?';
      cacheManager.get.mockResolvedValue(null);
      prisma.behaviorLog.count.mockResolvedValue(0);
      prisma.behaviorLog.findMany.mockResolvedValue([]);
      prisma.chatThread.findUnique.mockResolvedValue({
        id: 'thread-1',
        messages: [],
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', metadata: {} });
      prisma.course.findMany.mockResolvedValue([]);

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: { text: () => 'New AI response' },
        }),
      };
      model.startChat.mockReturnValue(mockChat);
      prisma.chatMessage.create.mockResolvedValue({
        content: 'New AI response',
      });

      await service.generateResponse('thread-1', prompt, 'user-1');

      expect(cacheManager.set).toHaveBeenCalled();
      expect(mockChat.sendMessage).toHaveBeenCalledWith(prompt);
    });
  });

  describe('parseActionCards', () => {
    it('should extract action card metadata', () => {
      const text =
        'Hello [ACTION_CARD] {"type": "QUIZ", "id": 1} [/ACTION_CARD] world';
      const result = (service as any).parseActionCards(text);
      expect(result.cleanText).toBe('Hello  world');
      expect(result.metadata.type).toBe('QUIZ');
      expect(result.metadata.hasActionCard).toBe(true);
    });
  });
});
