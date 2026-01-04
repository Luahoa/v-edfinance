import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditAdminGuard } from './audit.guard';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';

@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditInterceptor, AuditAdminGuard],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
