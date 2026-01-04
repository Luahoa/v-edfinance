import { Injectable } from '@nestjs/common';

export interface AuditLogEntry {
  action: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

@Injectable()
export class AuditService {
  async log(entry: AuditLogEntry): Promise<void> {
    // Stub implementation - logs to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUDIT]', JSON.stringify(entry));
    }
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    from?: Date;
    to?: Date;
  }): Promise<AuditLogEntry[]> {
    // Stub implementation
    return [];
  }
}
