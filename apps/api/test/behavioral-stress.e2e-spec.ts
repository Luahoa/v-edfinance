import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagnosticService } from '../src/modules/debug/diagnostic.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * PHƯƠNG ÁN 2: BEHAVIORAL STRESS TEST (Simulation Bot)
 * Dựa trên cấu trúc của apps/api/src/modules/analytics/simulation-bot.spec.ts
 * Nhưng thực hiện test tích hợp với DiagnosticService để verify Mock Data Generation.
 */
describe.skip('PHƯƠNG ÁN 2: Behavioral Stress Test (E2B Inspired) [REQUIRES_DB]', () => {
  let diagnosticService: DiagnosticService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    prismaService = new PrismaService();
    const mockAiService: any = {
      generateResponse: vi.fn(),
      createThread: vi.fn(),
    };
    const mockSocialGateway: any = { connectedClients: new Map() };

    diagnosticService = new DiagnosticService(
      prismaService,
      mockAiService,
      mockSocialGateway,
    );
  });

  it('Nên giả lập thành công 50 hành vi người dùng mà không có lỗi schema', async () => {
    const userId = 'stress-test-user-001';
    const eventCount = 50;

    // Đảm bảo user tồn tại để tránh vi phạm Foreign Key
    // Lưu ý: Field 'name' không có trong User model, thay vào đó là JSONB 'metadata'
    await prismaService.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: 'stress@test.com',
        passwordHash: 'mock-password-hash',
        metadata: { displayName: 'Stress Test User' },
        role: 'STUDENT',
      },
    });

    // Cleanup logs cũ
    await prismaService.behaviorLog
      .deleteMany({ where: { userId } })
      .catch(() => {});

    console.log(`🚀 Đang giả lập ${eventCount} events cho user ${userId}...`);
    const logs = await diagnosticService.generateMockBehavioralData(
      userId,
      eventCount,
    );

    expect(logs.length).toBe(eventCount);
    expect(logs[0]).toHaveProperty('eventType');
    expect(logs[0].payload).toHaveProperty('isMock', true);

    // Verify trong DB
    const dbCount = await prismaService.behaviorLog.count({
      where: { userId },
    });
    expect(dbCount).toBe(eventCount);

    console.log(
      '✅ Giả lập hành vi thành công. Dữ liệu nhất quán với JSONB schema.',
    );
  });
});
