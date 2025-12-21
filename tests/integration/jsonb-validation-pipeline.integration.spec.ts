import { Test } from '@nestjs/testing';
import { ValidationService } from '../../apps/api/src/common/validation.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { beforeEach, describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';

describe('I022: JSONB Schema Validation Pipeline Integration', () => {
  let validationService: ValidationService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ValidationService, PrismaService],
    }).compile();

    validationService = module.get<ValidationService>(ValidationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should reject invalid JSONB data with user-friendly error', () => {
    const invalidPayload = {
      isMock: 'not-a-boolean',
      generatedAt: 'invalid-date',
    };

    expect(() => {
      validationService.validate('BEHAVIOR_LOG_PAYLOAD', invalidPayload);
    }).toThrow(BadRequestException);
  });

  it('should validate and accept correct JSONB structure', () => {
    const validPayload = {
      isMock: true,
      generatedAt: new Date().toISOString(),
      action: 'test-action',
      details: { key: 'value' },
    };

    const result = validationService.validate('BEHAVIOR_LOG_PAYLOAD', validPayload);
    expect(result).toEqual(validPayload);
  });

  it('should enforce I18N_TEXT schema for multilingual fields', () => {
    const invalidI18n = {
      vi: 'Tiếng Việt',
      en: 'English',
    };

    expect(() => {
      validationService.validate('I18N_TEXT', invalidI18n);
    }).toThrow(BadRequestException);

    const validI18n = {
      vi: 'Tiếng Việt',
      en: 'English',
      zh: '中文',
    };

    const result = validationService.validate('I18N_TEXT', validI18n);
    expect(result).toEqual(validI18n);
  });

  it('should validate USER_METADATA schema with optional fields', () => {
    const partialMetadata = {
      displayName: 'John Doe',
    };

    const result = validationService.validate('USER_METADATA', partialMetadata);
    expect(result.displayName).toBe('John Doe');

    const invalidMetadata = {
      displayName: 'Valid Name',
      avatar: 'not-a-url',
    };

    expect(() => {
      validationService.validate('USER_METADATA', invalidMetadata);
    }).toThrow(BadRequestException);
  });

  it('should provide detailed error messages for validation failures', () => {
    const invalidData = {
      eventTitle: 123,
      description: '',
      options: 'not-an-array',
    };

    try {
      validationService.validate('SIMULATION_EVENT', invalidData);
    } catch (error: any) {
      expect(error.response.message).toContain('Invalid data structure');
      expect(error.response.details).toBeDefined();
      expect(error.response.errorId).toMatch(/^HALLUCINATION-[A-F0-9]+$/);
    }
  });

  it('should reject unregistered schema keys', () => {
    expect(() => {
      validationService.validate('NON_EXISTENT_SCHEMA' as any, {});
    }).toThrow('Schema for key NON_EXISTENT_SCHEMA is not defined in SchemaRegistry');
  });

  it('should validate complex nested JSONB structures', () => {
    const validSimulation = {
      eventTitle: 'Market Crash',
      description: 'A sudden market downturn',
      options: [
        {
          id: 'opt1',
          text: 'Sell everything',
          impact: {
            savings: -1000,
            happiness: -20,
          },
        },
        {
          id: 'opt2',
          text: 'Hold position',
          impact: {
            savings: 0,
            happiness: -5,
          },
        },
      ],
    };

    const result = validationService.validate('SIMULATION_EVENT', validSimulation);
    expect(result.options).toHaveLength(2);
    expect(result.eventTitle).toBe('Market Crash');
  });

  it('should integrate with database writes and reject invalid data', async () => {
    const userId = 'validation-test-user';

    const invalidPayload = {
      isMock: 'should-be-boolean',
    };

    try {
      validationService.validate('BEHAVIOR_LOG_PAYLOAD', invalidPayload);
      await prismaService.behaviorLog.create({
        data: {
          userId,
          sessionId: 'test',
          path: '/test',
          eventType: 'TEST',
          payload: invalidPayload,
        },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
    }

    const validPayload = {
      isMock: true,
      generatedAt: new Date().toISOString(),
    };

    const validated = validationService.validate('BEHAVIOR_LOG_PAYLOAD', validPayload);

    const log = await prismaService.behaviorLog.create({
      data: {
        userId,
        sessionId: 'test',
        path: '/test',
        eventType: 'TEST',
        payload: validated,
      },
    });

    expect(log.payload).toEqual(validated);
  });
});
