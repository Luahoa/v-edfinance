import { createHash } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  detectedLanguage?: string;
  context?: string;
}

export interface ModerationOptions {
  storeHash?: boolean;
  enforceStrikes?: boolean;
  context?: string;
  useCache?: boolean;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly moderationCache = new Map<string, ModerationResult>();
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(
    private readonly aiClient: any,
    private readonly prisma: PrismaService,
    private readonly customLogger?: Logger,
  ) {
    this.logger = customLogger || this.logger;
  }

  async moderateContent(
    content: string,
    userId: string,
    language: 'vi' | 'en' | 'zh' | 'auto' = 'auto',
    options: ModerationOptions = {},
  ): Promise<ModerationResult> {
    if (!content) {
      return {
        flagged: false,
        categories: {},
        severity: 'NONE',
        confidence: 1.0,
      };
    }

    const cacheKey = this.generateCacheKey(content);
    if (options.useCache && this.moderationCache.has(cacheKey)) {
      this.logger.log(`Cache hit for moderation: ${cacheKey}`);
      return this.moderationCache.get(cacheKey)!;
    }

    try {
      if (options.enforceStrikes) {
        await this.checkUserStrikes(userId);
      }

      const result = await this.aiClient.moderateText({
        text: content,
        language,
      });

      const moderationResult: ModerationResult = {
        flagged: result.flagged,
        categories: result.categories || {},
        severity: result.severity || 'NONE',
        confidence: result.confidence || 0,
        detectedLanguage: result.detectedLanguage,
        context: result.context,
      };

      await this.logModeration(content, userId, moderationResult, options);

      if (moderationResult.flagged && options.enforceStrikes) {
        await this.handleStrike(userId, moderationResult.severity);
      }

      if (options.useCache) {
        this.moderationCache.set(cacheKey, moderationResult);
        setTimeout(() => this.moderationCache.delete(cacheKey), this.CACHE_TTL);
      }

      return moderationResult;
    } catch (error: any) {
      this.logger.error(`Moderation API error: ${error.message}`, error.stack);

      if (error.message?.includes('Rate limit')) {
        this.logger.warn('Rate limit exceeded for moderation API');
      }

      throw new InternalServerErrorException('Moderation API error');
    }
  }

  async moderateBatch(
    contents: string[],
    userId: string,
    language: 'vi' | 'en' | 'zh' | 'auto' = 'auto',
    options: ModerationOptions = {},
  ): Promise<ModerationResult[]> {
    const results = await Promise.all(
      contents.map((content) =>
        this.moderateContent(content, userId, language, options),
      ),
    );
    return results;
  }

  private async checkUserStrikes(userId: string): Promise<void> {
    const criticalViolations = await this.prisma.moderationLog.findMany({
      where: {
        userId,
        severity: 'CRITICAL',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (criticalViolations.length >= 2) {
      throw new ForbiddenException(
        'Account suspended due to multiple critical violations',
      );
    }
  }

  private async handleStrike(
    userId: string,
    severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  ): Promise<void> {
    if (severity === 'LOW' || severity === 'NONE') {
      return;
    }

    const strikeIncrement =
      severity === 'CRITICAL' ? 3 : severity === 'HIGH' ? 2 : 1;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        moderationStrikes: {
          increment: strikeIncrement,
        },
      },
    });
  }

  private async logModeration(
    content: string,
    userId: string,
    result: ModerationResult,
    options: ModerationOptions,
  ): Promise<void> {
    const logData: any = {
      userId,
      flagged: result.flagged,
      severity: result.severity,
      categories: result.categories,
      confidence: result.confidence,
      detectedLanguage: result.detectedLanguage,
      context: options.context,
      createdAt: new Date(),
    };

    if (options.storeHash) {
      logData.contentHash = this.generateCacheKey(content);
    } else {
      logData.content = content.substring(0, 500); // Store first 500 chars
    }

    await this.prisma.moderationLog.create({
      data: logData,
    });
  }

  private generateCacheKey(content: string): string {
    return createHash('sha256')
      .update(content.toLowerCase().trim())
      .digest('hex');
  }
}
