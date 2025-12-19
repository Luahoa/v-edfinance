# Skill: Google Gemini AI Integration for Edtech

**Purpose:** Integrate Google Gemini AI for personalized learning experiences, content generation, and intelligent tutoring in edtech platforms.

**When to use:** Adding AI-powered features like adaptive learning, content recommendations, or intelligent Q&A.

---

## Setup & Configuration

### 1. Install Dependencies

```bash
cd apps/api
pnpm add @google/generative-ai
```

### 2. Environment Variables

**`.env` (apps/api):**
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-pro
```

### 3. Gemini Service (NestJS)

**`apps/api/src/ai/gemini.service.ts`:**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  }

  /**
   * Generate personalized learning content
   */
  async generateLearningContent(params: {
    topic: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
    locale: string;
    style?: 'formal' | 'casual' | 'witty';
  }): Promise<string> {
    const { topic, level, locale, style = 'casual' } = params;

    const prompt = this.buildLearningPrompt(topic, level, locale, style);

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Gemini API error:', error);
      throw new Error('Failed to generate content');
    }
  }

  /**
   * Answer user questions with context
   */
  async answerQuestion(params: {
    question: string;
    context: {
      module: string;
      lesson: string;
      userLevel: string;
    };
    locale: string;
  }): Promise<string> {
    const { question, context, locale } = params;

    const prompt = `
You are an expert financial education tutor. Answer the following question in ${locale === 'vi' ? 'Vietnamese' : locale === 'zh' ? 'Chinese' : 'English'}.

Context:
- Module: ${context.module}
- Lesson: ${context.lesson}
- Student Level: ${context.userLevel}

Question: ${question}

Provide a clear, concise answer suitable for a ${context.userLevel} level student. Use examples if helpful.
`;

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      return (await result.response).text();
    } catch (error) {
      this.logger.error('Question answering failed:', error);
      throw error;
    }
  }

  /**
   * Generate quiz questions
   */
  async generateQuiz(params: {
    topic: string;
    difficulty: string;
    questionCount: number;
    locale: string;
  }): Promise<QuizQuestion[]> {
    const { topic, difficulty, questionCount, locale } = params;

    const prompt = `
Generate ${questionCount} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty level.
Respond in ${this.getLanguageName(locale)}.

Return ONLY valid JSON in this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct"
  }
]
`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      const text = (await result.response).text();
      return JSON.parse(text);
    } catch (error) {
      this.logger.error('Quiz generation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze user behavior and provide insights
   */
  async analyzeUserBehavior(behaviorData: {
    completedLessons: number;
    averageSessionTime: number;
    weakAreas: string[];
    locale: string;
  }): Promise<{
    insights: string;
    recommendations: string[];
  }> {
    const prompt = `
Analyze this student's learning behavior and provide insights in ${this.getLanguageName(behaviorData.locale)}:

Data:
- Completed Lessons: ${behaviorData.completedLessons}
- Average Session Time: ${behaviorData.averageSessionTime} minutes
- Weak Areas: ${behaviorData.weakAreas.join(', ')}

Provide:
1. A brief insight paragraph
2. 3-5 actionable recommendations

Return as JSON:
{
  "insights": "paragraph here",
  "recommendations": ["rec 1", "rec 2", ...]
}
`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      return JSON.parse((await result.response).text());
    } catch (error) {
      this.logger.error('Behavior analysis failed:', error);
      throw error;
    }
  }

  /**
   * Translate content to multiple languages
   */
  async translateContent(params: {
    content: string;
    targetLocales: string[];
  }): Promise<Record<string, string>> {
    const { content, targetLocales } = params;

    const translations: Record<string, string> = {};

    for (const locale of targetLocales) {
      const prompt = `Translate the following to ${this.getLanguageName(locale)}. Preserve markdown formatting:\n\n${content}`;

      try {
        const model = this.genAI.getGenerativeModel({ model: this.model });
        const result = await model.generateContent(prompt);
        translations[locale] = (await result.response).text();
      } catch (error) {
        this.logger.error(`Translation to ${locale} failed:`, error);
        translations[locale] = content; // Fallback to original
      }
    }

    return translations;
  }

  // Helper methods

  private buildLearningPrompt(
    topic: string,
    level: string,
    locale: string,
    style: string,
  ): string {
    const language = this.getLanguageName(locale);
    
    return `
You are an expert educator creating learning content about "${topic}" for ${level} level students.

Requirements:
- Language: ${language}
- Tone: ${style}
- Structure: Introduction, Main Content (with examples), Summary
- Length: 500-800 words
- Include 2-3 practical examples relevant to Vietnamese/Asian markets

Create engaging, accurate content that helps students understand ${topic}.
`;
  }

  private getLanguageName(locale: string): string {
    const map: Record<string, string> = {
      vi: 'Vietnamese',
      en: 'English',
      zh: 'Chinese (Simplified)',
    };
    return map[locale] || 'English';
  }
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
```

---

## Usage Examples

### 1. AI-Powered Q&A Endpoint

**`apps/api/src/ai/ai.controller.ts`:**

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('ask')
  async askQuestion(
    @Body()
    body: {
      question: string;
      context: { module: string; lesson: string; userLevel: string };
      locale: string;
    },
  ) {
    const answer = await this.geminiService.answerQuestion(body);
    return { answer };
  }

  @Post('generate-quiz')
  async generateQuiz(
    @Body()
    body: {
      topic: string;
      difficulty: string;
      questionCount: number;
      locale: string;
    },
  ) {
    const quiz = await this.geminiService.generateQuiz(body);
    return { quiz };
  }
}
```

### 2. Frontend Integration (Next.js)

**`apps/web/src/components/AiTutor.tsx`:**

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function AiTutor({ lessonContext }: { lessonContext: any }) {
  const t = useTranslations('ai');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: lessonContext,
          locale: 'vi',
        }),
      });
      const data = await res.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('AI request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tutor">
      <h3>{t('askAi')}</h3>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={t('questionPlaceholder')}
      />
      <button onClick={askQuestion} disabled={loading}>
        {loading ? t('thinking') : t('ask')}
      </button>
      {answer && (
        <div className="answer">
          <h4>{t('answer')}:</h4>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Best Practices

### 1. Rate Limiting
```typescript
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Controller('ai')
export class AiController {
  // Limit AI requests to prevent abuse
}
```

### 2. Caching Responses
```typescript
import { CacheInterceptor } from '@nestjs/cache-manager';

@UseInterceptors(CacheInterceptor)
async generateQuiz() {
  // Cache quiz results for 1 hour
}
```

### 3. Error Handling
```typescript
try {
  const result = await this.geminiService.answerQuestion(params);
  return result;
} catch (error) {
  if (error.code === 429) {
    throw new HttpException('Rate limit exceeded', 429);
  }
  throw new HttpException('AI service unavailable', 503);
}
```

### 4. Prompt Engineering Tips
- **Be specific** about output format (JSON, Markdown, etc.)
- **Provide context** (user level, language, topic)
- **Use examples** in prompts for better results
- **Set temperature** based on task (0.7 for creative, 0.3 for factual)

---

## Safety & Moderation

```typescript
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const model = this.genAI.getGenerativeModel({
  model: this.model,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});
```

---

## Cost Optimization

1. **Cache common queries** (FAQs, quiz banks)
2. **Batch requests** when possible
3. **Use streaming** for long responses
4. **Set max tokens** to control costs
5. **Monitor usage** via Google Cloud Console

---

## References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Node.js SDK](https://www.npmjs.com/package/@google/generative-ai)
- [Prompt Engineering Guide](https://ai.google.dev/docs/prompt_best_practices)
