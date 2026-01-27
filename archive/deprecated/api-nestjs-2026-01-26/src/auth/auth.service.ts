import * as crypto from 'node:crypto';
import {
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtBlacklistService } from './jwt-blacklist.service';
import type { LoginDto, RefreshTokenDto, RegisterDto } from './dto/auth.dto';
import type { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private usersService: UsersService,
    @Inject(JwtService) private jwtService: JwtService,
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JwtBlacklistService)
    private jwtBlacklistService: JwtBlacklistService,
    @Inject(ConfigService) private configService: ConfigService,
  ) {}

  /**
   * Validates a user's credentials.
   * Performs constant-time comparison to prevent timing attacks.
   * VED-IU3: Implements account lockout after failed attempts
   * SECURITY FIX: Added constant-time delay to prevent user enumeration via timing attacks
   * @param email The user's email address
   * @param pass The plaintext password to verify
   * @returns The user object without the password hash, or null if invalid
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const startTime = Date.now();
    const TARGET_MIN_DURATION = 200; // Minimum 200ms to prevent timing attacks

    const user = await this.usersService.findOne(email);

    if (!user) {
      // Add constant delay before returning to prevent timing attacks
      await this.ensureMinimumDuration(startTime, TARGET_MIN_DURATION);
      return null;
    }

    // VED-IU3: Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account is locked due to multiple failed login attempts. Try again in ${remainingMinutes} minutes.`,
      );
    }

    // VED-IU3: Reset lockout if expired
    if (user.lockedUntil && new Date() >= user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }

    if (user && user.passwordHash) {
      const isValid = await bcrypt.compare(pass || '', user.passwordHash);
      if (isValid) {
        // VED-IU3: Reset failed attempts on successful login
        if (user.failedLoginAttempts > 0) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0 },
          });
        }

        const { passwordHash, ...result } = user;
        return result;
      }

      // VED-IU3: Increment failed attempts on invalid password
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
      const shouldLock = newFailedAttempts >= 5;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
            : null,
        },
      });

      if (shouldLock) {
        // TODO VED-IU3: Send email notification about account lockout
        throw new UnauthorizedException(
          'Account locked due to too many failed login attempts. Try again in 30 minutes.',
        );
      }
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    try {
      return await this.generateTokens(user.id, user.email, user.role);
    } catch (error) {
      throw new Error('Could not complete login process');
    }
  }

  /**
   * Generates a pair of JWT access token and opaque refresh token.
   * Hashes the refresh token before storing it in the database.
   * Tracks access token for logout-all functionality.
   * @param userId The ID of the user
   * @param email The user's email
   * @param role The user's role
   * @returns Object containing tokens and basic user info
   */
  async generateTokens(userId: string, email: string, role: string) {
    const payload = { email, sub: userId, role };

    const accessToken = this.jwtService.sign(payload);
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenValue)
      .digest('hex');

    // Save hashed refresh token to DB
    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenHash,
        userId: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Track access token for logout-all functionality
    const jwtExpiration = this.configService.get<number>(
      'JWT_EXPIRATION_SECONDS',
      3600,
    );
    await this.jwtBlacklistService.trackUserToken(
      userId,
      accessToken,
      jwtExpiration,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshTokenValue,
      userId,
      user: {
        id: userId,
        email,
        role,
      },
    };
  }

  /**
   * Refreshes the user's access token using a valid refresh token.
   * Implements token reuse detection (revokes all tokens if a revoked token is reused).
   * @param refreshTokenDto DTO containing the refresh token
   * @returns A new pair of tokens
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const tokenHash = this.hashToken(refreshTokenDto.refreshToken);

    return this.prisma.$transaction(async (tx) => {
      const storedToken = await tx.refreshToken.findUnique({
        where: { token: tokenHash },
        include: { user: true },
      });

      await this.validateStoredToken(storedToken, tx);

      // Revoke current token
      await tx.refreshToken.update({
        where: { id: storedToken?.id },
        data: { revoked: true },
      });

      return this.generateTokensWithTx(
        storedToken!.user.id,
        storedToken!.user.email,
        storedToken!.user.role,
        tx,
      );
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async validateStoredToken(
    storedToken: any,
    tx: Prisma.TransactionClient,
  ) {
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (storedToken.revoked) {
      // Token reuse detection: revoke all tokens for this user
      await tx.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async generateTokensWithTx(
    userId: string,
    email: string,
    role: string,
    tx: Prisma.TransactionClient,
    expiresIn?: string,
  ) {
    const payload = { email, sub: userId, role };

    // V-SEC-003: Fix type safety - handle optional expiresIn without type bypass
    const accessToken = expiresIn
      ? this.jwtService.sign(payload, { expiresIn: expiresIn as any })
      : this.jwtService.sign(payload);

    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = this.hashToken(refreshTokenValue);

    await tx.refreshToken.create({
      data: {
        token: refreshTokenHash,
        userId: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshTokenValue,
      userId,
      user: { id: userId, email, role },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check for existing user
    const existingUser = await this.usersService.findOne(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const { password, name, ...data } = registerDto;

    // Ensure name is in correct I18N format or default to email if not provided
    const userName = name
      ? (name as unknown as Prisma.InputJsonValue)
      : ({
          vi: registerDto.email.split('@')[0],
          en: registerDto.email.split('@')[0],
          zh: registerDto.email.split('@')[0],
        } as Prisma.InputJsonValue);

    try {
      const user = await this.usersService.create({
        ...data,
        name: userName,
        passwordHash: hashedPassword,
      });

      // Auto-login after registration
      return this.generateTokens(user.id, user.email, user.role);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  /**
   * Ensures a minimum execution duration to prevent timing attacks.
   * Adds a delay if the operation completed too quickly.
   * SECURITY: Critical for preventing user enumeration via timing analysis
   * @param startTime The timestamp when the operation started
   * @param targetDuration The minimum duration in milliseconds
   */
  private async ensureMinimumDuration(
    startTime: number,
    targetDuration: number,
  ): Promise<void> {
    const elapsed = Date.now() - startTime;
    if (elapsed < targetDuration) {
      const delay = targetDuration - elapsed;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  /**
   * Logout: Revoke the current access token
   * Blacklists the JWT access token until it expires
   * @param req The Express request object containing the JWT
   * @returns Logout success message
   */
  async logout(req: Request): Promise<{ message: string }> {
    const token = this.extractTokenFromRequest(req);
    const user = (req as any).user;

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // Decode token to get expiry time
    const decoded = this.jwtService.decode(token);
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - now;

    // Blacklist the token for remaining lifetime
    await this.jwtBlacklistService.blacklistToken(token, expiresIn);

    // Remove token from user's active tokens
    if (user?.id) {
      await this.jwtBlacklistService.removeUserToken(user.id, token);
    }

    return { message: 'Logout successful' };
  }

  /**
   * Logout All: Revoke all access tokens for a user
   * Blacklists all JWT access tokens across all devices
   * @param req The Express request object
   * @returns Logout success message
   */
  async logoutAll(req: Request): Promise<{ message: string }> {
    const user = (req as any).user;

    if (!user?.id) {
      throw new UnauthorizedException('User not found');
    }

    // Blacklist all user tokens
    await this.jwtBlacklistService.blacklistAllUserTokens(user.id);

    // Also revoke all refresh tokens in database
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });

    return { message: 'Logged out from all devices' };
  }

  /**
   * Extract JWT token from Authorization header
   * @param req The Express request object
   * @returns The JWT token string
   */
  private extractTokenFromRequest(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) return null;

    return token;
  }
}
