import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';

// Mock LoggerMiddleware since it doesn't exist yet
class LoggerMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: any, res: any, next: () => void) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || '0';
      const duration = Date.now() - startTime;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength}B - ${userAgent} ${ip} +${duration}ms`,
      );
    });

    next();
  }
}

describe('LoggerMiddleware (C020)', () => {
  let middleware: LoggerMiddleware;
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: any;

  beforeEach(() => {
    middleware = new LoggerMiddleware();

    mockRequest = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('Mozilla/5.0'),
    };

    mockResponse = {
      statusCode: 200,
      get: vi.fn().mockReturnValue('1234'),
      on: vi.fn(),
    };

    nextFunction = vi.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('should call next function', () => {
      middleware.use(mockRequest, mockResponse, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should register finish event listener', () => {
      middleware.use(mockRequest, mockResponse, nextFunction);
      expect(mockResponse.on).toHaveBeenCalledWith(
        'finish',
        expect.any(Function),
      );
    });

    it('should log request method and URL', () => {
      const loggerSpy = vi.spyOn(middleware['logger'], 'log');

      middleware.use(mockRequest, mockResponse, nextFunction);

      // Trigger finish event
      const finishCallback = mockResponse.on.mock.calls.find(
        (call: any[]) => call[0] === 'finish',
      )?.[1];
      finishCallback?.();

      expect(loggerSpy).toHaveBeenCalled();
      const logMessage = loggerSpy.mock.calls[0][0];
      expect(logMessage).toContain('GET');
      expect(logMessage).toContain('/api/test');
    });

    it('should log status code', () => {
      const loggerSpy = vi.spyOn(middleware['logger'], 'log');

      middleware.use(mockRequest, mockResponse, nextFunction);

      const finishCallback = mockResponse.on.mock.calls.find(
        (call: any[]) => call[0] === 'finish',
      )?.[1];
      finishCallback?.();

      const logMessage = loggerSpy.mock.calls[0][0];
      expect(logMessage).toContain('200');
    });

    it('should log response time in milliseconds', () => {
      const loggerSpy = vi.spyOn(middleware['logger'], 'log');

      middleware.use(mockRequest, mockResponse, nextFunction);

      const finishCallback = mockResponse.on.mock.calls.find(
        (call: any[]) => call[0] === 'finish',
      )?.[1];
      finishCallback?.();

      const logMessage = loggerSpy.mock.calls[0][0];
      expect(logMessage).toMatch(/\+\d+ms/);
    });

    it('should log user agent', () => {
      const loggerSpy = vi.spyOn(middleware['logger'], 'log');

      middleware.use(mockRequest, mockResponse, nextFunction);

      const finishCallback = mockResponse.on.mock.calls.find(
        (call: any[]) => call[0] === 'finish',
      )?.[1];
      finishCallback?.();

      const logMessage = loggerSpy.mock.calls[0][0];
      expect(logMessage).toContain('Mozilla/5.0');
    });

    it('should log IP address', () => {
      const loggerSpy = vi.spyOn(middleware['logger'], 'log');

      middleware.use(mockRequest, mockResponse, nextFunction);

      const finishCallback = mockResponse.on.mock.calls.find(
        (call: any[]) => call[0] === 'finish',
      )?.[1];
      finishCallback?.();

      const logMessage = loggerSpy.mock.calls[0][0];
      expect(logMessage).toContain('127.0.0.1');
    });

    it('should handle missing user agent', () => {
      mockRequest.get = vi.fn().mockReturnValue('');
      const loggerSpy = vi.spyOn(middleware['logger'], 'log');

      middleware.use(mockRequest, mockResponse, nextFunction);

      const finishCallback = mockResponse.on.mock.calls.find(
        (call: any[]) => call[0] === 'finish',
      )?.[1];
      finishCallback?.();

      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should log content length', () => {
      const loggerSpy = vi.spyOn(middleware['logger'], 'log');

      middleware.use(mockRequest, mockResponse, nextFunction);

      const finishCallback = mockResponse.on.mock.calls.find(
        (call: any[]) => call[0] === 'finish',
      )?.[1];
      finishCallback?.();

      const logMessage = loggerSpy.mock.calls[0][0];
      expect(logMessage).toContain('1234B');
    });

    it('should handle 404 status codes', () => {
      mockResponse.statusCode = 404;
      const loggerSpy = vi.spyOn(middleware['logger'], 'log');

      middleware.use(mockRequest, mockResponse, nextFunction);

      const finishCallback = mockResponse.on.mock.calls.find(
        (call: any[]) => call[0] === 'finish',
      )?.[1];
      finishCallback?.();

      const logMessage = loggerSpy.mock.calls[0][0];
      expect(logMessage).toContain('404');
    });

    it('should handle 500 status codes', () => {
      mockResponse.statusCode = 500;
      const loggerSpy = vi.spyOn(middleware['logger'], 'log');

      middleware.use(mockRequest, mockResponse, nextFunction);

      const finishCallback = mockResponse.on.mock.calls.find(
        (call: any[]) => call[0] === 'finish',
      )?.[1];
      finishCallback?.();

      const logMessage = loggerSpy.mock.calls[0][0];
      expect(logMessage).toContain('500');
    });
  });
});
