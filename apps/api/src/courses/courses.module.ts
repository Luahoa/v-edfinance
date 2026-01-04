import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { RosterService } from './roster.service';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [CoursesController],
  providers: [CoursesService, RosterService],
  exports: [CoursesService, RosterService],
})
export class CoursesModule {}
