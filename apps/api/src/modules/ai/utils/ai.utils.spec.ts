import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHash } from 'node:crypto';

/**
 * AI Utility Functions - Extracted from ai.service.ts for unit testing
 */

// Tokenization Helper
export function estimateTokens(text: string): number {
  // Simple estimation: 1 token ~ 4 characters
  return Math.ceil(text.length / 4);
}

export function estimateMultipartTokens(parts: string[]): number {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  return Math.ceil(totalLength / 4);
}

export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars - 3) + '...';
}

// PII Masking Helper
export function maskPII(data: any): any {
  if (!data) return data;
  const masked = JSON.parse(JSON.stringify(data));

  const maskString = (str: string) => {
    if (typeof str !== 'string') return str;
    if (str.includes('@')) return '***@***.***'; // Mask email
    return str.length > 2 ? `${str[0]}***${str[str.length - 1]}` : '***';
  };

  const walk = (obj: any) => {
    for (const key in obj) {
      if (
        ['email', 'displayName', 'fullName', 'phone', 'address'].includes(key)
      ) {
        obj[key] = maskString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        walk(obj[key]);
      }
    }
  };

  walk(masked);
  return masked;
}

// Prompt Template Builders
export function buildCourseAdvicePrompt(params: {
  courseTitle: string;
  completedCount: number;
  totalLessons: number;
  nextLessonTitle: string;
}): string {
  const { courseTitle, completedCount, totalLessons, nextLessonTitle } = params;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  let strategy = '';
  if (progressPercent < 30) {
    strategy =
      'Use Social Proof ("Many students started this week") or Small Win ("Just 5 minutes to finish lesson 1").';
  } else if (progressPercent < 80) {
    strategy = 'Use Loss Aversion ("Don\'t lose your 3-day streak").';
  } else {
    strategy = `Use Goal Gradient effect ("You are ${progressPercent}% there, finish now to get your certificate").`;
  }

  return `
    Context: User is learning the course "${courseTitle}".
    Progress: ${completedCount}/${totalLessons} lessons completed.
    Target Lesson: "${nextLessonTitle}".
    
    Task: Provide a "Nudge" and "Trigger" for the user using Hooked and Nudge theory.
    - ${strategy}
    
    Format: JSON { "nudge": string, "trigger": string, "nextStep": string }
  `.trim();
}

export function buildPersonaPrompt(params: {
  persona: 'WISE_SAGE' | 'STRICT_COACH' | 'SUPPORTIVE_BUDDY';
  userKnowledgeLevel: string;
  riskScore: number;
  locale: string;
  module: string;
  lesson: string;
  userQuery: string;
  groupStreak?: number;
}): string {
  const personaMap: Record<string, string> = {
    WISE_SAGE:
      'a wise and calm financial sage who uses metaphors about seasons and nature.',
    STRICT_COACH:
      'a tough-love financial coach who is direct, uses sports metaphors, and focuses on discipline.',
    SUPPORTIVE_BUDDY:
      'a friendly and encouraging peer who uses casual language and focuses on small wins.',
  };

  const selectedPersona =
    personaMap[params.persona] || 'a witty and expert financial mentor';
  const groupContext =
    params.groupStreak && params.groupStreak > 5
      ? `Your user is in a high-performing Buddy Group with a ${params.groupStreak}-day streak! Use this as social proof to push them harder.`
      : 'Focus on building consistent habits.';

  return `
    You are "Lúa", ${selectedPersona} for Lúa Hóa Edtech (V-EdFinance).
    ${groupContext}
    Your goal is to simplify complex financial concepts into easy-to-understand metaphors.
    
    User Profile:
    - Knowledge Level: ${params.userKnowledgeLevel}
    - Risk Appetite: ${params.riskScore}/10
    - Persona Style: ${params.persona}
    - Preferred Language: ${params.locale}
    
    Context:
    - Current Module: ${params.module}
    - Current Lesson: ${params.lesson}
    
    Instructions:
    1. Always respond in ${params.locale}.
    2. If the user is a Beginner, use analogies related to farming or daily life (Lúa Hóa style).
    3. Be encouraging but honest about financial risks.
    4. Keep the response concise (under 200 words).
    
    User Question: ${params.userQuery}
  `.trim();
}

export function buildSystemInstruction(params: {
  displayName: string;
  investmentProfile?: any;
  recentBehaviors: string[];
  userProgress?: any;
  availableCourses: Array<{ id: string; title: string }>;
  summaryContext?: string;
}): string {
  const {
    displayName,
    investmentProfile,
    recentBehaviors,
    userProgress,
    availableCourses,
    summaryContext,
  } = params;

  return `
    You are an expert Financial Mentor and a dedicated Teacher at V-EdFinance. 
    Mission: Transform users into financially literate individuals using HOOKED and NUDGE theory.
    
    ${summaryContext ? `PREVIOUS CONVERSATION SUMMARY: ${summaryContext}` : ''}
    
    CONTEXT:
    - User: ${displayName}
    - Profile: ${JSON.stringify(investmentProfile || 'Beginner')}
    - Recent Behaviors: ${JSON.stringify(recentBehaviors)}
    - Learning Progress: ${JSON.stringify(userProgress || 'No progress yet')}
    - Available Courses: ${JSON.stringify(availableCourses)}
  `.trim();
}

// Response Parsing Utilities
export function parseActionCards(text: string): {
  cleanText: string;
  metadata: any;
} {
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

export function extractJSONFromMarkdown(response: string): any {
  const jsonStr = response.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Invalid JSON format in response');
  }
}

export function parseCourseAdviceResponse(
  response: string,
  fallbackLessonId?: string,
): any {
  try {
    const parsed = extractJSONFromMarkdown(response);
    if (parsed.nudge && parsed.trigger) {
      return parsed;
    }
    throw new Error('Missing required fields');
  } catch (e) {
    return {
      nudge: 'Tiếp tục hành trình chinh phục tài chính của bạn!',
      trigger: 'Bắt đầu bài học tiếp theo ngay',
      nextStep: fallbackLessonId,
    };
  }
}

// Cache Key Generation
export function generateCacheKey(prompt: string): string {
  const hash = createHash('sha256')
    .update(prompt.toLowerCase().trim())
    .digest('hex');
  return `ai_response:${hash}`;
}

// Intent Classification
export function classifyIntent(
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

// Error Handling Helpers
export function createFallbackResponse(locale: string = 'vi'): string {
  const fallbacks = {
    vi: 'Xin lỗi, AI đang bận. Vui lòng thử lại sau.',
    en: 'Sorry, AI is currently unavailable. Please try again later.',
    zh: '抱歉，AI目前不可用。请稍后再试。',
  };
  return fallbacks[locale as keyof typeof fallbacks] || fallbacks.en;
}

export function handleAIError(error: any, context?: string): Error {
  const message = context
    ? `AI Error in ${context}: ${error.message}`
    : `AI Error: ${error.message}`;
  console.error(message, error);
  return new Error(message);
}

export function validateTokenBudget(
  tokensUsed: number,
  budget: number,
): { allowed: boolean; remaining: number } {
  return {
    allowed: tokensUsed < budget,
    remaining: Math.max(0, budget - tokensUsed),
  };
}

/**
 * TEST SUITE
 */

describe('AI Utility Functions', () => {
  describe('Tokenization Helpers', () => {
    it('should estimate tokens correctly (1 token ~ 4 chars)', () => {
      expect(estimateTokens('Hello')).toBe(2); // 5 chars / 4 = 1.25 -> 2
      expect(estimateTokens('This is a test')).toBe(4); // 14 chars / 4 = 3.5 -> 4
      expect(estimateTokens('')).toBe(0);
    });

    it('should estimate multipart tokens', () => {
      const parts = ['Hello', 'world', 'test'];
      expect(estimateMultipartTokens(parts)).toBe(4); // 15 chars / 4 = 3.75 -> 4
    });

    it('should handle empty array in multipart estimation', () => {
      expect(estimateMultipartTokens([])).toBe(0);
    });

    it('should truncate text to token budget', () => {
      const longText = 'A'.repeat(100);
      const truncated = truncateToTokenBudget(longText, 10); // 10 tokens = 40 chars
      expect(truncated.length).toBeLessThanOrEqual(40);
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('should not truncate if within budget', () => {
      const shortText = 'Hello';
      expect(truncateToTokenBudget(shortText, 10)).toBe(shortText);
    });

    it('should validate token budget', () => {
      expect(validateTokenBudget(100, 200)).toEqual({
        allowed: true,
        remaining: 100,
      });
      expect(validateTokenBudget(250, 200)).toEqual({
        allowed: false,
        remaining: 0,
      });
    });
  });

  describe('PII Masking Helpers', () => {
    it('should mask email addresses', () => {
      const data = { email: 'user@example.com' };
      const masked = maskPII(data);
      expect(masked.email).toBe('***@***.***');
    });

    it('should mask displayName', () => {
      const data = { displayName: 'John Doe' };
      const masked = maskPII(data);
      expect(masked.displayName).toBe('J***e');
    });

    it('should mask phone numbers', () => {
      const data = { phone: '123456789' };
      const masked = maskPII(data);
      expect(masked.phone).toBe('1***9');
    });

    it('should handle short strings', () => {
      const data = { displayName: 'AB' };
      const masked = maskPII(data);
      expect(masked.displayName).toBe('***');
    });

    it('should recursively mask nested objects', () => {
      const data = {
        user: {
          email: 'test@test.com',
          profile: { displayName: 'Alice' },
        },
      };
      const masked = maskPII(data);
      expect(masked.user.email).toBe('***@***.***');
      expect(masked.user.profile.displayName).toBe('A***e');
    });

    it('should handle null and undefined', () => {
      expect(maskPII(null)).toBe(null);
      expect(maskPII(undefined)).toBe(undefined);
    });

    it('should not mask non-PII fields', () => {
      const data = { score: 100, name: 'Test' };
      const masked = maskPII(data);
      expect(masked.score).toBe(100);
      expect(masked.name).toBe('Test');
    });
  });

  describe('Prompt Template Builders', () => {
    it('should build course advice prompt for low progress', () => {
      const prompt = buildCourseAdvicePrompt({
        courseTitle: 'Tài chính cơ bản',
        completedCount: 2,
        totalLessons: 10,
        nextLessonTitle: 'Bài 3: Lãi suất',
      });

      expect(prompt).toContain('2/10 lessons completed');
      expect(prompt).toContain('Social Proof');
      expect(prompt).toContain('Small Win');
    });

    it('should build course advice prompt for medium progress', () => {
      const prompt = buildCourseAdvicePrompt({
        courseTitle: 'Investment 101',
        completedCount: 5,
        totalLessons: 10,
        nextLessonTitle: 'Stocks',
      });

      expect(prompt).toContain('5/10 lessons completed');
      expect(prompt).toContain('Loss Aversion');
    });

    it('should build course advice prompt for high progress', () => {
      const prompt = buildCourseAdvicePrompt({
        courseTitle: 'Advanced Trading',
        completedCount: 9,
        totalLessons: 10,
        nextLessonTitle: 'Final Quiz',
      });

      expect(prompt).toContain('9/10 lessons completed');
      expect(prompt).toContain('Goal Gradient');
      expect(prompt).toContain('90%');
    });

    it('should build persona prompt for WISE_SAGE', () => {
      const prompt = buildPersonaPrompt({
        persona: 'WISE_SAGE',
        userKnowledgeLevel: 'Beginner',
        riskScore: 3,
        locale: 'vi',
        module: 'Finance Basics',
        lesson: 'Interest Rates',
        userQuery: 'What is compound interest?',
      });

      expect(prompt).toContain('wise and calm financial sage');
      expect(prompt).toContain('Beginner');
      expect(prompt).toContain('3/10');
    });

    it('should build persona prompt for STRICT_COACH', () => {
      const prompt = buildPersonaPrompt({
        persona: 'STRICT_COACH',
        userKnowledgeLevel: 'Intermediate',
        riskScore: 7,
        locale: 'en',
        module: 'Trading',
        lesson: 'Risk Management',
        userQuery: 'How to manage portfolio risk?',
      });

      expect(prompt).toContain('tough-love financial coach');
      expect(prompt).toContain('sports metaphors');
    });

    it('should include group streak context when high', () => {
      const prompt = buildPersonaPrompt({
        persona: 'SUPPORTIVE_BUDDY',
        userKnowledgeLevel: 'Advanced',
        riskScore: 8,
        locale: 'zh',
        module: 'Options',
        lesson: 'Spreads',
        userQuery: 'Explain credit spreads',
        groupStreak: 10,
      });

      expect(prompt).toContain('10-day streak');
      expect(prompt).toContain('high-performing Buddy Group');
    });

    it('should build system instruction with all context', () => {
      const instruction = buildSystemInstruction({
        displayName: 'John',
        investmentProfile: { riskTolerance: 'Medium' },
        recentBehaviors: ['LOGIN', 'LESSON_COMPLETE'],
        userProgress: { completedLessons: 5 },
        availableCourses: [{ id: 'c1', title: 'Course 1' }],
        summaryContext: 'Previously discussed stocks',
      });

      expect(instruction).toContain('John');
      expect(instruction).toContain('Medium');
      expect(instruction).toContain('Previously discussed stocks');
      expect(instruction).toContain('HOOKED and NUDGE theory');
    });
  });

  describe('Response Parsing Utilities', () => {
    it('should parse action cards from response', () => {
      const response =
        'Here is your advice. [ACTION_CARD]{"type":"LINK","url":"https://test.com"}[/ACTION_CARD] Continue learning!';
      const { cleanText, metadata } = parseActionCards(response);

      expect(cleanText).toBe('Here is your advice.  Continue learning!');
      expect(metadata.type).toBe('LINK');
      expect(metadata.url).toBe('https://test.com');
      expect(metadata.hasActionCard).toBe(true);
    });

    it('should handle response without action cards', () => {
      const response = 'Simple text response';
      const { cleanText, metadata } = parseActionCards(response);

      expect(cleanText).toBe(response);
      expect(metadata.type).toBe('TEXT');
      expect(metadata.hasActionCard).toBeUndefined();
    });

    it('should handle malformed action card JSON', () => {
      const response = '[ACTION_CARD]invalid json[/ACTION_CARD]';
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { cleanText, metadata } = parseActionCards(response);

      expect(cleanText).toBe('');
      expect(metadata.type).toBe('TEXT');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should extract JSON from markdown', () => {
      const response = '```json\n{"key": "value"}\n```';
      const result = extractJSONFromMarkdown(response);
      expect(result).toEqual({ key: 'value' });
    });

    it('should throw on invalid JSON', () => {
      const response = '```json\n{invalid}\n```';
      expect(() => extractJSONFromMarkdown(response)).toThrow(
        'Invalid JSON format',
      );
    });

    it('should parse valid course advice response', () => {
      const response =
        '```json\n{"nudge": "Keep going!", "trigger": "Start now", "nextStep": "lesson-1"}\n```';
      const result = parseCourseAdviceResponse(response);

      expect(result.nudge).toBe('Keep going!');
      expect(result.trigger).toBe('Start now');
      expect(result.nextStep).toBe('lesson-1');
    });

    it('should return fallback for invalid course advice response', () => {
      const response = '```json\n{"invalid": true}\n```';
      const result = parseCourseAdviceResponse(response, 'fallback-lesson-id');

      expect(result.nudge).toBe(
        'Tiếp tục hành trình chinh phục tài chính của bạn!',
      );
      expect(result.trigger).toBe('Bắt đầu bài học tiếp theo ngay');
      expect(result.nextStep).toBe('fallback-lesson-id');
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const prompt = 'What is compound interest?';
      const key1 = generateCacheKey(prompt);
      const key2 = generateCacheKey(prompt);
      expect(key1).toBe(key2);
    });

    it('should be case-insensitive', () => {
      const key1 = generateCacheKey('Test Prompt');
      const key2 = generateCacheKey('test prompt');
      expect(key1).toBe(key2);
    });

    it('should trim whitespace', () => {
      const key1 = generateCacheKey('  test  ');
      const key2 = generateCacheKey('test');
      expect(key1).toBe(key2);
    });

    it('should start with ai_response prefix', () => {
      const key = generateCacheKey('test');
      expect(key).toMatch(/^ai_response:/);
    });
  });

  describe('Intent Classification', () => {
    it('should classify FAQ intents (Vietnamese)', () => {
      expect(classifyIntent('Lãi suất là gì?')).toBe('GENERAL_FAQ');
      expect(classifyIntent('Định nghĩa của cổ phiếu')).toBe('GENERAL_FAQ');
      expect(classifyIntent('Tại sao tôi cần đầu tư?')).toBe('GENERAL_FAQ');
    });

    it('should classify FAQ intents (English)', () => {
      expect(classifyIntent('What is compound interest?')).toBe('GENERAL_FAQ');
      expect(classifyIntent('How to invest in stocks?')).toBe('GENERAL_FAQ');
    });

    it('should classify personalized advice intents', () => {
      expect(classifyIntent('Should I buy AAPL stock?')).toBe(
        'PERSONALIZED_ADVICE',
      );
      expect(classifyIntent('Help me with my portfolio')).toBe(
        'PERSONALIZED_ADVICE',
      );
    });

    it('should handle v-edfinance specific questions', () => {
      expect(classifyIntent('What courses does v-edfinance offer?')).toBe(
        'GENERAL_FAQ',
      );
    });

    it('should be case-insensitive', () => {
      expect(classifyIntent('WHAT IS STOCK?')).toBe('GENERAL_FAQ');
    });
  });

  describe('Error Handling Helpers', () => {
    it('should create fallback response for Vietnamese', () => {
      const fallback = createFallbackResponse('vi');
      expect(fallback).toContain('Xin lỗi');
    });

    it('should create fallback response for English', () => {
      const fallback = createFallbackResponse('en');
      expect(fallback).toContain('Sorry');
    });

    it('should create fallback response for Chinese', () => {
      const fallback = createFallbackResponse('zh');
      expect(fallback).toContain('抱歉');
    });

    it('should default to English for unknown locale', () => {
      const fallback = createFallbackResponse('fr');
      expect(fallback).toContain('Sorry');
    });

    it('should handle AI errors with context', () => {
      const error = new Error('Network timeout');
      const wrappedError = handleAIError(error, 'generateResponse');

      expect(wrappedError.message).toContain('AI Error in generateResponse');
      expect(wrappedError.message).toContain('Network timeout');
    });

    it('should handle AI errors without context', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('API key invalid');
      const wrappedError = handleAIError(error);

      expect(wrappedError.message).toContain('AI Error');
      expect(wrappedError.message).toContain('API key invalid');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases & Integration', () => {
    it('should handle empty strings in all utilities', () => {
      expect(estimateTokens('')).toBe(0);
      expect(maskPII({ email: '' }).email).toBe('***');
      expect(classifyIntent('')).toBe('PERSONALIZED_ADVICE');
    });

    it('should handle very long texts', () => {
      const longText = 'A'.repeat(10000);
      expect(estimateTokens(longText)).toBeGreaterThan(2000);
      expect(truncateToTokenBudget(longText, 100).length).toBeLessThanOrEqual(
        400,
      );
    });

    it('should handle special characters in prompts', () => {
      const prompt = buildCourseAdvicePrompt({
        courseTitle: 'Tài chính & Đầu tư <Advanced>',
        completedCount: 5,
        totalLessons: 10,
        nextLessonTitle: 'Lesson "Quotes" & Special',
      });
      expect(prompt).toContain('Tài chính & Đầu tư <Advanced>');
    });

    it('should maintain type safety in metadata parsing', () => {
      const response =
        '[ACTION_CARD]{"type":"QUIZ","questions":5}[/ACTION_CARD]';
      const { metadata } = parseActionCards(response);
      expect(metadata.type).toBe('QUIZ');
      expect(metadata.questions).toBe(5);
    });
  });
});
