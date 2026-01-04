import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { register } from 'prom-client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { AiMetricsService } from './metrics.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly metricsService: AiMetricsService,
  ) {}

  @Post('threads')
  @UseGuards(JwtAuthGuard)
  createThread(
    @Request() req: any,
    @Body() body: { title: string; module?: string },
  ) {
    return this.aiService.createThread(
      req.user.userId,
      body.title,
      body.module,
    );
  }

  @Get('threads')
  @UseGuards(JwtAuthGuard)
  getThreads(@Request() req: any) {
    return this.aiService.getThreads(req.user.userId);
  }

  @Get('threads/:id/messages')
  @UseGuards(JwtAuthGuard)
  getMessages(@Param('id') threadId: string) {
    return this.aiService.getMessages(threadId);
  }

  @Post('threads/:id/chat')
  @UseGuards(JwtAuthGuard)
  chat(
    @Param('id') threadId: string,
    @Request() req: any,
    @Body() body: { prompt: string },
  ) {
    return this.aiService.generateResponse(
      threadId,
      body.prompt,
      req.user.userId,
    );
  }

  @Get('metrics/baseline')
  async getMetricsBaseline(@Res() res: Response) {
    const metrics = await this.metricsService.getMetrics();
    res.set('Content-Type', register.contentType);
    res.send(metrics);
  }
}
