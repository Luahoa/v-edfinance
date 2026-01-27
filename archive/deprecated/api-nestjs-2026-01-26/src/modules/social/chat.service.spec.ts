import { Test, TestingModule } from '@nestjs/testing';
import { ChatRole } from '@prisma/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: PrismaService;

  const mockPrisma = {
    chatThread: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    chatMessage: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    buddyGroup: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get<PrismaService>(PrismaService);

    // Manual binding for NestJS DI mock
    (service as any).prisma = mockPrisma;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('message persistence', () => {
    it('should save a message and update thread timestamp', async () => {
      const threadId = 'thread-1';
      const content = 'Hello world';
      const role = ChatRole.USER;
      const mockMsg = { id: 'msg-1', threadId, content, role };

      mockPrisma.chatMessage.create.mockResolvedValue(mockMsg);
      mockPrisma.chatThread.update.mockResolvedValue({});

      const result = await service.saveMessage(threadId, role, content);

      expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ threadId, content, role }),
      });
      expect(mockPrisma.chatThread.update).toHaveBeenCalledWith({
        where: { id: threadId },
        data: expect.objectContaining({ updatedAt: expect.any(Date) }),
      });
      expect(result).toEqual(mockMsg);
    });
  });

  describe('chat history retrieval', () => {
    it('should retrieve messages for a thread', async () => {
      const threadId = 'thread-1';
      const mockMessages = [
        { id: '1', content: 'Hi', role: ChatRole.USER },
        { id: '2', content: 'Hello', role: ChatRole.ASSISTANT },
      ];
      mockPrisma.chatMessage.findMany.mockResolvedValue(mockMessages);

      const result = await service.getMessages(threadId);

      expect(mockPrisma.chatMessage.findMany).toHaveBeenCalledWith({
        where: { threadId },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty list if no messages found', async () => {
      mockPrisma.chatMessage.findMany.mockResolvedValue([]);
      const result = await service.getMessages('empty');
      expect(result).toEqual([]);
    });
  });

  describe('group chat creation', () => {
    it('should create a new group with the creator as leader', async () => {
      const userId = 'user-1';
      const name = 'Investment Group';
      const mockGroup = {
        id: 'group-1',
        name,
        members: [{ userId, role: 'LEADER' }],
      };

      mockPrisma.buddyGroup.create.mockResolvedValue(mockGroup);

      const result = await service.createGroupChat(userId, name);

      expect(mockPrisma.buddyGroup.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name,
          members: {
            create: { userId, role: 'LEADER' },
          },
        }),
        include: { members: true },
      });
      expect(result).toEqual(mockGroup);
    });
  });

  describe('message encryption/masking', () => {
    it('should mask emails in content', () => {
      const content = 'Contact me at test@example.com';
      const masked = service.maskPII(content);
      expect(masked).toBe('Contact me at ***@***.***');
    });

    it('should mask names and addresses', () => {
      const content = 'My name is John and address is 123 Street';
      const masked = service.maskPII(content);
      expect(masked).toContain('name: ***');
      expect(masked).toContain('address: ***');
    });

    it('should mask content before saving', async () => {
      const content = 'Email me at admin@v-edfinance.com';
      mockPrisma.chatMessage.create.mockImplementation(({ data }) =>
        Promise.resolve({ ...data, id: '1' }),
      );

      await service.saveMessage('thread-1', ChatRole.USER, content);

      expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          content: 'Email me at ***@***.***',
        }),
      });
    });

    it('should mask content when retrieving history', async () => {
      mockPrisma.chatMessage.findMany.mockResolvedValue([
        { id: '1', content: 'Secret: admin@test.com', role: ChatRole.USER },
      ]);

      const result = await service.getMessages('thread-1');

      expect(result[0].content).toBe('Secret: ***@***.***');
    });
  });

  describe('thread management', () => {
    it('should create a thread', async () => {
      const userId = 'u1';
      const title = 'Help';
      mockPrisma.chatThread.create.mockResolvedValue({
        id: 't1',
        userId,
        title,
      });

      const result = await service.createThread(userId, title);

      expect(mockPrisma.chatThread.create).toHaveBeenCalledWith({
        data: { userId, title, module: undefined },
      });
      expect(result.id).toBe('t1');
    });

    it('should get user threads', async () => {
      mockPrisma.chatThread.findMany.mockResolvedValue([{ id: 't1' }]);
      const result = await service.getThreads('u1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.chatThread.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });
});
