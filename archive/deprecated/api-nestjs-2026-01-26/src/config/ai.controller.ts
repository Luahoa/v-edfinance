import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import type { AiMentoringDto } from './dto/ai-mentoring.dto';
import { GeminiService } from './gemini.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('mentor')
  async askMentor(@Request() req: any, @Body() dto: AiMentoringDto) {
    const user = await this.usersService.findById(req.user.userId);

    const prompt = {
      context: {
        module: dto.module || 'General',
        lesson: dto.lesson || 'General',
        user_query: dto.userQuery,
        locale: dto.locale || user?.preferredLocale || 'vi',
      },
      user_profile: {
        knowledge_level:
          (user as any)?.investmentProfile?.currentKnowledge || 'Beginner',
        risk_score: (user as any)?.investmentProfile?.riskScore || 0,
      },
    };

    return this.geminiService.generateResponse(prompt);
  }
}
