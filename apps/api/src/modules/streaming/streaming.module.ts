import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CDNModule } from '../cdn/cdn.module';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';

@Module({
  imports: [ConfigModule, CDNModule],
  controllers: [StreamingController],
  providers: [StreamingService],
  exports: [StreamingService],
})
export class StreamingModule {}
