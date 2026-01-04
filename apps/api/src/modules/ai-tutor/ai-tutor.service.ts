import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  userId: string;
  locale: 'vi' | 'en' | 'zh';
  history?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  creditsRemaining: number;
}

@Injectable()
export class AiTutorService {
  private readonly logger = new Logger(AiTutorService.name);
  private genAI: GoogleGenerativeAI;
  private readonly dailyLimit = 10; // Free tier: 10 questions/day

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private getSystemPrompt(locale: 'vi' | 'en' | 'zh'): string {
    const prompts = {
      vi: `Bạn là trợ lý AI chuyên về tài chính cá nhân cho học viên Việt Nam.
      - Giải thích khái niệm đơn giản, dễ hiểu
      - Dùng ví dụ thực tế với đồng Việt Nam (₫)
      - Khuyến khích học viên tự khám phá (theo mô hình Hooked)
      - Tạo sự tò mò bằng câu hỏi ngược
      - Giới hạn mỗi câu trả lời 200 từ`,

      en: `You are a financial literacy AI tutor for Vietnamese students.
      - Explain concepts simply and clearly
      - Use real-world examples with Vietnamese Dong (₫)
      - Encourage self-discovery (Hooked model)
      - Create curiosity with reverse questions
      - Limit responses to 200 words`,

      zh: `你是越南学生的个人理财AI导师。
      - 简单清晰地解释概念
      - 使用越南盾(₫)的实际例子
      - 鼓励自我探索(Hooked模型)
      - 通过反问创造好奇心
      - 每次回答限制在200字以内`,
    };
    return prompts[locale];
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Check daily limit (simplified - should use Redis/DB)
      const creditsRemaining = await this.checkCredits(request.userId);
      if (creditsRemaining <= 0) {
        throw new BadRequestException(
          'Daily limit reached. Upgrade to premium for unlimited questions.',
        );
      }

      // Initialize model
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        systemInstruction: this.getSystemPrompt(request.locale),
      });

      // Build chat history
      const history = (request.history || []).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      // Start chat with history
      const chat = model.startChat({ history });

      // Send message
      const result = await chat.sendMessage(request.message);
      const reply = result.response.text();

      // Decrement credits
      await this.decrementCredits(request.userId);

      return {
        reply,
        creditsRemaining: creditsRemaining - 1,
      };
    } catch (error) {
      this.logger.error(`AI Tutor error: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to process chat request');
    }
  }

  private async checkCredits(userId: string): Promise<number> {
    // TODO: Implement with Redis or BehaviorLog
    // For now, return daily limit
    return this.dailyLimit;
  }

  private async decrementCredits(userId: string): Promise<void> {
    // TODO: Implement credit tracking
    this.logger.debug(`Credits decremented for user ${userId}`);
  }
}
