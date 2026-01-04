import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ProactiveTriggersService } from './proactive-triggers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NudgeModule } from '../modules/nudge/nudge.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron
    PrismaModule,
    NudgeModule,
  ],
  providers: [ProactiveTriggersService],
  exports: [ProactiveTriggersService],
})
export class ProactiveTriggersModule {}
