import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { EventsGateway } from './events.gateway';
import { WebSocketService } from './websocket.service';

@Module({
  imports: [AuthModule],
  providers: [EventsGateway, WebSocketService],
  exports: [EventsGateway, WebSocketService],
})
export class WebSocketModule {}
