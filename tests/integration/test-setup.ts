import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';

export interface IntegrationTestContext {
  app: INestApplication;
  prisma: PrismaService;
  moduleRef: TestingModule;
}

export async function setupIntegrationTest(
  moduleBuilderFn: () => Promise<TestingModule>
): Promise<IntegrationTestContext> {
  const moduleRef = await moduleBuilderFn();
  const app = moduleRef.createNestApplication();
  await app.init();

  const prisma = moduleRef.get<PrismaService>(PrismaService);

  return { app, prisma, moduleRef };
}

export async function cleanupIntegrationTest(context: IntegrationTestContext): Promise<void> {
  await context.prisma.$disconnect();
  await context.app.close();
}

export async function withTransaction<T>(
  prisma: PrismaService,
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    const result = await callback(tx);
    throw new Error('ROLLBACK'); // Force rollback for testing
  }).catch((error) => {
    if (error.message === 'ROLLBACK') {
      return undefined as T; // Return undefined to indicate rollback
    }
    throw error;
  });
}

export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

export function generateTestUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
