import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type Socket, io } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AiService } from '../src/ai/ai.service';
import { DiagnosticService } from '../src/modules/debug/diagnostic.service';
import { SocialGateway } from '../src/modules/social/social.gateway';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Social Stress Test (1000+ Connections Simulation)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const clients: Socket[] = [];
  const MAX_CLIENTS = 500; // Tăng lên 500 để tận dụng môi trường Docker/E2B

  beforeAll(async () => {
    const { Test } = await import('@nestjs/testing');
    const module = await Test.createTestingModule({
      providers: [
        SocialGateway,
        PrismaService,
        DiagnosticService,
        { provide: AiService, useValue: {} },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: vi.fn().mockResolvedValue({ sub: 'test-user-id' }),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    await app.listen(0); // Use random free port
    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? address : address.port;
    prisma = module.get<PrismaService>(PrismaService);
  });

  it(`Nên xử lý thành công ${MAX_CLIENTS} kết nối WebSocket đồng thời`, async () => {
    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? address : address.port;
    console.log(`🚀 Đang khởi tạo ${MAX_CLIENTS} kết nối trên port ${port}...`);

    const connectClient = () => {
      return new Promise((resolve) => {
        const socket = io(`http://localhost:${port}/social`, {
          transports: ['websocket'],
          forceNew: true,
          reconnection: false,
        });
        socket.on('connect', () => {
          clients.push(socket);
          resolve(true);
        });
      });
    };

    // Chạy tuần tự theo nhóm để tránh nghẽn local port/CPU
    const BATCH_SIZE = 50;
    for (let i = 0; i < MAX_CLIENTS; i += BATCH_SIZE) {
      const connections = Array.from({
        length: Math.min(BATCH_SIZE, MAX_CLIENTS - i),
      }).map(() => connectClient());
      await Promise.all(connections);
    }

    console.log(`✅ Đã kết nối ${clients.length} clients.`);
    expect(clients.length).toBe(MAX_CLIENTS);

    // Broadcast Stress Test
    console.log('📢 Testing Broadcast latency...');
    const startTime = Date.now();

    const gateway = app.get<SocialGateway>(SocialGateway);
    gateway.server.emit('market_update', { symbol: 'BTC', price: 100000 });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Broadcast duration: ${duration}ms`);
    expect(duration).toBeLessThan(1000); // Tăng lên 1s cho 500 clients local
  }, 60000);

  afterAll(async () => {
    clients.forEach((s) => s.disconnect());
    await app.close();
  });
});
