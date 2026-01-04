import { Module } from '@nestjs/common';
import { AiModule } from '../../ai/ai.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [SimulationController],
  providers: [SimulationService],
  exports: [SimulationService],
})
export class SimulationModule {}
