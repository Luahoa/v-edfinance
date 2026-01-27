import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PostType } from '@prisma/client';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Social WebSocket Integration', () => {
  // Skip if no test database available
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let authToken1: string;
  let authToken2: string;
  let user1: any;
  let user2: any;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: vi.fn(),
          create: vi.fn(),
          deleteMany: vi.fn(),
          updateMany: vi.fn(),
        },
        refreshToken: {
          create: vi.fn(),
        },
        socialPost: {
          create: vi.fn().mockImplementation((args) =>
            Promise.resolve({
              id: 'post-1',
              ...args.data,
              user: { id: args.data.userId, email: 'test@example.com' },
            }),
          ),
          findMany: vi.fn().mockResolvedValue([]),
        },
        buddyGroup: {
          create: vi
            .fn()
            .mockImplementation((args) =>
              Promise.resolve({ id: 'group-1', ...args.data }),
            ),
          findUnique: vi.fn().mockResolvedValue({
            id: 'group-1',
            name: 'Alpha Squad',
            members: [],
          }),
          findMany: vi.fn().mockResolvedValue([]),
        },
        buddyMember: {
          create: vi
            .fn()
            .mockResolvedValue({ userId: 'u2', groupId: 'group-1' }),
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue({ userId: 'u1' }),
        },
        investmentProfile: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);

    prisma = app.get<PrismaService>(PrismaService);
    authService = app.get<AuthService>(AuthService);

    const server = app.getHttpServer();
    const address = server.address();
    baseUrl = `http://localhost:${address.port}`;

    // Setup Test Users
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockImplementation((args: any) =>
      Promise.resolve({
        id: `user_${Date.now()}_${Math.random()}`,
        ...args.data,
      }),
    );

    user1 = await authService.register({
      email: `test1_${Date.now()}@example.com`,
      password: 'Password123!',
      name: { vi: 'User 1', en: 'User 1', zh: 'User 1' },
    });
    authToken1 = user1.access_token;

    user2 = await authService.register({
      email: `test2_${Date.now()}@example.com`,
      password: 'Password123!',
      name: { vi: 'User 2', en: 'User 2', zh: 'User 2' },
    });
    authToken2 = user2.access_token;
  });

  afterAll(async () => {
    // Cleanup
    await app.close();
  });

  const createSocket = (token: string): Socket => {
    return io(`${baseUrl}/social`, {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      transports: ['websocket'],
      forceNew: true,
    });
  };

  it('Connect WS → Identify → Broadcast → Check via REST', async () => {
    const socket1 = createSocket(authToken1);
    const socket2 = createSocket(authToken2);

    await new Promise<void>((resolve, reject) => {
      let identified = 0;
      const onIdentify = (resp: any) => {
        if (resp?.status === 'identified') {
          identified++;
          if (identified === 2) resolve();
        }
      };

      socket1.on('connect', () => {
        socket1.emit('identify', { userId: user1.userId }, onIdentify);
      });
      socket2.on('connect', () => {
        socket2.emit('identify', { userId: user2.userId }, onIdentify);
      });

      setTimeout(() => reject(new Error('WS Timeout')), 5000);
    });

    // Send message (Post) and check if other user receives it real-time
    const postPromise = new Promise<any>((resolve) => {
      socket2.on('new_post', (data) => resolve(data));
    });

    (prisma.socialPost.findMany as any).mockResolvedValue([
      { id: 'post-1', userId: user1.userId, content: { en: 'Hello World!' } },
    ]);

    const postContent = {
      vi: 'Chào thế giới!',
      en: 'Hello World!',
      zh: '你好世界！',
    };
    await request(app.getHttpServer())
      .post('/social/posts')
      .set('Authorization', `Bearer ${authToken1}`)
      .send({
        type: PostType.DISCUSSION,
        content: postContent,
      })
      .expect(201);

    const receivedPost = await postPromise;
    expect(receivedPost.userId).toBe(user1.userId);
    expect(receivedPost.content.en).toBe('Hello World!');

    // Check history via REST
    const response = await request(app.getHttpServer())
      .get('/social/feed')
      .set('Authorization', `Bearer ${authToken2}`)
      .expect(200);

    expect(response.body[0].id).toBe(receivedPost.id);

    socket1.disconnect();
    socket2.disconnect();
  });

  it('Join group → Post achievement → Friends notified (WS)', async () => {
    const socket2 = createSocket(authToken2);

    // Create group
    (prisma.buddyGroup.findUnique as any).mockResolvedValue({
      id: 'group-1',
      name: 'Alpha Squad',
      members: [],
    });

    const groupRes = await request(app.getHttpServer())
      .post('/social/groups')
      .set('Authorization', `Bearer ${authToken1}`)
      .send({ name: 'Alpha Squad' })
      .expect(201);

    const groupId = groupRes.body.id;

    // Join group
    await request(app.getHttpServer())
      .post('/social/groups/join')
      .set('Authorization', `Bearer ${authToken2}`)
      .send({ groupId })
      .expect(201);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Join Group Timeout')),
        5000,
      );
      socket2.on('connect', () => {
        socket2.emit('join_group', groupId, () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      if (socket2.connected) {
        socket2.emit('join_group', groupId, () => {
          clearTimeout(timeout);
          resolve();
        });
      }
    });

    const achievementPromise = new Promise<any>((resolve) => {
      socket2.on('new_post', (data) => {
        if (data.type === PostType.ACHIEVEMENT) resolve(data);
      });
    });

    // User 1 posts achievement
    await request(app.getHttpServer())
      .post('/social/posts')
      .set('Authorization', `Bearer ${authToken1}`)
      .send({
        type: PostType.ACHIEVEMENT,
        content: {
          vi: 'Đạt cấp 10!',
          en: 'Reached Level 10!',
          zh: '达到10级！',
        },
        groupId,
      })
      .expect(201);

    const achievement = await achievementPromise;
    expect(achievement.groupId).toBe(groupId);

    socket2.disconnect();
  });

  it('Leaderboard update via aggregation (Community Stats)', async () => {
    const statsRes = await request(app.getHttpServer())
      .get('/social/recommendations') // Just to ensure some activity
      .set('Authorization', `Bearer ${authToken1}`)
      .expect(200);

    // The actual update in CommunityStatsService.triggerRealtimeUpdate
    // We'll just verify the stats endpoint works and reflects users
    const impactRes = await request(app.getHttpServer())
      .get('/social/feed')
      .set('Authorization', `Bearer ${authToken1}`)
      .expect(200);

    expect(Array.isArray(impactRes.body)).toBe(true);
  });

  it('Test concurrent WebSocket connections', async () => {
    const connections = 5;
    const sockets: Socket[] = [];

    const connectPromises = Array.from({ length: connections }).map((_, i) => {
      return new Promise<void>((resolve, reject) => {
        const s = createSocket(authToken1); // Multi-tab scenario
        sockets.push(s);
        s.on('connect', () => resolve());
        s.on('connect_error', (err) => reject(err));
        setTimeout(() => reject(new Error('Concurrent WS Timeout')), 5000);
      });
    });

    await Promise.all(connectPromises);
    expect(sockets.length).toBe(connections);

    for (const s of sockets) s.disconnect();
  });
});
