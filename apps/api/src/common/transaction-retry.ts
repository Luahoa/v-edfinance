import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const logger = new Logger('TransactionRetry');

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
};

const RETRYABLE_ERROR_CODES = [
  'P2034', // Transaction failed due to a write conflict or a deadlock
  'P2028', // Transaction API error
  'P1017', // Server has closed the connection
];

function isRetryableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_ERROR_CODES.includes(error.code);
  }
  if (error instanceof Error && error.message.includes('deadlock')) {
    return true;
  }
  return false;
}

function calculateDelay(
  attempt: number,
  options: Required<RetryOptions>,
): number {
  const exponentialDelay = options.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * options.baseDelayMs;
  return Math.min(exponentialDelay + jitter, options.maxDelayMs);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === opts.maxRetries) {
        logger.error(
          `[${context}] Transaction failed after ${attempt + 1} attempt(s)`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }

      const delay = calculateDelay(attempt, opts);
      logger.warn(
        `[${context}] Retryable error on attempt ${attempt + 1}, retrying in ${delay}ms`,
        error instanceof Prisma.PrismaClientKnownRequestError
          ? error.code
          : 'UNKNOWN',
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
