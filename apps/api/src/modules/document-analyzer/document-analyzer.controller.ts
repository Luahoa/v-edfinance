import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { DocumentAnalyzerService } from './document-analyzer.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface AnalyzeRequestDto {
  documentText: string;
  documentType: 'bank_statement' | 'invoice' | 'contract' | 'report';
}

@Controller('document-analyzer')
@UseGuards(JwtAuthGuard)
export class DocumentAnalyzerController {
  constructor(
    private readonly documentAnalyzerService: DocumentAnalyzerService,
  ) {}

  @Post('analyze')
  async analyzeDocument(@Body() body: AnalyzeRequestDto) {
    return this.documentAnalyzerService.analyzeDocument(
      body.documentText,
      body.documentType,
    );
  }
}
