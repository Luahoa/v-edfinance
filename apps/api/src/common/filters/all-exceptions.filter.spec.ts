import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'reflect-metadata';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter (C019)', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test-endpoint',
      method: 'POST',
    };

    mockHost = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should generate unique ErrorId for each exception', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalled();
      const errorResponse = mockResponse.json.mock.calls[0][0];
      expect(errorResponse.errorId).toMatch(/^ERR-[A-F0-9]{10}$/);
    });

    it('should return 500 for non-HTTP exceptions', () => {
      const exception = new Error('Unexpected error');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('should return correct status for HttpException', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('should include timestamp in error response', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      const errorResponse = mockResponse.json.mock.calls[0][0];
      expect(errorResponse.timestamp).toBeDefined();
      expect(new Date(errorResponse.timestamp).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
    });

    it('should include request path in error response', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      const errorResponse = mockResponse.json.mock.calls[0][0];
      expect(errorResponse.path).toBe('/test-endpoint');
    });

    it('should provide login suggestion for 401 errors', () => {
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockHost);

      const errorResponse = mockResponse.json.mock.calls[0][0];
      expect(errorResponse.suggestion).toBe('Please login again');
    });

    it('should provide contact support suggestion for other errors', () => {
      const exception = new HttpException(
        'Server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockHost);

      const errorResponse = mockResponse.json.mock.calls[0][0];
      expect(errorResponse.suggestion).toBe(
        'Please contact support with Error ID',
      );
    });

    it('should handle complex HttpException message objects', () => {
      const exception = new HttpException(
        { message: 'Validation failed', errors: ['Field1', 'Field2'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      const errorResponse = mockResponse.json.mock.calls[0][0];
      expect(errorResponse.message).toBe('Validation failed');
    });

    it('should log errors with stack trace for 400+ status codes', () => {
      const loggerSpy = vi.spyOn(filter['logger'], 'error');
      const exception = new HttpException(
        'Server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalled();
      const logCall = loggerSpy.mock.calls[0][0] as string;
      expect(logCall).toContain('ERR-');
      expect(logCall).toContain('POST');
      expect(logCall).toContain('/test-endpoint');
    });

    it('should handle string message from HttpException', () => {
      const exception = new HttpException(
        'Simple error message',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      const errorResponse = mockResponse.json.mock.calls[0][0];
      expect(errorResponse.message).toBe('Simple error message');
    });
  });

  describe('ErrorId Generation', () => {
    it('should generate unique ErrorIds for concurrent exceptions', () => {
      const errorIds = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const exception = new HttpException(
          'Test error',
          HttpStatus.BAD_REQUEST,
        );
        filter.catch(exception, mockHost);
        const errorResponse = mockResponse.json.mock.calls[i][0];
        errorIds.add(errorResponse.errorId);
      }

      expect(errorIds.size).toBe(10);
    });
  });
});
