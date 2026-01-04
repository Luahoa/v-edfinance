import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

export interface DocumentInsight {
  summary: string;
  keyTerms: Array<{ term: string; explanation: string }>;
  suggestedLessons: string[];
  riskFlags: string[];
  spendingBreakdown?: {
    category: string;
    percentage: number;
    amount: number;
  }[];
}

@Injectable()
export class DocumentAnalyzerService {
  private readonly logger = new Logger(DocumentAnalyzerService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeDocument(
    documentText: string,
    documentType: 'bank_statement' | 'invoice' | 'contract' | 'report',
  ): Promise<DocumentInsight> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
      });

      const prompt = this.buildPrompt(documentText, documentType);
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Parse AI response
      return this.parseResponse(text);
    } catch (error) {
      this.logger.error(
        `Document analysis error: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to analyze document');
    }
  }

  private buildPrompt(text: string, type: string): string {
    const prompts: Record<string, string> = {
      bank_statement: `Phân tích sao kê ngân hàng sau đây và trả về JSON:

${text}

Yêu cầu:
1. Tóm tắt tình hình tài chính (summary)
2. Giải thích các thuật ngữ tài chính (keyTerms: [{"term": "...", "explanation": "..."}])
3. Gợi ý khóa học phù hợp (suggestedLessons: ["..."])
4. Cảnh báo rủi ro nếu có (riskFlags: ["..."])
5. Phân tích chi tiêu theo danh mục (spendingBreakdown: [{"category": "...", "percentage": 0, "amount": 0}])

Trả về JSON thuần, không có markdown.`,

      invoice: `Phân tích hóa đơn tài chính và đưa ra nhận xét về chi phí, điều khoản thanh toán.`,
      contract: `Phân tích hợp đồng tài chính, chỉ ra các điều khoản quan trọng và rủi ro tiềm ẩn.`,
      report: `Phân tích báo cáo tài chính, đưa ra thống kê và xu hướng.`,
    };

    return prompts[type] || prompts.bank_statement;
  }

  private parseResponse(text: string): DocumentInsight {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch {
      // Fallback if parsing fails
      return {
        summary: text.substring(0, 200),
        keyTerms: [],
        suggestedLessons: [],
        riskFlags: [],
      };
    }
  }
}
