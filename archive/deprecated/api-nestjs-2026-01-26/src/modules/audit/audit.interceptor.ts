import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';
import { AuditAction, AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutatingMethods.includes(method)) {
      return next.handle();
    }

    const userId = request.user?.id ?? 'anonymous';
    const action = this.mapMethodToAction(method);
    const route = request.route?.path ?? request.url;
    const ipAddress = request.ip ?? request.headers['x-forwarded-for'];
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditService.logWithContext(
            action,
            userId,
            ipAddress,
            userAgent,
            {
              method,
              route,
              body: this.sanitizeBody(request.body),
              params: request.params,
              query: request.query,
              success: true,
            },
          );
        },
        error: (error: Error) => {
          this.auditService.logWithContext(
            action,
            userId,
            ipAddress,
            userAgent,
            {
              method,
              route,
              body: this.sanitizeBody(request.body),
              params: request.params,
              query: request.query,
              success: false,
              error: error.message,
            },
          );
        },
      }),
    );
  }

  private mapMethodToAction(method: string): AuditAction {
    switch (method) {
      case 'POST':
        return AuditAction.DATA_CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.DATA_UPDATE;
      case 'DELETE':
        return AuditAction.DATA_DELETE;
      default:
        return AuditAction.DATA_ACCESS;
    }
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body) return {};

    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'secret',
      'apiKey',
    ];
    const sanitized: Record<string, unknown> = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
