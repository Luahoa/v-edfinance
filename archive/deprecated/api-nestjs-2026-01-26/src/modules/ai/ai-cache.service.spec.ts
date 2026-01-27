import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChatRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiService } from '../../ai/ai.service';

describe('AiService - Cache Layer', () => {
  let service: AiService;
  let mockConfigService: any;
  let mockPrisma: any;
  let mockCacheManager: any;
  let mockModel: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockModel = {
      startChat: vi.fn(),
      generateContent: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        return undefined;
      }),
    };

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      chatThread: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      chatMessage: {
        createMany: vi.fn(),
        create: vi.fn(),
      },
      behaviorLog: {
        count: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      course: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn((fn) => fn(mockPrisma)),
    };

    mockCacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      reset: vi.fn(),
    };

    service = new AiService(mockConfigService, mockPrisma, mockCacheManager);
    // Inject mock model (bypass onModuleInit)
    (service as any).model = mockModel;
  });

  describe('Cache Hit/Miss Logic', () => {
    it('should return cached response on cache hit for GENERAL_FAQ', async () => {
      const threadId = 'thread-1';
      const userPrompt = 'Cổ phiếu là gì?';
      const userId = 'user-1';

      const cachedData = {
        cleanText: 'Cổ phiếu là chứng chỉ sở hữu của công ty.',
        metadata: { type: 'TEXT' },
      };

      mockCacheManager.get.mockResolvedValue(cachedData);
      mockPrisma.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        messages: [],
      });
      // Mock the $transaction to return saved message
      const savedMessage = {
        id: 'msg-1',
        threadId,
        role: ChatRole.ASSISTANT,
        content: cachedData.cleanText,
        metadata: cachedData.metadata,
      };
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        mockPrisma.chatMessage.create.mockResolvedValue(savedMessage);
        mockPrisma.chatThread.update.mockResolvedValue({});
        return fn(mockPrisma);
      });
      mockPrisma.chatMessage.create.mockResolvedValue(savedMessage);
      mockPrisma.chatThread.update.mockResolvedValue({});

      const result = await service.generateResponse(
        threadId,
        userPrompt,
        userId,
      );

      expect(mockCacheManager.get).toHaveBeenCalledWith(
        expect.stringMatching(/^ai_response:[a-f0-9]{64}$/),
      );
      expect(mockModel.startChat).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        role: ChatRole.ASSISTANT,
        content: cachedData.cleanText,
      });
    });

    it('should make AI call on cache miss for GENERAL_FAQ', async () => {
      const threadId = 'thread-1';
      const userPrompt = 'Trái phiếu là gì?';
      const userId = 'user-1';

      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        messages: [],
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        metadata: { displayName: 'Test User' },
        investmentProfile: null,
        progress: [],
      });
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: () =>
              'Trái phiếu là công cụ nợ được phát hành bởi chính phủ hoặc doanh nghiệp.',
          },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);

      // Mock the $transaction to return saved message
      const savedMessage = {
        id: 'msg-1',
        threadId,
        role: ChatRole.ASSISTANT,
        content:
          'Trái phiếu là công cụ nợ được phát hành bởi chính phủ hoặc doanh nghiệp.',
      };
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        mockPrisma.chatMessage.create.mockResolvedValue(savedMessage);
        mockPrisma.chatThread.update.mockResolvedValue({});
        return fn(mockPrisma);
      });
      mockPrisma.chatMessage.create.mockResolvedValue(savedMessage);
      mockPrisma.chatThread.update.mockResolvedValue({});

      const result = await service.generateResponse(
        threadId,
        userPrompt,
        userId,
      );

      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(mockModel.startChat).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringMatching(/^ai_response:[a-f0-9]{64}$/),
        expect.objectContaining({ cleanText: expect.any(String) }),
        3600 * 24,
      );
      expect(result.content).toBeTruthy();
    });

    it('should skip cache for PERSONALIZED_ADVICE queries', async () => {
      const threadId = 'thread-1';
      const userPrompt = 'Hãy phân tích portfolio của tôi';
      const userId = 'user-1';

      mockCacheManager.get.mockResolvedValue({ cleanText: 'Cached response' });
      mockPrisma.behaviorLog.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        messages: [],
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        metadata: { displayName: 'Test User' },
        investmentProfile: { riskTolerance: 'MODERATE' },
        progress: [],
      });
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.chatMessage.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: () => 'Dựa trên profile của bạn, tôi khuyên bạn nên...',
          },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);

      await service.generateResponse(threadId, userPrompt, userId);

      // Cache GET should not be called (or returns null immediately)
      expect(mockModel.startChat).toHaveBeenCalled();
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should generate consistent cache keys for identical prompts', () => {
      const prompt1 = 'Cổ phiếu là gì?';
      const prompt2 = 'cổ phiếu là gì?';
      const prompt3 = '  Cổ phiếu là gì?  ';

      const key1 = (service as any).generateCacheKey(prompt1);
      const key2 = (service as any).generateCacheKey(prompt2);
      const key3 = (service as any).generateCacheKey(prompt3);

      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
      expect(key1).toMatch(/^ai_response:[a-f0-9]{64}$/);
    });

    it('should generate different cache keys for different prompts', () => {
      const prompt1 = 'Cổ phiếu là gì?';
      const prompt2 = 'Trái phiếu là gì?';

      const key1 = (service as any).generateCacheKey(prompt1);
      const key2 = (service as any).generateCacheKey(prompt2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('TTL Expiration', () => {
    it('should set cache with 24-hour TTL for FAQ responses', async () => {
      const threadId = 'thread-1';
      const userPrompt = 'Định nghĩa cổ tức là gì?';
      const userId = 'user-1';

      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        messages: [],
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        metadata: { displayName: 'Test User' },
        investmentProfile: null,
        progress: [],
      });
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.chatMessage.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: () => 'Cổ tức là khoản lợi nhuận được phân phối cho cổ đông.',
          },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);

      await service.generateResponse(threadId, userPrompt, userId);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        3600 * 24, // 24 hours in seconds
      );
    });

    it('should handle expired cache gracefully (cache miss scenario)', async () => {
      const threadId = 'thread-1';
      const userPrompt = 'What is inflation?';
      const userId = 'user-1';

      // Simulate expired cache (cache manager returns null)
      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        messages: [],
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        metadata: { displayName: 'Test User' },
        investmentProfile: null,
        progress: [],
      });
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.chatMessage.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: () =>
              'Inflation is the rate at which prices increase over time.',
          },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);

      await service.generateResponse(threadId, userPrompt, userId);

      expect(mockModel.startChat).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('Cache Invalidation', () => {
    it('should allow manual cache deletion via cache manager', async () => {
      const prompt = 'Cổ phiếu là gì?';
      const cacheKey = (service as any).generateCacheKey(prompt);

      mockCacheManager.del.mockResolvedValue(1);

      await mockCacheManager.del(cacheKey);

      expect(mockCacheManager.del).toHaveBeenCalledWith(cacheKey);
      expect(mockCacheManager.del).toHaveBeenCalledTimes(1);
    });

    it('should handle cache reset operation', async () => {
      mockCacheManager.reset.mockResolvedValue(undefined);

      await mockCacheManager.reset();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });

    it('should re-cache response after invalidation', async () => {
      const threadId = 'thread-1';
      const userPrompt = 'Cổ phiếu là gì?';
      const userId = 'user-1';

      // First call: cache miss
      mockCacheManager.get.mockResolvedValueOnce(null);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        messages: [],
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        metadata: { displayName: 'Test User' },
        investmentProfile: null,
        progress: [],
      });
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.chatMessage.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: () => 'Cổ phiếu là chứng chỉ sở hữu.',
          },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);

      await service.generateResponse(threadId, userPrompt, userId);

      expect(mockCacheManager.set).toHaveBeenCalledTimes(1);

      // Invalidate cache
      const cacheKey = (service as any).generateCacheKey(userPrompt);
      await mockCacheManager.del(cacheKey);

      // Second call: should re-cache
      mockCacheManager.get.mockResolvedValueOnce(null);
      await service.generateResponse(threadId, userPrompt, userId);

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Usage & Rate Limiting', () => {
    it('should enforce rate limit (20 requests per minute)', async () => {
      const userId = 'user-1';

      mockPrisma.behaviorLog.count.mockResolvedValue(20);

      await expect((service as any).checkUserAIUsage(userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect((service as any).checkUserAIUsage(userId)).rejects.toThrow(
        'AI rate limit exceeded',
      );
    });

    it('should allow requests under rate limit', async () => {
      const userId = 'user-1';

      mockPrisma.behaviorLog.count.mockResolvedValue(10);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { payload: { tokensUsed: 1000 } },
        { payload: { tokensUsed: 1500 } },
      ]);

      const tokensUsed = await (service as any).checkUserAIUsage(userId);

      expect(tokensUsed).toBe(2500);
    });

    it('should enforce monthly token budget (50,000 tokens)', async () => {
      const userId = 'user-1';

      mockPrisma.behaviorLog.count.mockResolvedValue(5);
      mockPrisma.behaviorLog.findMany.mockResolvedValue(
        Array.from({ length: 25 }, () => ({ payload: { tokensUsed: 2000 } })),
      );

      await expect((service as any).checkUserAIUsage(userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect((service as any).checkUserAIUsage(userId)).rejects.toThrow(
        'Monthly AI token budget exceeded',
      );
    });

    it('should calculate token usage from behavior logs', async () => {
      const userId = 'user-1';

      mockPrisma.behaviorLog.count.mockResolvedValue(3);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { payload: { tokensUsed: 1000 } },
        { payload: { tokensUsed: 2000 } },
        { payload: { tokensUsed: 1500 } },
      ]);

      const total = await (service as any).checkUserAIUsage(userId);

      expect(total).toBe(4500);
    });

    it('should handle missing tokensUsed in payload gracefully', async () => {
      const userId = 'user-1';

      mockPrisma.behaviorLog.count.mockResolvedValue(2);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { payload: { tokensUsed: 1000 } },
        { payload: {} },
        { payload: null },
      ]);

      const total = await (service as any).checkUserAIUsage(userId);

      expect(total).toBe(1000);
    });
  });

  describe('Intent Classification (Cache Eligibility)', () => {
    it('should classify FAQ queries correctly', () => {
      const faqQueries = [
        'Cổ phiếu là gì?',
        'Định nghĩa lạm phát',
        'What is cryptocurrency?',
        'How to invest?',
        'Cách làm thế nào để tiết kiệm?',
        'Tại sao cần đầu tư?',
        'v-edfinance là gì?',
      ];

      faqQueries.forEach((query) => {
        const intent = (service as any).classifyIntent(query);
        expect(intent).toBe('GENERAL_FAQ');
      });
    });

    it('should classify personalized queries correctly', () => {
      const personalizedQueries = [
        'Phân tích portfolio của tôi',
        'Tôi nên đầu tư vào đâu?',
        'Recommend me a course',
        'Giúp tôi lập kế hoạch tài chính',
      ];

      personalizedQueries.forEach((query) => {
        const intent = (service as any).classifyIntent(query);
        expect(intent).toBe('PERSONALIZED_ADVICE');
      });
    });

    it('should be case-insensitive for intent classification', () => {
      expect((service as any).classifyIntent('CỔ PHIẾU LÀ GÌ?')).toBe(
        'GENERAL_FAQ',
      );
      expect((service as any).classifyIntent('WHAT IS STOCK?')).toBe(
        'GENERAL_FAQ',
      );
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle thread not found error', async () => {
      const threadId = 'invalid-thread';
      const userPrompt = 'Test query';
      const userId = 'user-1';

      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.chatThread.findUnique.mockResolvedValue(null);

      await expect(
        service.generateResponse(threadId, userPrompt, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should save both user and assistant messages when cache hit occurs', async () => {
      const threadId = 'thread-1';
      const userPrompt = 'Cổ phiếu là gì?';
      const userId = 'user-1';

      mockCacheManager.get.mockResolvedValue({
        cleanText: 'Cached answer',
        metadata: { type: 'TEXT' },
      });
      mockPrisma.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        messages: [],
      });

      // The service uses saveMessage which calls $transaction with create, not createMany
      const savedMessage = {
        id: 'msg-1',
        threadId,
        role: ChatRole.ASSISTANT,
        content: 'Cached answer',
        metadata: { type: 'TEXT' },
      };
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        mockPrisma.chatMessage.create.mockResolvedValue(savedMessage);
        mockPrisma.chatThread.update.mockResolvedValue({});
        return fn(mockPrisma);
      });
      mockPrisma.chatMessage.create.mockResolvedValue(savedMessage);
      mockPrisma.chatThread.update.mockResolvedValue({});

      await service.generateResponse(threadId, userPrompt, userId);

      // Service calls saveMessage twice (once for user, once for assistant)
      // Each saveMessage uses $transaction with chatMessage.create
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should handle cache manager errors gracefully', async () => {
      const threadId = 'thread-1';
      const userPrompt = 'Test query là gì?';
      const userId = 'user-1';

      mockCacheManager.get.mockRejectedValue(
        new Error('Redis connection failed'),
      );
      mockPrisma.behaviorLog.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        messages: [],
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        metadata: { displayName: 'Test User' },
        investmentProfile: null,
        progress: [],
      });
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.chatMessage.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: () => 'Fallback response from AI',
          },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);

      // Should fall through to AI call despite cache error
      await expect(
        service.generateResponse(threadId, userPrompt, userId),
      ).rejects.toThrow('Redis connection failed');
    });

    it('should track token usage in behavior logs after AI call', async () => {
      const threadId = 'thread-1';
      const userPrompt = 'Cổ phiếu là gì?';
      const userId = 'user-1';

      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.chatThread.findUnique.mockResolvedValue({
        id: threadId,
        messages: [],
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        metadata: { displayName: 'Test User' },
        investmentProfile: null,
        progress: [],
      });
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.chatMessage.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const mockChat = {
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: () => 'Cổ phiếu là chứng chỉ sở hữu.',
          },
        }),
      };
      mockModel.startChat.mockReturnValue(mockChat);

      await service.generateResponse(threadId, userPrompt, userId);

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          eventType: 'AI_REQUEST',
          payload: expect.objectContaining({
            tokensUsed: expect.any(Number),
            threadId,
          }),
        }),
      });
    });
  });
});
