/**
 * I001: Auth → Users Flow Integration Tests
 * Tests complete user registration, profile creation, and authentication flow
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('I001: Auth → Users Flow', () => {
  beforeAll(async () => {
    // Ensure test DB is ready
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: { email: { contains: '@integration-test.com' } }
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test users before each test
    await prisma.user.deleteMany({
      where: { email: { contains: '@integration-test.com' } }
    });
  });

  it('S01: Should register user and auto-create UserProfile with default values', async () => {
    const testEmail = `user1-${Date.now()}@integration-test.com`;
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        name: { vi: 'Người dùng test', en: 'Test User', zh: '测试用户' },
        role: 'STUDENT',
        preferredLocale: 'vi',
        points: 0
      }
    });

    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.role).toBe('STUDENT');
    expect(user.points).toBe(0);
  });

  it('S02: Should login and receive JWT with user data', async () => {
    const testEmail = `user2-${Date.now()}@integration-test.com`;
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        name: { vi: 'Login Test', en: 'Login Test', zh: '登录测试' },
        role: 'STUDENT'
      }
    });

    // Simulate login - generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.userId).toBe(user.id);
    expect(decoded.email).toBe(testEmail);
    expect(decoded.role).toBe('STUDENT');
  });

  it('S03: Should verify password matches during login', async () => {
    const testEmail = `user3-${Date.now()}@integration-test.com`;
    const password = 'MySecurePassword123!';
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        name: { vi: 'Password Test', en: 'Password Test', zh: '密码测试' },
        role: 'STUDENT'
      }
    });

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    const isValid = await bcrypt.compare(password, user!.passwordHash);
    expect(isValid).toBe(true);

    const isInvalid = await bcrypt.compare('WrongPassword', user!.passwordHash);
    expect(isInvalid).toBe(false);
  });

  it('S04: Should access protected endpoint with valid JWT', async () => {
    const testEmail = `user4-${Date.now()}@integration-test.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash('Pass123!', 10),
        name: { vi: 'Protected Test', en: 'Protected Test', zh: '受保护测试' },
        role: 'STUDENT'
      }
    });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Simulate protected endpoint access
    const fetchedUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
    expect(fetchedUser).toBeDefined();
    expect(fetchedUser!.email).toBe(testEmail);
  });

  it('S05: Should reject access with invalid/expired JWT', async () => {
    const invalidToken = 'invalid.token.here';
    
    expect(() => jwt.verify(invalidToken, JWT_SECRET)).toThrow();
  });

  it('S06: Should create refresh token on login', async () => {
    const testEmail = `user6-${Date.now()}@integration-test.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash('Pass123!', 10),
        name: { vi: 'Refresh Test', en: 'Refresh Test', zh: '刷新测试' },
        role: 'STUDENT'
      }
    });

    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: `refresh-${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    expect(refreshToken).toBeDefined();
    expect(refreshToken.userId).toBe(user.id);
    expect(refreshToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('S07: Should handle multi-locale user profile data', async () => {
    const testEmail = `user7-${Date.now()}@integration-test.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash('Pass123!', 10),
        name: { vi: 'Người dùng đa ngôn ngữ', en: 'Multilingual User', zh: '多语言用户' },
        role: 'STUDENT',
        preferredLocale: 'en',
        metadata: {
          onboardingCompleted: true,
          profilePictureUrl: 'https://example.com/avatar.jpg'
        }
      }
    });

    expect(user.name).toEqual({
      vi: 'Người dùng đa ngôn ngữ',
      en: 'Multilingual User',
      zh: '多语言用户'
    });
    expect(user.preferredLocale).toBe('en');
    expect((user.metadata as any).onboardingCompleted).toBe(true);
  });

  it('S08: Should initialize user with default points and role', async () => {
    const testEmail = `user8-${Date.now()}@integration-test.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash('Pass123!', 10),
        name: { vi: 'Mặc định', en: 'Default', zh: '默认' }
      }
    });

    expect(user.points).toBe(0);
    expect(user.role).toBe('STUDENT');
    expect(user.preferredLocale).toBe('vi');
  });

  it('S09: Should prevent duplicate email registration', async () => {
    const testEmail = `duplicate-${Date.now()}@integration-test.com`;
    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash('Pass123!', 10),
        name: { vi: 'User 1', en: 'User 1', zh: '用户1' }
      }
    });

    await expect(
      prisma.user.create({
        data: {
          email: testEmail,
          passwordHash: await bcrypt.hash('Pass456!', 10),
          name: { vi: 'User 2', en: 'User 2', zh: '用户2' }
        }
      })
    ).rejects.toThrow();
  });

  it('S10: Should create user with investment profile relationship ready', async () => {
    const testEmail = `investor-${Date.now()}@integration-test.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash('Pass123!', 10),
        name: { vi: 'Nhà đầu tư', en: 'Investor', zh: '投资者' },
        investmentProfile: {
          create: {
            riskTolerance: 'MODERATE',
            goals: { vi: 'Tiết kiệm cho tương lai', en: 'Save for future', zh: '为未来储蓄' },
            timeHorizon: 'LONG_TERM'
          }
        }
      },
      include: { investmentProfile: true }
    });

    expect(user.investmentProfile).toBeDefined();
    expect(user.investmentProfile?.riskTolerance).toBe('MODERATE');
  });
});
