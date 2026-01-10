import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SocialGateway } from './social.gateway';
import { WsJwtGuard } from '../../auth/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';

describe('SocialGateway', () => {
  let gateway: SocialGateway;
  let server: Server;
  let client: Socket;

  const mockJwtService = {
    verifyAsync: vi.fn(),
  };

  const mockServer = {
    emit: vi.fn(),
    to: vi.fn().mockReturnThis(),
  };

  const mockClient = {
    id: 'socket-id',
    emit: vi.fn(),
    join: vi.fn(),
    rooms: new Set(['socket-id']),
    handshake: {
      headers: {
        authorization: 'Bearer valid-token',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialGateway,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideGuard(WsJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    gateway = module.get<SocialGateway>(SocialGateway);
    server = mockServer as unknown as Server;
    client = mockClient as unknown as Socket;
    gateway.server = server;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should emit connection_established event', () => {
      gateway.handleConnection(client);
      expect(client.emit).toHaveBeenCalledWith(
        'connection_established',
        expect.any(Object),
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up connectedClients and emit user_offline if client was identified', () => {
      // Setup: identify a user first
      gateway.handleIdentify(client, 'user-1');

      gateway.handleDisconnect(client);

      expect(gateway.getConnectedClientsCount()).toBe(0);
      expect(server.emit).toHaveBeenCalledWith('user_offline', {
        userId: 'user-1',
      });
    });

    it('should do nothing if client was not identified', () => {
      gateway.handleDisconnect(client);
      expect(server.emit).not.toHaveBeenCalledWith(
        'user_offline',
        expect.any(Object),
      );
    });
  });

  describe('handleIdentify', () => {
    it('should map userId to socketId and join user room', () => {
      const result = gateway.handleIdentify(client, 'user-1');

      expect(gateway.getConnectedClientsCount()).toBe(1);
      expect(client.join).toHaveBeenCalledWith('user_user-1');
      expect(server.emit).toHaveBeenCalledWith('user_online', {
        userId: 'user-1',
      });
      expect(result.status).toBe('identified');
    });

    it('should force disconnect previous connection if same userId connects again', () => {
      const oldClient = {
        ...mockClient,
        id: 'old-socket-id',
      } as unknown as Socket;
      gateway.handleIdentify(oldClient, 'user-1');

      gateway.handleIdentify(client, 'user-1');

      expect(server.to).toHaveBeenCalledWith('old-socket-id');
      expect(mockServer.emit).toHaveBeenCalledWith('force_disconnect', {
        reason: 'new_connection',
      });
    });
  });

  describe('handleJoinGroup', () => {
    it('should join group room', () => {
      const result = gateway.handleJoinGroup(client, 'group-1');

      expect(client.join).toHaveBeenCalledWith('group_group-1');
      expect(result.status).toBe('joined');
      expect(result.group).toBe('group-1');
    });
  });

  describe('Broadcasting methods', () => {
    it('sendToUser should emit to user room', () => {
      gateway.sendToUser('user-1', 'event-name', { foo: 'bar' });
      expect(server.to).toHaveBeenCalledWith('user_user-1');
      expect(mockServer.emit).toHaveBeenCalledWith('event-name', {
        foo: 'bar',
      });
    });

    it('broadcastToGroup should emit to group room', () => {
      gateway.broadcastToGroup('group-1', 'event-name', { foo: 'bar' });
      expect(server.to).toHaveBeenCalledWith('group_group-1');
      expect(mockServer.emit).toHaveBeenCalledWith('event-name', {
        foo: 'bar',
      });
    });

    it('broadcastNewPost should emit to all', () => {
      gateway.broadcastNewPost({ id: 1 });
      expect(server.emit).toHaveBeenCalledWith('new_post', { id: 1 });
    });
  });
});
