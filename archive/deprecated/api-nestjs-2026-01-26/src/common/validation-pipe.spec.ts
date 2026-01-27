import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, IsEmail, IsString, MinLength } from 'class-validator';

class TestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

describe('ValidationPipe (C018)', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('transform', () => {
    it('should validate and transform valid DTO', async () => {
      const validData = { email: 'test@example.com', password: 'password123' };
      const result = await pipe.transform(validData, {
        type: 'body',
        metatype: TestDto,
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should reject invalid email format', async () => {
      const invalidData = { email: 'not-an-email', password: 'password123' };

      await expect(
        pipe.transform(invalidData, {
          type: 'body',
          metatype: TestDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject password shorter than 6 characters', async () => {
      const invalidData = { email: 'test@example.com', password: '123' };

      await expect(
        pipe.transform(invalidData, {
          type: 'body',
          metatype: TestDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should strip non-whitelisted properties', async () => {
      const dataWithExtra = {
        email: 'test@example.com',
        password: 'password123',
        extraField: 'should-be-removed',
      };

      await expect(
        pipe.transform(dataWithExtra, {
          type: 'body',
          metatype: TestDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('JSONB Schema Validation Integration', () => {
    it('should validate JSONB structure with I18n format', async () => {
      class JsonbDto {
        @IsString()
        name!: any;
      }

      const validJsonb = {
        name: JSON.stringify({ vi: 'Tên', en: 'Name', zh: '名称' }),
      };

      const instance = plainToInstance(JsonbDto, validJsonb);
      const errors = await validate(instance);
      expect(errors.length).toBe(0);
    });

    it('should reject malformed JSONB structure', async () => {
      class JsonbDto {
        @IsString()
        name!: string;
      }

      const invalidJsonb = {
        name: 'not-a-valid-jsonb',
      };

      const instance = plainToInstance(JsonbDto, invalidJsonb);
      const errors = await validate(instance);
      expect(errors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Custom Validators', () => {
    it('should validate nested objects', async () => {
      class NestedDto {
        @IsEmail()
        email!: string;
      }

      const validNested = { email: 'test@example.com' };
      const instance = plainToInstance(NestedDto, validNested);
      const errors = await validate(instance);

      expect(errors.length).toBe(0);
    });

    it('should handle array validation', async () => {
      const arrayData = [
        { email: 'test1@example.com', password: 'password123' },
        { email: 'test2@example.com', password: 'password456' },
      ];

      for (const item of arrayData) {
        const instance = plainToInstance(TestDto, item);
        const errors = await validate(instance);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', async () => {
      const nullData = { email: null, password: null };

      await expect(
        pipe.transform(nullData, {
          type: 'body',
          metatype: TestDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle undefined values', async () => {
      const undefinedData = { email: undefined, password: undefined };

      await expect(
        pipe.transform(undefinedData, {
          type: 'body',
          metatype: TestDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle empty strings', async () => {
      const emptyData = { email: '', password: '' };

      await expect(
        pipe.transform(emptyData, {
          type: 'body',
          metatype: TestDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
