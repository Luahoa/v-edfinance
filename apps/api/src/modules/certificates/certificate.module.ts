import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './services/certificate.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { R2StorageService } from './services/r2-storage.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  controllers: [CertificateController],
  providers: [
    CertificateService,
    PdfGeneratorService,
    R2StorageService,
  ],
  exports: [CertificateService],
})
export class CertificateModule {}
