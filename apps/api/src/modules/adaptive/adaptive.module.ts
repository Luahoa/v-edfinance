import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdaptiveController } from './adaptive.controller';
import { AdaptiveService } from './adaptive.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdaptiveController],
  providers: [AdaptiveService],
  exports: [AdaptiveService],
})
export class AdaptiveModule {}
