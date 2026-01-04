import { Injectable } from '@nestjs/common';

@Injectable()
export class WebSocketService {
  private connectedClients: Map<string, unknown> = new Map();

  broadcast(event: string, data: unknown): void {
    // Stub implementation
  }

  sendToUser(userId: string, event: string, data: unknown): void {
    // Stub implementation
  }

  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
