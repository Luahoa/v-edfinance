import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseService } from './database.service';
import { KyselyModule } from './kysely.module';
import { PgvectorService } from './pgvector.service';
import { DatabaseArchitectAgent } from './database-architect.agent';
import { OptimizationController } from './optimization.controller';

@Module({
  imports: [ConfigModule, KyselyModule, ScheduleModule.forRoot()],
  providers: [DatabaseService, PgvectorService, DatabaseArchitectAgent],
  controllers: [OptimizationController],
  exports: [DatabaseService, PgvectorService, DatabaseArchitectAgent],
})
export class DatabaseModule {}
