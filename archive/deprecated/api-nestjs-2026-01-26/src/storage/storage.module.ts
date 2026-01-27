import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { UnstorageService } from './unstorage.service';

@Module({
  imports: [ConfigModule],
  controllers: [StorageController],
  providers: [StorageService, UnstorageService],
  exports: [StorageService, UnstorageService],
})
export class StorageModule {}
