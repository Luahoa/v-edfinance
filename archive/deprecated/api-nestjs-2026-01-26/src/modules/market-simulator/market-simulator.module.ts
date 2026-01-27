import { Module } from '@nestjs/common';
import { MarketSimulatorController } from './market-simulator.controller';
import { MarketSimulatorService } from './market-simulator.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [MarketSimulatorController],
  providers: [MarketSimulatorService],
  exports: [MarketSimulatorService],
})
export class MarketSimulatorModule {}
