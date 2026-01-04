import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationService } from './gamification.service';
import { I18nService } from './i18n.service';
import { RedisCacheModule } from './redis-cache.module';
import { ValidationService } from './validation.service';

@Global()
@Module({
  imports: [PrismaModule, RedisCacheModule],
  providers: [GamificationService, I18nService, ValidationService],
  exports: [
    GamificationService,
    I18nService,
    ValidationService,
    RedisCacheModule,
  ],
})
export class CommonModule {}
