import { UseGuards } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../auth/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  },
  namespace: 'social',
})
export class SocialGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, string> = new Map(); // userId -> socketId

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // Auto-ping/pong for heartbeat (Socket.io has built-in, but we can log/monitor)
    client.emit('connection_established', { timestamp: new Date() });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    for (const [userId, socketId] of this.connectedClients.entries()) {
      if (socketId === client.id) {
        this.connectedClients.delete(userId);
        this.server.emit('user_offline', { userId });
        break;
      }
    }
  }

  @SubscribeMessage('identify')
  @UseGuards(WsJwtGuard)
  handleIdentify(client: Socket, data: { user?: { sub: string }; userId?: string }) {
    const userId = data.user?.sub || (typeof data === 'string' ? data : data.userId);
    if (!userId) {
      return { status: 'error', message: 'User ID not found' };
    }
    // Check if user already has a connection and clean up to prevent ghosts
    const connected = this.connectedClients;
    if (connected.has(userId)) {
      const oldSocketId = connected.get(userId);
      if (oldSocketId && oldSocketId !== client.id) {
        this.server
          .to(oldSocketId)
          .emit('force_disconnect', { reason: 'new_connection' });
      }
    }

    connected.set(userId, client.id);
    void client.join(`user_${userId}`); // Better use rooms for targeted sends
    this.server.emit('user_online', { userId });

    return { status: 'identified', rooms: Array.from(client.rooms) };
  }

  @SubscribeMessage('join_group')
  handleJoinGroup(client: Socket, groupId: string) {
    void client.join(`group_${groupId}`);
    return { status: 'joined', group: groupId };
  }

  sendToUser(userId: string, event: string, data: any) {
    // Use rooms instead of mapping to socketId for better stability in clusters
    this.server.to(`user_${userId}`).emit(event, data);
  }

  broadcastToGroup(groupId: string, event: string, data: any) {
    this.server.to(`group_${groupId}`).emit(event, data);
  }

  broadcastNewPost(post: any) {
    this.server.emit('new_post', post);
  }
}
