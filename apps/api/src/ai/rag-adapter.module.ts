import { Module } from '@nestjs/common';
import { RagAdapterService } from './rag-adapter.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule], // Provides PgvectorService
  providers: [RagAdapterService],
  exports: [RagAdapterService],
})
export class RagAdapterModule {}
