import { Injectable, Logger } from '@nestjs/common';
import { ChatRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  async createThread(userId: string, title: string, module?: string) {
    return this.prisma.chatThread.create({
      data: { userId, title, module },
    });
  }

  async getThreads(userId: string) {
    return this.prisma.chatThread.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(threadId: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map((m) => ({
      ...m,
      content: this.maskPII(m.content),
    }));
  }

  async saveMessage(
    threadId: string,
    role: ChatRole,
    content: string,
    metadata?: any,
  ) {
    const maskedContent = this.maskPII(content);
    return this.prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.create({
        data: { threadId, role, content: maskedContent, metadata },
      });
      await tx.chatThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });
      return msg;
    });
  }

  async createGroupChat(userId: string, name: string, description?: string) {
    return this.prisma.buddyGroup.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId,
            role: 'LEADER',
          },
        },
      },
      include: {
        members: true,
      },
    });
  }

  maskPII(content: string): string {
    if (!content) return content;
    // Simple masking for emails and names (mock logic for requirement)
    return content
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***')
      .replace(
        /\b(name|address)\s+\w+/gi,
        (match) => match.split(/\s+/)[0] + ': ***',
      );
  }
}
