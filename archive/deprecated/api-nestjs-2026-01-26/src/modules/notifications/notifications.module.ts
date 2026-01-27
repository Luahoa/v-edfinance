import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ZaloNotificationService } from './zalo-notification.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [ZaloNotificationService],
  exports: [ZaloNotificationService],
})
export class NotificationsModule {}
