import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiTutorService } from './ai-tutor.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface ChatRequestDto {
  message: string;
  locale: 'vi' | 'en' | 'zh';
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

@Controller('ai-tutor')
@UseGuards(JwtAuthGuard)
export class AiTutorController {
  constructor(private readonly aiTutorService: AiTutorService) {}

  @Post('chat')
  async chat(@Body() body: ChatRequestDto) {
    // TODO: Extract userId from JWT token
    const userId = 'temp-user-id'; // Placeholder

    return this.aiTutorService.chat({
      ...body,
      userId,
    });
  }
}
