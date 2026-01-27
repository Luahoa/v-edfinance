import { Module } from '@nestjs/common';
import { DocumentAnalyzerController } from './document-analyzer.controller';
import { DocumentAnalyzerService } from './document-analyzer.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [DocumentAnalyzerController],
  providers: [DocumentAnalyzerService],
  exports: [DocumentAnalyzerService],
})
export class DocumentAnalyzerModule {}
