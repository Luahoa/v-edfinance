import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

interface SimulationParams {
  startingBudget: number;
  riskTolerance: 'low' | 'medium' | 'high';
  duration: '1month' | '6months' | '1year';
  scenario?: string;
}

export interface SimulationResult {
  scenarioTitle: string;
  description: string;
  initialBudget: number;
  finalBudget: number;
  returnPercentage: number;
  decisions: Array<{
    week: number;
    event: string;
    decision: string;
    impact: number;
  }>;
  lessons: string[];
  leaderboardScore: number;
}

@Injectable()
export class MarketSimulatorService {
  private readonly logger = new Logger(MarketSimulatorService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async runSimulation(params: SimulationParams): Promise<SimulationResult> {
    try {
      const scenario = await this.generateScenario(params);
      const decisions = this.simulateDecisions(params);
      const finalBudget = this.calculateOutcome(
        params.startingBudget,
        decisions,
      );

      return {
        scenarioTitle: scenario.title,
        description: scenario.description,
        initialBudget: params.startingBudget,
        finalBudget,
        returnPercentage:
          ((finalBudget - params.startingBudget) / params.startingBudget) * 100,
        decisions,
        lessons: scenario.lessons,
        leaderboardScore: this.calculateScore(
          finalBudget,
          params.startingBudget,
        ),
      };
    } catch (error) {
      this.logger.error(`Simulation error: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateScenario(params: SimulationParams): Promise<any> {
    if (!this.genAI) {
      // Fallback scenarios if Gemini not available
      return this.getFallbackScenario(params.riskTolerance);
    }

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });

    const prompt = `Tạo một kịch bản mô phỏng thị trường tài chính Việt Nam cho người học.
    
Thông số:
- Ngân sách ban đầu: ${params.startingBudget.toLocaleString('vi-VN')} VND
- Mức độ rủi ro: ${params.riskTolerance}
- Thời gian: ${params.duration}

Yêu cầu:
1. Tạo tiêu đề kịch bản hấp dẫn
2. Mô tả tình huống thực tế (VD: thị trường sụt giảm 10%, cơ hội đầu tư mới xuất hiện)
3. Đưa ra 3 bài học quan trọng

Trả về JSON với format:
{
  "title": "...",
  "description": "...",
  "lessons": ["...", "...", "..."]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch {
      return this.getFallbackScenario(params.riskTolerance);
    }
  }

  private getFallbackScenario(riskTolerance: string): any {
    const scenarios: Record<string, any> = {
      low: {
        title: 'Khủng hoảng Kinh tế 2026',
        description:
          'Thị trường sụt giảm 15%. Bạn cần quyết định bán tài sản hay giữ nguyên.',
        lessons: [
          'Không hoảng loạn khi thị trường giảm',
          'Đa dạng hóa danh mục đầu tư',
          'Có quỹ dự phòng khẩn cấp',
        ],
      },
      medium: {
        title: 'Cơ hội Vàng 2026',
        description:
          'Một cổ phiếu công nghệ mới IPO. Có nên đầu tư 30% tài sản?',
        lessons: [
          'Nghiên cứu kỹ trước khi đầu tư',
          'Không bỏ tất cả trứng vào một giỏ',
          'Kiểm soát cảm xúc khi quyết định',
        ],
      },
      high: {
        title: 'Chiến lược Mạo hiểm',
        description: 'Crypto tăng 200% trong 3 tháng. Tham gia hay quan sát?',
        lessons: [
          'Hiểu rõ rủi ro trước khi tham gia',
          'Chỉ đầu tư số tiền có thể mất',
          'Lợi nhuận cao = rủi ro cao',
        ],
      },
    };

    return scenarios[riskTolerance] || scenarios.medium;
  }

  private simulateDecisions(params: SimulationParams): Array<any> {
    const weeks = this.getDurationInWeeks(params.duration);
    const decisions = [];

    for (let week = 1; week <= Math.min(weeks, 12); week += 2) {
      const event = this.generateRandomEvent(params.riskTolerance);
      const decision = this.makeDecision(event, params.riskTolerance);
      const impact = this.calculateImpact(decision, params.riskTolerance);

      decisions.push({ week, event, decision, impact });
    }

    return decisions;
  }

  private getDurationInWeeks(duration: string): number {
    const map: Record<string, number> = {
      '1month': 4,
      '6months': 24,
      '1year': 52,
    };
    return map[duration] || 4;
  }

  private generateRandomEvent(riskTolerance: string): string {
    const events = [
      'Thị trường tăng 5%',
      'Lạm phát tăng cao',
      'Cơ hội đầu tư mới xuất hiện',
      'Thị trường giảm 10%',
      'Lãi suất ngân hàng tăng',
    ];
    return events[Math.floor(Math.random() * events.length)];
  }

  private makeDecision(event: string, riskTolerance: string): string {
    const decisions = ['Giữ nguyên', 'Mua thêm', 'Bán một phần', 'Chuyển đổi'];
    return decisions[Math.floor(Math.random() * decisions.length)];
  }

  private calculateImpact(decision: string, riskTolerance: string): number {
    const baseImpact = Math.random() * 20 - 10; // -10% to +10%
    const riskMultiplier: Record<string, number> = {
      low: 0.5,
      medium: 1,
      high: 2,
    };
    return baseImpact * (riskMultiplier[riskTolerance] || 1);
  }

  private calculateOutcome(initial: number, decisions: Array<any>): number {
    return decisions.reduce((budget, decision) => {
      return budget * (1 + decision.impact / 100);
    }, initial);
  }

  private calculateScore(final: number, initial: number): number {
    const returnPct = ((final - initial) / initial) * 100;
    return Math.max(0, Math.round(1000 + returnPct * 100));
  }
}
