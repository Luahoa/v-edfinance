import { Injectable, Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';

interface ConnectedClient {
  socketId: string;
  connectedAt: Date;
  deviceInfo?: string;
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server | null = null;
  private connectedClients: Map<string, ConnectedClient[]> = new Map();

  setServer(server: Server): void {
    this.server = server;
  }

  addClient(userId: string, client: Socket, deviceInfo?: string): void {
    const clients = this.connectedClients.get(userId) || [];
    clients.push({
      socketId: client.id,
      connectedAt: new Date(),
      deviceInfo,
    });
    this.connectedClients.set(userId, clients);
    this.logger.log(`User ${userId} connected (${clients.length} device(s))`);
  }

  removeClient(socketId: string): string | null {
    for (const [userId, clients] of this.connectedClients.entries()) {
      const index = clients.findIndex((c) => c.socketId === socketId);
      if (index !== -1) {
        clients.splice(index, 1);
        if (clients.length === 0) {
          this.connectedClients.delete(userId);
        } else {
          this.connectedClients.set(userId, clients);
        }
        this.logger.log(
          `User ${userId} disconnected a device (${clients.length} remaining)`,
        );
        return userId;
      }
    }
    return null;
  }

  getClientCount(userId: string): number {
    return this.connectedClients.get(userId)?.length || 0;
  }

  getTotalConnections(): number {
    let total = 0;
    for (const clients of this.connectedClients.values()) {
      total += clients.length;
    }
    return total;
  }

  isUserOnline(userId: string): boolean {
    return this.connectedClients.has(userId);
  }

  broadcastToUser(userId: string, event: string, data: unknown): void {
    if (!this.server) {
      this.logger.warn('Server not initialized');
      return;
    }
    this.server.to(`user_${userId}`).emit(event, data);
    this.logger.debug(`Broadcast to user ${userId}: ${event}`);
  }

  broadcastToRoom(room: string, event: string, data: unknown): void {
    if (!this.server) {
      this.logger.warn('Server not initialized');
      return;
    }
    this.server.to(room).emit(event, data);
    this.logger.debug(`Broadcast to room ${room}: ${event}`);
  }

  broadcastToAll(event: string, data: unknown): void {
    if (!this.server) {
      this.logger.warn('Server not initialized');
      return;
    }
    this.server.emit(event, data);
    this.logger.debug(`Broadcast to all: ${event}`);
  }

  disconnectUser(userId: string): void {
    if (!this.server) {
      this.logger.warn('Server not initialized');
      return;
    }
    const clients = this.connectedClients.get(userId);
    if (clients) {
      for (const client of clients) {
        this.server.to(client.socketId).emit('force_disconnect', {
          reason: 'server_disconnect',
          timestamp: new Date(),
        });
      }
      this.connectedClients.delete(userId);
      this.logger.log(`Force disconnected user ${userId}`);
    }
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
