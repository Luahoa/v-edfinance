import * as crypto from 'node:crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type SchemaKey, SchemaRegistry } from './schema-registry';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  /**
   * Validates a JSONB field against the registered schema.
   * Prevents AI agents from injecting halluncinated fields.
   */
  validate(key: SchemaKey, data: any) {
    const schema = SchemaRegistry[key];
    if (!schema) {
      throw new Error(
        `Schema for key ${key} is not defined in SchemaRegistry.`,
      );
    }

    const result = schema.safeParse(data);
    if (!result.success) {
      const errorDetails = (result as any).error.errors
        .map((e: any) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      this.logger.error(
        `[ANTI-HALLUCINATION] Validation failed for ${key}: ${errorDetails}`,
      );
      throw new BadRequestException({
        message: `Invalid data structure for ${key}`,
        details: errorDetails,
        errorId: `HALLUCINATION-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      });
    }

    return result.data;
  }
}
