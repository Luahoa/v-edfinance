import { Injectable, Logger } from '@nestjs/common';
import { DynamicConfigService } from '../config/dynamic-config.service';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  constructor(private configService: DynamicConfigService) {}

  async generateResponse(prompt: any) {
    const apiKey = this.configService?.get
      ? this.configService.get('GEMINI_API_KEY')
      : process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set in DynamicConfig');
      return {
        text: 'AI Mentoring is currently unavailable. Please check back later.',
        locale: prompt.context?.locale || 'en',
      };
    }

    // Since I cannot install @google/generative-ai here,
    // I will implement a fetch-based call to the Gemini API
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: this.buildSystemPrompt(prompt),
                  },
                ],
              },
            ],
          }),
        },
      );

      const data = await response.json();
      return {
        text:
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          'No response from AI',
        locale: prompt.context?.locale || 'en',
      };
    } catch (error) {
      this.logger.error('Error calling Gemini API', error);
      throw error;
    }
  }

  private buildSystemPrompt(prompt: any): string {
    const { context, user_profile, mentor_config } = prompt;

    // Dynamic Persona Logic based on Improvement #1
    const personaMap: Record<string, string> = {
      WISE_SAGE:
        'a wise and calm financial sage who uses metaphors about seasons and nature.',
      STRICT_COACH:
        'a tough-love financial coach who is direct, uses sports metaphors, and focuses on discipline.',
      SUPPORTIVE_BUDDY:
        'a friendly and encouraging peer who uses casual language and focuses on small wins.',
    };

    const selectedPersona =
      (mentor_config?.persona && personaMap[mentor_config.persona]) ||
      'a witty and expert financial mentor';
    const groupContext =
      mentor_config?.group_streak > 5
        ? `Your user is in a high-performing Buddy Group with a ${mentor_config.group_streak}-day streak! Use this as social proof to push them harder.`
        : 'Focus on building consistent habits.';

    return `
      You are "Lúa", ${selectedPersona} for Lúa Hóa Edtech (V-EdFinance).
      ${groupContext}
      Your goal is to simplify complex financial concepts into easy-to-understand metaphors.
      
      User Profile:
      - Knowledge Level: ${user_profile.knowledge_level}
      - Risk Appetite: ${user_profile.risk_score}/10
      - Persona Style: ${mentor_config?.persona}
      - Preferred Language: ${context.locale}
      
      Context:
      - Current Module: ${context.module}
      - Current Lesson: ${context.lesson}
      ${context.behavior_prediction ? `- Behavioral Prediction: ${context.behavior_prediction}` : ''}
      
      Instructions:
      1. Always respond in ${context.locale}.
      2. If the user is a Beginner, use analogies related to farming or daily life (Lúa Hóa style).
      3. Be encouraging but honest about financial risks.
      4. If the Behavioral Prediction is negative (e.g., predicted churn), use Loss Aversion tactics.
      5. Keep the response concise (under 200 words).
      
      User Question: ${context.user_query}
    `;
  }
}
