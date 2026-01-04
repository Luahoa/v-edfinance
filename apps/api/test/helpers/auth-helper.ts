import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import type { ExecutionContext } from '@nestjs/common';

/**
 * JWT payload structure for test tokens.
 */
export interface TestJwtPayload {
  email: string;
  sub: string;
  role: Role;
}

/**
 * Generate a JWT token for testing.
 * Uses the same secret as the app (from env or default).
 * @param userId User ID to include in token
 * @param role User role (defaults to STUDENT)
 * @param email User email (defaults to generated email)
 * @returns JWT access token string
 */
export function generateJwtToken(
  userId: string,
  role: Role = Role.STUDENT,
  email = `test-${userId}@example.com`,
): string {
  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET || 'test-secret-key-change-in-production',
  });

  const payload: TestJwtPayload = {
    email,
    sub: userId,
    role,
  };

  return jwtService.sign(payload, { expiresIn: '1h' });
}

/**
 * Create a mock authentication guard that always allows access.
 * Use this to bypass authentication in integration tests.
 * @returns Mock guard implementation
 */
export function createMockAuthGuard() {
  return {
    canActivate: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      // Attach a default test user to the request
      request.user = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: Role.STUDENT,
      };
      return true;
    },
  };
}

/**
 * Create a mock authentication guard with a specific user.
 * @param userId User ID to attach to requests
 * @param role User role
 * @param email User email
 * @returns Mock guard implementation
 */
export function createMockAuthGuardWithUser(
  userId: string,
  role: Role = Role.STUDENT,
  email = `test-${userId}@example.com`,
) {
  return {
    canActivate: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = {
        userId,
        email,
        role,
      };
      return true;
    },
  };
}

/**
 * Create authorization header with Bearer token.
 * @param token JWT token
 * @returns Object with Authorization header
 */
export function authHeader(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Generate a complete auth header for a test user.
 * @param userId User ID
 * @param role User role
 * @param email User email
 * @returns Object with Authorization header
 */
export function generateAuthHeader(
  userId: string,
  role: Role = Role.STUDENT,
  email?: string,
): { Authorization: string } {
  const token = generateJwtToken(userId, role, email);
  return authHeader(token);
}

/**
 * Decode a JWT token without verification (for testing only).
 * @param token JWT token string
 * @returns Decoded payload
 */
export function decodeTestToken(token: string): TestJwtPayload {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    Buffer.from(base64, 'base64')
      .toString()
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(''),
  );
  return JSON.parse(jsonPayload);
}
