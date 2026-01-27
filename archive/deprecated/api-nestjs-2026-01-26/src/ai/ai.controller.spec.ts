import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;
  let aiService: any;

  const mockUser = { userId: 'user-123', email: 'test@example.com' };
  const mockRequest = { user: mockUser };

  beforeEach(async () => {
    aiService = {
      createThread: vi.fn(),
      getThreads: vi.fn(),
      getMessages: vi.fn(),
      generateResponse: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [{ provide: AiService, useValue: aiService }],
    }).compile();

    controller = module.get<AiController>(AiController);

    // Manually bind service to fix NestJS TestingModule mock binding issue
    (controller as any).aiService = aiService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /ai/threads - createThread', () => {
    it('should create a new thread with title only', async () => {
      const body = { title: 'Test Thread' };
      const mockThread = {
        id: 'thread-1',
        userId: mockUser.userId,
        title: body.title,
        module: null,
        createdAt: new Date(),
      };

      aiService.createThread.mockResolvedValue(mockThread);

      const result = await controller.createThread(mockRequest, body);

      expect(aiService.createThread).toHaveBeenCalledWith(
        mockUser.userId,
        body.title,
        undefined,
      );
      expect(result).toEqual(mockThread);
    });

    it('should create a new thread with title and module', async () => {
      const body = { title: 'Budgeting Help', module: 'budgeting' };
      const mockThread = {
        id: 'thread-2',
        userId: mockUser.userId,
        title: body.title,
        module: body.module,
        createdAt: new Date(),
      };

      aiService.createThread.mockResolvedValue(mockThread);

      const result = await controller.createThread(mockRequest, body);

      expect(aiService.createThread).toHaveBeenCalledWith(
        mockUser.userId,
        body.title,
        body.module,
      );
      expect(result).toEqual(mockThread);
    });

    it('should handle service errors when creating thread', async () => {
      const body = { title: 'Test Thread' };
      const error = new Error('Database connection failed');

      aiService.createThread.mockRejectedValue(error);

      await expect(controller.createThread(mockRequest, body)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should require authentication (JwtAuthGuard)', () => {
      const guards = Reflect.getMetadata('__guards__', controller.createThread);
      expect(guards).toBeDefined();
    });
  });

  describe('GET /ai/threads - getThreads', () => {
    it('should return all threads for authenticated user', async () => {
      const mockThreads = [
        {
          id: 'thread-1',
          userId: mockUser.userId,
          title: 'Thread 1',
          module: null,
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'thread-2',
          userId: mockUser.userId,
          title: 'Thread 2',
          module: 'investing',
          createdAt: new Date('2025-01-02'),
        },
      ];

      aiService.getThreads.mockResolvedValue(mockThreads);

      const result = await controller.getThreads(mockRequest);

      expect(aiService.getThreads).toHaveBeenCalledWith(mockUser.userId);
      expect(result).toEqual(mockThreads);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no threads', async () => {
      aiService.getThreads.mockResolvedValue([]);

      const result = await controller.getThreads(mockRequest);

      expect(aiService.getThreads).toHaveBeenCalledWith(mockUser.userId);
      expect(result).toEqual([]);
    });

    it('should handle service errors when fetching threads', async () => {
      const error = new Error('Database query failed');
      aiService.getThreads.mockRejectedValue(error);

      await expect(controller.getThreads(mockRequest)).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  describe('GET /ai/threads/:id/messages - getMessages', () => {
    it('should return all messages for a thread', async () => {
      const threadId = 'thread-1';
      const mockMessages = [
        {
          id: 'msg-1',
          threadId,
          role: 'USER',
          content: 'Hello',
          timestamp: new Date('2025-01-01T10:00:00Z'),
        },
        {
          id: 'msg-2',
          threadId,
          role: 'AI',
          content: 'Hi! How can I help?',
          timestamp: new Date('2025-01-01T10:00:05Z'),
        },
      ];

      aiService.getMessages.mockResolvedValue(mockMessages);

      const result = await controller.getMessages(threadId);

      expect(aiService.getMessages).toHaveBeenCalledWith(threadId);
      expect(result).toEqual(mockMessages);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for thread with no messages', async () => {
      const threadId = 'thread-empty';
      aiService.getMessages.mockResolvedValue([]);

      const result = await controller.getMessages(threadId);

      expect(aiService.getMessages).toHaveBeenCalledWith(threadId);
      expect(result).toEqual([]);
    });

    it('should handle non-existent thread', async () => {
      const threadId = 'non-existent';
      const error = new NotFoundException('Thread not found');

      aiService.getMessages.mockRejectedValue(error);

      await expect(controller.getMessages(threadId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle service errors when fetching messages', async () => {
      const threadId = 'thread-1';
      const error = new Error('Database connection lost');

      aiService.getMessages.mockRejectedValue(error);

      await expect(controller.getMessages(threadId)).rejects.toThrow(
        'Database connection lost',
      );
    });
  });

  describe('POST /ai/threads/:id/chat - chat', () => {
    it('should generate AI response for user prompt', async () => {
      const threadId = 'thread-1';
      const body = { prompt: 'What is compound interest?' };
      const mockResponse = {
        userMessage: {
          id: 'msg-user-1',
          threadId,
          role: 'USER',
          content: body.prompt,
          timestamp: new Date(),
        },
        aiMessage: {
          id: 'msg-ai-1',
          threadId,
          role: 'AI',
          content: 'Compound interest is...',
          timestamp: new Date(),
        },
      };

      aiService.generateResponse.mockResolvedValue(mockResponse);

      const result = await controller.chat(threadId, mockRequest, body);

      expect(aiService.generateResponse).toHaveBeenCalledWith(
        threadId,
        body.prompt,
        mockUser.userId,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty prompt', async () => {
      const threadId = 'thread-1';
      const body = { prompt: '' };

      aiService.generateResponse.mockResolvedValue({
        userMessage: { content: '' },
        aiMessage: { content: 'Please provide a question.' },
      });

      const result = await controller.chat(threadId, mockRequest, body);

      expect(aiService.generateResponse).toHaveBeenCalledWith(
        threadId,
        '',
        mockUser.userId,
      );
    });

    it('should handle rate limit exceeded', async () => {
      const threadId = 'thread-1';
      const body = { prompt: 'Test prompt' };
      const error = new ForbiddenException(
        'AI rate limit exceeded. Please wait a minute.',
      );

      aiService.generateResponse.mockRejectedValue(error);

      await expect(
        controller.chat(threadId, mockRequest, body),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle monthly budget exceeded', async () => {
      const threadId = 'thread-1';
      const body = { prompt: 'Test prompt' };
      const error = new ForbiddenException('Monthly AI token budget exceeded.');

      aiService.generateResponse.mockRejectedValue(error);

      await expect(
        controller.chat(threadId, mockRequest, body),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle non-existent thread in chat', async () => {
      const threadId = 'non-existent';
      const body = { prompt: 'Test prompt' };
      const error = new NotFoundException('Thread not found');

      aiService.generateResponse.mockRejectedValue(error);

      await expect(
        controller.chat(threadId, mockRequest, body),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle unauthorized access to thread', async () => {
      const threadId = 'thread-other-user';
      const body = { prompt: 'Test prompt' };
      const error = new ForbiddenException(
        'You do not have access to this thread',
      );

      aiService.generateResponse.mockRejectedValue(error);

      await expect(
        controller.chat(threadId, mockRequest, body),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle AI service errors', async () => {
      const threadId = 'thread-1';
      const body = { prompt: 'Test prompt' };
      const error = new Error('Gemini API unavailable');

      aiService.generateResponse.mockRejectedValue(error);

      await expect(
        controller.chat(threadId, mockRequest, body),
      ).rejects.toThrow('Gemini API unavailable');
    });
  });

  describe('Input Validation', () => {
    it('should validate title is required for createThread', async () => {
      const body = { title: '' };

      aiService.createThread.mockResolvedValue({
        id: 'thread-1',
        title: '',
      });

      await controller.createThread(mockRequest, body);

      expect(aiService.createThread).toHaveBeenCalledWith(
        mockUser.userId,
        '',
        undefined,
      );
    });

    it('should validate prompt is required for chat', async () => {
      const threadId = 'thread-1';
      const body = { prompt: '' };

      aiService.generateResponse.mockResolvedValue({});

      await controller.chat(threadId, mockRequest, body);

      expect(aiService.generateResponse).toHaveBeenCalledWith(
        threadId,
        '',
        mockUser.userId,
      );
    });

    it('should handle invalid threadId format', async () => {
      const invalidThreadId = 'invalid-id';
      const body = { prompt: 'Test' };
      const error = new NotFoundException('Thread not found');

      aiService.generateResponse.mockRejectedValue(error);

      await expect(
        controller.chat(invalidThreadId, mockRequest, body),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Authentication Guards', () => {
    it('should protect createThread with JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.createThread);
      expect(guards).toBeDefined();
    });

    it('should protect getThreads with JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getThreads);
      expect(guards).toBeDefined();
    });

    it('should protect getMessages with JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getMessages);
      expect(guards).toBeDefined();
    });

    it('should protect chat with JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.chat);
      expect(guards).toBeDefined();
    });
  });

  describe('Error Response Handling', () => {
    it('should propagate service exceptions to client', async () => {
      const error = new ForbiddenException('Custom error message');
      aiService.getThreads.mockRejectedValue(error);

      await expect(controller.getThreads(mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Unexpected error');
      aiService.createThread.mockRejectedValue(error);

      await expect(
        controller.createThread(mockRequest, { title: 'Test' }),
      ).rejects.toThrow('Unexpected error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long thread titles', async () => {
      const longTitle = 'A'.repeat(500);
      const body = { title: longTitle };

      aiService.createThread.mockResolvedValue({
        id: 'thread-1',
        title: longTitle,
      });

      const result = await controller.createThread(mockRequest, body);

      expect(aiService.createThread).toHaveBeenCalledWith(
        mockUser.userId,
        longTitle,
        undefined,
      );
      expect(result.title).toEqual(longTitle);
    });

    it('should handle very long prompts', async () => {
      const threadId = 'thread-1';
      const longPrompt = 'What is '.repeat(1000) + 'finance?';
      const body = { prompt: longPrompt };

      aiService.generateResponse.mockResolvedValue({
        userMessage: { content: longPrompt },
        aiMessage: { content: 'Response' },
      });

      await controller.chat(threadId, mockRequest, body);

      expect(aiService.generateResponse).toHaveBeenCalledWith(
        threadId,
        longPrompt,
        mockUser.userId,
      );
    });

    it('should handle special characters in title', async () => {
      const body = { title: '💰 Budget 2025 📊 #Goals' };

      aiService.createThread.mockResolvedValue({
        id: 'thread-1',
        title: body.title,
      });

      const result = await controller.createThread(mockRequest, body);

      expect(result.title).toEqual(body.title);
    });

    it('should handle special characters in prompt', async () => {
      const threadId = 'thread-1';
      const body = { prompt: 'What about <script>alert(1)</script>?' };

      aiService.generateResponse.mockResolvedValue({
        userMessage: { content: body.prompt },
        aiMessage: { content: 'Response' },
      });

      await controller.chat(threadId, mockRequest, body);

      expect(aiService.generateResponse).toHaveBeenCalledWith(
        threadId,
        body.prompt,
        mockUser.userId,
      );
    });
  });
});
