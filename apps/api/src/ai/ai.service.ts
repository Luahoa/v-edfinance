import { createHash } from 'node:crypto';
import {
  type GenerativeModel,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatRole } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private readonly logger = new Logger(AiService.name);
  private readonly MONTHLY_TOKEN_BUDGET = 50000; // Example budget in tokens
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly MAX_CALLS_PER_WINDOW = 20;

  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  onModuleInit() {
    const apiKey = this.configService?.get
      ? this.configService.get<string>('GEMINI_API_KEY')
      : process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.error(
        'GEMINI_API_KEY is not defined in environment variables',
      );
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  get modelInstance(): GenerativeModel {
    return this.model;
  }

  // Rate Limiting & Token Budgeting
  private async checkUserAIUsage(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const windowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW);

    // Check Rate Limit (Requests in last minute)
    const recentCalls = await this.prisma.behaviorLog.count({
      where: {
        userId,
        eventType: 'AI_REQUEST',
        timestamp: { gte: windowStart },
      },
    });

    if (recentCalls >= this.MAX_CALLS_PER_WINDOW) {
      throw new ForbiddenException(
        'AI rate limit exceeded. Please wait a minute.',
      );
    }

    // Check Monthly Budget
    const monthlyUsage = await this.prisma.behaviorLog.findMany({
      where: {
        userId,
        eventType: 'AI_REQUEST',
        timestamp: { gte: startOfMonth },
      },
      select: { payload: true },
    });

    const totalTokensUsed = monthlyUsage.reduce((acc, log) => {
      const payload = log.payload as any;
      return acc + (payload?.tokensUsed || 0);
    }, 0);

    if (totalTokensUsed >= this.MONTHLY_TOKEN_BUDGET) {
      throw new ForbiddenException('Monthly AI token budget exceeded.');
    }

    return totalTokensUsed;
  }

  private maskPII(data: any): any {
    if (!data) return data;
    const masked = JSON.parse(JSON.stringify(data));

    const maskString = (str: string) => {
      if (typeof str !== 'string') return str;
      if (str.includes('@')) return '***@***.***'; // Mask email
      return str.length > 2 ? `${str[0]}***${str[str.length - 1]}` : '***';
    };

    // Recursive masking
    const walk = (obj: any) => {
      for (const key in obj) {
        if (
          ['email', 'displayName', 'fullName', 'phone', 'address'].includes(key)
        ) {
          obj[key] = maskString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          walk(obj[key]);
        }
      }
    };

    walk(masked);
    return masked;
  }

  // Thread & Message Management
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
    return this.prisma.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async saveMessage(
    threadId: string,
    role: ChatRole,
    content: string,
    metadata?: any,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.create({
        data: { threadId, role, content, metadata },
      });
      await tx.chatThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });
      return [msg];
    });
  }

  async getCourseAdvice(courseId: string, userId: string) {
    await this.checkUserAIUsage(userId);
    const [course, userProgress] = await Promise.all([
      this.prisma.course.findUnique({
        where: { id: courseId },
        include: { lessons: { orderBy: { order: 'asc' } } },
      }),
      this.prisma.userProgress.findMany({
        where: { userId, lesson: { courseId } },
      }),
    ]);

    const completedCount = userProgress.filter(
      (p) => p.status === 'COMPLETED',
    ).length;
    const totalLessons = course?.lessons.length || 0;
    const nextLesson = course?.lessons.find(
      (l) =>
        !userProgress.some(
          (p) => p.lessonId === l.id && p.status === 'COMPLETED',
        ),
    );

    const prompt = `
      Context: User is learning the course "${(course?.title as any)?.vi}".
      Progress: ${completedCount}/${totalLessons} lessons completed.
      Target Lesson: "${(nextLesson?.title as any)?.vi}".
      
      Task: Provide a "Nudge" and "Trigger" for the user using Hooked and Nudge theory.
      - If progress is low: Use Social Proof ("Many students started this week") or Small Win ("Just 5 minutes to finish lesson 1").
      - If progress is medium: Use Loss Aversion ("Don't lose your 3-day streak").
      - If almost done: Use Goal Gradient effect ("You are 90% there, finish now to get your certificate").
      
      Format: JSON { "nudge": string, "trigger": string, "nextStep": string }
    `;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    // Log AI usage for Advice
    const tokensUsed = Math.ceil((prompt.length + response.length) / 4);
    await this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: 'AI_SESSION_ADVICE',
        path: '/ai/advice',
        eventType: 'AI_REQUEST',
        payload: { tokensUsed, courseId } as any,
      },
    });

    try {
      // Clean JSON from markdown if needed
      const jsonStr = response.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      return {
        nudge: 'Tiếp tục hành trình chinh phục tài chính của bạn!',
        trigger: 'Bắt đầu bài học tiếp theo ngay',
        nextStep: nextLesson?.id,
      };
    }
  }

  // AI Logic
  async generateResponse(
    threadId: string,
    userPrompt: string,
    userId: string,
  ): Promise<any> {
    const responseIntent = this.classifyIntent(userPrompt);

    if (responseIntent === 'GENERAL_FAQ') {
      const cacheKey = this.generateCacheKey(userPrompt);
      const cachedResponse = await this.cacheManager.get(cacheKey);

      if (cachedResponse) {
        this.logger.log(
          `Cache hit (FAQ) for prompt: ${userPrompt.substring(0, 30)}...`,
        );
        await this.saveMessage(threadId, ChatRole.USER, userPrompt);
        const [aiMsg] = await this.saveMessage(
          threadId,
          ChatRole.ASSISTANT,
          (cachedResponse as any).cleanText,
          (cachedResponse as any).metadata,
        );
        return aiMsg;
      }
    }

    await this.checkUserAIUsage(userId);

    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      include: { messages: { take: 15, orderBy: { createdAt: 'desc' } } },
    });

    if (!thread) throw new NotFoundException('Thread not found');

    // Context Window Optimization
    let summaryContext = '';
    if (thread.messages.length >= 12) {
      summaryContext = await this.summarizeHistory(thread.messages);
    }

    const [user, behaviors, courses] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          investmentProfile: true,
          progress: { take: 5, orderBy: { updatedAt: 'desc' } },
        },
      }),
      this.prisma.behaviorLog.findMany({
        where: { userId },
        take: 10,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.course.findMany({ take: 3 }),
    ]);

    // Mask PII before sending to AI
    const maskedUser = this.maskPII({
      displayName: (user?.metadata as any)?.displayName || 'Student',
      investmentProfile: user?.investmentProfile,
    });

    const systemInstruction = `
    You are an expert Financial Mentor and a dedicated Teacher at V-EdFinance. 
    Mission: Transform users into financially literate individuals using HOOKED and NUDGE theory.
    
    ${summaryContext ? `PREVIOUS CONVERSATION SUMMARY: ${summaryContext}` : ''}
    
    CONTEXT:
    - User: ${maskedUser.displayName}
    - Profile: ${JSON.stringify(maskedUser.investmentProfile || 'Beginner')}
    - Recent Behaviors: ${JSON.stringify(behaviors.map((b) => b.eventType))}
    - Learning Progress: ${JSON.stringify(user?.progress || 'No progress yet')}
    - Available Courses: ${JSON.stringify(courses.map((c) => ({ id: c.id, title: (c.title as any)?.vi })))}
    `;

    const chatHistory = thread.messages
      .slice(0, 8)
      .reverse()
      .map((m) => ({
        role: m.role === ChatRole.USER ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const chat = this.model.startChat({
      history: chatHistory,
      systemInstruction,
    });

    const result = await chat.sendMessage(userPrompt);
    const responseText = result.response.text();

    // Estimate tokens (simplified: 1 token ~ 4 chars)
    const tokensUsed = Math.ceil(
      (systemInstruction.length + userPrompt.length + responseText.length) / 4,
    );

    // Log AI Request for budget/rate limit tracking
    await this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: 'AI_SESSION',
        path: '/ai/chat',
        eventType: 'AI_REQUEST',
        payload: { tokensUsed, threadId } as any,
      },
    });

    const { cleanText, metadata } = this.parseActionCards(responseText);

    // Cache the response if it's a general question
    const finalCacheKey = this.generateCacheKey(userPrompt);
    const finalIntent = this.classifyIntent(userPrompt);
    if (finalIntent === 'GENERAL_FAQ') {
      await this.cacheManager.set(
        finalCacheKey,
        { cleanText, metadata },
        3600 * 24,
      ); // 24h cache
    }

    await this.saveMessage(threadId, ChatRole.USER, userPrompt);
    const [savedAiMessage] = await this.saveMessage(
      threadId,
      ChatRole.ASSISTANT,
      cleanText,
      metadata,
    );

    return savedAiMessage;
  }

  private async summarizeHistory(messages: any[]): Promise<string> {
    const historyText = messages
      .reverse()
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');
    const prompt = `Summarize the following financial mentoring conversation briefly. Focus on the user's goals, questions asked, and progress made. Keep it under 150 words: \n\n${historyText}`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      console.error('Summarization failed', e);
      return '';
    }
  }

  private parseActionCards(text: string) {
    const cardRegex = /\[ACTION_CARD\]([\s\S]*?)\[\/ACTION_CARD\]/;
    const match = text.match(cardRegex);

    const cleanText = text.replace(cardRegex, '').trim();
    let metadata: any = { type: 'TEXT' };

    if (match?.[1]) {
      try {
        const cardData = JSON.parse(match[1].trim());
        metadata = { ...cardData, hasActionCard: true };
      } catch (e) {
        console.error('Failed to parse action card JSON', e);
      }
    }

    return { cleanText, metadata };
  }

  private generateCacheKey(prompt: string): string {
    const hash = createHash('sha256')
      .update(prompt.toLowerCase().trim())
      .digest('hex');
    return `ai_response:${hash}`;
  }

  private classifyIntent(
    prompt: string,
  ): 'GENERAL_FAQ' | 'PERSONALIZED_ADVICE' {
    const faqKeywords = [
      'là gì',
      'định nghĩa',
      'how to',
      'cách làm',
      'v-edfinance',
      'tại sao',
      'what is',
    ];
    const isFAQ = faqKeywords.some((k) => prompt.toLowerCase().includes(k));
    return isFAQ ? 'GENERAL_FAQ' : 'PERSONALIZED_ADVICE';
  }
}
