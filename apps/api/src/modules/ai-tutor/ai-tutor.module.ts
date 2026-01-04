import { Module } from '@nestjs/common';
import { AiTutorController } from './ai-tutor.controller';
import { AiTutorService } from './ai-tutor.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AiTutorController],
  providers: [AiTutorService],
  exports: [AiTutorService],
})
export class AiTutorModule {}
