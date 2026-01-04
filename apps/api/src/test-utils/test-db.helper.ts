/**
 * Test Database Helper
 *
 * Provides a mock PrismaService for integration tests to avoid database connection errors.
 * Replace PrismaModule imports with this helper in integration tests.
 *
 * Usage:
 * ```ts
 * import { getMockPrismaProvider } from '../src/test-utils/test-db.helper';
 *
 * const module = await Test.createTestingModule({
 *   imports: [YourModule],
 *   providers: [getMockPrismaProvider()],
 * }).compile();
 * ```
 */

import { Provider } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from './prisma-mock.helper';

/**
 * Returns a provider configuration that mocks PrismaService
 * Use this instead of importing PrismaModule in integration tests
 */
export function getMockPrismaProvider(): Provider {
  return {
    provide: PrismaService,
    useValue: createMockPrismaService(),
  };
}

/**
 * For tests that need to access the mock instance
 */
export function createTestPrismaService() {
  return createMockPrismaService();
}
