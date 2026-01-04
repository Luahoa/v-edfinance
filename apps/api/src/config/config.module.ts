import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AiController } from './ai.controller';
import { DynamicConfigService } from './dynamic-config.service';
import { GeminiService } from './gemini.service';

@Global()
@Module({
  imports: [UsersModule],
  providers: [DynamicConfigService, GeminiService],
  controllers: [AiController],
  exports: [DynamicConfigService, GeminiService],
})
export class ConfigModule {}
