import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UnstorageService } from './unstorage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly unstorageService: UnstorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const key = `uploads/${Date.now()}-${file.originalname}`;
    const url = await this.unstorageService.uploadFile(key, file.buffer);
    return {
      url,
      key,
    };
  }
}
