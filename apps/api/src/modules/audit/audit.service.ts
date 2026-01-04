import { Injectable, Logger } from '@nestjs/common';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  ADMIN_ACTION = 'ADMIN_ACTION',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  SECURITY_EVENT = 'SECURITY_EVENT',
}

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  userId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly logs: AuditLogEntry[] = [];
  private idCounter = 0;

  async log(
    action: AuditAction,
    userId: string,
    metadata?: Record<string, unknown>,
  ): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: `audit-${++this.idCounter}`,
      action,
      userId,
      metadata,
      timestamp: new Date(),
    };

    this.logs.push(entry);
    this.logger.log(`Audit: ${action} by user ${userId}`);

    return entry;
  }

  async logWithContext(
    action: AuditAction,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>,
  ): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: `audit-${++this.idCounter}`,
      action,
      userId,
      metadata,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };

    this.logs.push(entry);
    this.logger.log(`Audit: ${action} by user ${userId} from ${ipAddress}`);

    return entry;
  }

  async getLogs(options?: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLogEntry[]; total: number }> {
    let filtered = [...this.logs];

    if (options?.userId) {
      filtered = filtered.filter((log) => log.userId === options.userId);
    }

    if (options?.action) {
      filtered = filtered.filter((log) => log.action === options.action);
    }

    if (options?.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= options.startDate!);
    }

    if (options?.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= options.endDate!);
    }

    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = filtered.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;

    return {
      logs: filtered.slice(offset, offset + limit),
      total,
    };
  }

  async getLogsByUserId(userId: string): Promise<AuditLogEntry[]> {
    return this.logs
      .filter((log) => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getLogById(id: string): Promise<AuditLogEntry | undefined> {
    return this.logs.find((log) => log.id === id);
  }

  clearLogs(): void {
    this.logs.length = 0;
    this.idCounter = 0;
  }
}
