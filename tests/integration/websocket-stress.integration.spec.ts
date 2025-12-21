import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { SocialGateway } from '../../apps/api/src/modules/social/social.gateway';
import { beforeEach, describe, expect, it, afterEach } from 'vitest';

describe('I020: WebSocket Stress Test Integration', () => {
  let app: INestApplication;
  let gateway: SocialGateway;
  let clients: Socket[] = [];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SocialGateway],
    }).compile();

    gateway = module.get<SocialGateway>(SocialGateway);
    app = module.createNestApplication();
    await app.init();
    await app.listen(3333);
  });

  afterEach(async () => {
    for (const client of clients) {
      client.disconnect();
    }
    clients = [];
    await app.close();
  });

  it('should handle 50+ concurrent WebSocket connections', async () => {
    const connectionCount = 50;
    const startTime = Date.now();

    const connectionPromises = Array.from({ length: connectionCount }, (_, i) => {
      return new Promise<Socket>((resolve) => {
        const client = io('http://localhost:3333/social', {
          transports: ['websocket'],
        });

        client.on('connect', () => {
          clients.push(client);
          resolve(client);
        });
      });
    });

    const connectedClients = await Promise.all(connectionPromises);
    const duration = Date.now() - startTime;

    console.log(`[PERF] 50 WebSocket connections established in ${duration}ms`);
    expect(connectedClients).toHaveLength(connectionCount);
    expect(duration).toBeLessThan(3000);
  });

  it('should broadcast message to all connected clients', async () => {
    const clientCount = 20;
    const receivedMessages: number[] = [];

    const connectionPromises = Array.from({ length: clientCount }, (_, i) => {
      return new Promise<void>((resolve) => {
        const client = io('http://localhost:3333/social', {
          transports: ['websocket'],
        });

        client.on('connect', () => {
          clients.push(client);
          client.on('test_broadcast', (data) => {
            receivedMessages.push(data.clientId);
          });
          resolve();
        });
      });
    });

    await Promise.all(connectionPromises);

    await new Promise((resolve) => setTimeout(resolve, 200));

    gateway.server.emit('test_broadcast', { clientId: 1, message: 'broadcast-test' });

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(receivedMessages.length).toBeGreaterThanOrEqual(clientCount);
  });

  it('should handle room-based broadcasting correctly', async () => {
    const group1Clients: Socket[] = [];
    const group2Clients: Socket[] = [];
    const group1Messages: any[] = [];
    const group2Messages: any[] = [];

    for (let i = 0; i < 10; i++) {
      const client = io('http://localhost:3333/social', {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        client.on('connect', () => {
          clients.push(client);
          if (i < 5) {
            group1Clients.push(client);
            client.emit('join_group', 'group-1');
            client.on('group_message', (data) => group1Messages.push(data));
          } else {
            group2Clients.push(client);
            client.emit('join_group', 'group-2');
            client.on('group_message', (data) => group2Messages.push(data));
          }
          resolve();
        });
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    gateway.broadcastToGroup('group-1', 'group_message', { text: 'Hello Group 1' });
    gateway.broadcastToGroup('group-2', 'group_message', { text: 'Hello Group 2' });

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(group1Messages.length).toBeGreaterThan(0);
    expect(group2Messages.length).toBeGreaterThan(0);
    expect(group1Messages[0].text).toBe('Hello Group 1');
    expect(group2Messages[0].text).toBe('Hello Group 2');
  });

  it('should clean up ghost connections when user reconnects', async () => {
    const userId = 'reconnect-test-user';

    const client1 = io('http://localhost:3333/social', {
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      client1.on('connect', () => {
        clients.push(client1);
        client1.emit('identify', userId);
        resolve();
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const disconnectPromise = new Promise<void>((resolve) => {
      client1.on('force_disconnect', () => resolve());
    });

    const client2 = io('http://localhost:3333/social', {
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      client2.on('connect', () => {
        clients.push(client2);
        client2.emit('identify', userId);
        resolve();
      });
    });

    await disconnectPromise;

    expect(gateway.getConnectedClientsCount()).toBe(1);
  });

  it('should maintain stability under rapid connect/disconnect cycles', async () => {
    const cycles = 30;
    const startTime = Date.now();

    for (let i = 0; i < cycles; i++) {
      const client = io('http://localhost:3333/social', {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        client.on('connect', () => {
          client.disconnect();
          resolve();
        });
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[PERF] 30 connect/disconnect cycles in ${duration}ms`);
    expect(duration).toBeLessThan(5000);
  });
});
