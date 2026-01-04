import { Logger, UseGuards } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../auth/ws-jwt.guard';
import { WebSocketService } from './websocket.service';

interface IdentifyPayload {
  userId: string;
  deviceInfo?: string;
}

interface SyncPayload {
  type: string;
  data: unknown;
  timestamp?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  },
  namespace: 'events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly wsService: WebSocketService) {}

  afterInit(server: Server): void {
    this.wsService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection_established', {
      socketId: client.id,
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket): void {
    const userId = this.wsService.removeClient(client.id);
    if (userId) {
      if (!this.wsService.isUserOnline(userId)) {
        this.server.emit('user_offline', { userId, timestamp: new Date() });
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('identify')
  @UseGuards(WsJwtGuard)
  handleIdentify(
    client: Socket,
    payload: IdentifyPayload,
  ): { status: string; rooms: string[] } {
    const { userId, deviceInfo } = payload;

    void client.join(`user_${userId}`);
    this.wsService.addClient(userId, client, deviceInfo);

    const wasAlreadyOnline = this.wsService.getClientCount(userId) > 1;
    if (!wasAlreadyOnline) {
      this.server.emit('user_online', { userId, timestamp: new Date() });
    }

    return {
      status: 'identified',
      rooms: Array.from(client.rooms),
    };
  }

  @SubscribeMessage('join_room')
  @UseGuards(WsJwtGuard)
  handleJoinRoom(
    client: Socket,
    room: string,
  ): { status: string; room: string } {
    void client.join(room);
    this.logger.debug(`Client ${client.id} joined room: ${room}`);
    return { status: 'joined', room };
  }

  @SubscribeMessage('leave_room')
  @UseGuards(WsJwtGuard)
  handleLeaveRoom(
    client: Socket,
    room: string,
  ): { status: string; room: string } {
    void client.leave(room);
    this.logger.debug(`Client ${client.id} left room: ${room}`);
    return { status: 'left', room };
  }

  @SubscribeMessage('sync')
  @UseGuards(WsJwtGuard)
  handleSync(
    client: Socket,
    payload: SyncPayload,
  ): { status: string; received: string } {
    this.logger.debug(`Sync event received: ${payload.type}`);

    for (const room of client.rooms) {
      if (room !== client.id) {
        this.server
          .to(room)
          .except(client.id)
          .emit('sync', {
            ...payload,
            timestamp: payload.timestamp || new Date().toISOString(),
            sourceSocketId: client.id,
          });
      }
    }

    return {
      status: 'synced',
      received: payload.type,
    };
  }

  @SubscribeMessage('notification')
  @UseGuards(WsJwtGuard)
  handleNotification(
    client: Socket,
    payload: { targetUserId: string; type: string; data: unknown },
  ): { status: string } {
    this.wsService.broadcastToUser(payload.targetUserId, 'notification', {
      type: payload.type,
      data: payload.data,
      timestamp: new Date(),
    });
    return { status: 'sent' };
  }

  @SubscribeMessage('progress-update')
  @UseGuards(WsJwtGuard)
  handleProgressUpdate(
    client: Socket,
    payload: { userId: string; progress: unknown },
  ): { status: string } {
    this.wsService.broadcastToUser(payload.userId, 'progress-update', {
      progress: payload.progress,
      timestamp: new Date(),
    });
    return { status: 'broadcasted' };
  }

  @SubscribeMessage('ping')
  handlePing(): { event: string; timestamp: Date } {
    return { event: 'pong', timestamp: new Date() };
  }
}
