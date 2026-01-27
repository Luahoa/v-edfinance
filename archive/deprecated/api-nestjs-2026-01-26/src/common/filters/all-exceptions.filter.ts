import * as crypto from 'node:crypto';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorId = `ERR-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      errorId,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'object' ? (message as any).message : message,
      suggestion:
        status === 401
          ? 'Please login again'
          : 'Please contact support with Error ID',
    };

    if (status >= 400) {
      this.logger.error(
        `[${errorId}] ${request.method} ${request.url} ${status} - ${JSON.stringify(errorResponse)}`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    response.status(status).json(errorResponse);
  }
}
