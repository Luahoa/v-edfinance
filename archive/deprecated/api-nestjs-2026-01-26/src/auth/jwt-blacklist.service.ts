import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';

/**
 * JWT Blacklist Service
 *
 * Manages a Redis-based blacklist for revoked JWT access tokens.
 * Uses token TTL matching JWT expiry to auto-cleanup.
 */
@Injectable()
export class JwtBlacklistService {
  private readonly BLACKLIST_PREFIX = 'jwt:blacklist:';
  private readonly USER_TOKENS_PREFIX = 'jwt:user:';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  /**
   * Add a token to the blacklist
   * @param token The JWT token to blacklist
   * @param expiresInSeconds TTL in seconds (should match token expiry)
   */
  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    const key = this.BLACKLIST_PREFIX + token;
    await this.cacheManager.set(key, 'revoked', expiresInSeconds * 1000);
  }

  /**
   * Check if a token is blacklisted
   * @param token The JWT token to check
   * @returns true if blacklisted, false otherwise
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = this.BLACKLIST_PREFIX + token;
    const result = await this.cacheManager.get(key);
    return result === 'revoked';
  }

  /**
   * Track a token for a user (for logout-all functionality)
   * @param userId User ID
   * @param token The JWT token
   * @param expiresInSeconds TTL in seconds
   */
  async trackUserToken(
    userId: string,
    token: string,
    expiresInSeconds: number,
  ): Promise<void> {
    const key = this.USER_TOKENS_PREFIX + userId;
    const tokens = await this.getUserTokens(userId);
    tokens.push(token);
    await this.cacheManager.set(
      key,
      JSON.stringify(tokens),
      expiresInSeconds * 1000,
    );
  }

  /**
   * Get all active tokens for a user
   * @param userId User ID
   * @returns Array of token strings
   */
  async getUserTokens(userId: string): Promise<string[]> {
    const key = this.USER_TOKENS_PREFIX + userId;
    const result = await this.cacheManager.get<string>(key);
    return result ? JSON.parse(result) : [];
  }

  /**
   * Blacklist all tokens for a user (logout-all)
   * @param userId User ID
   */
  async blacklistAllUserTokens(userId: string): Promise<void> {
    const tokens = await this.getUserTokens(userId);
    const ttl = this.configService.get<number>('JWT_EXPIRATION_SECONDS', 3600);

    for (const token of tokens) {
      await this.blacklistToken(token, ttl);
    }

    // Clear user token tracking
    const key = this.USER_TOKENS_PREFIX + userId;
    await this.cacheManager.del(key);
  }

  /**
   * Clear a specific token from user's tracking
   * @param userId User ID
   * @param token Token to remove
   */
  async removeUserToken(userId: string, token: string): Promise<void> {
    const tokens = await this.getUserTokens(userId);
    const filteredTokens = tokens.filter((t) => t !== token);
    const key = this.USER_TOKENS_PREFIX + userId;
    const ttl = this.configService.get<number>('JWT_EXPIRATION_SECONDS', 3600);
    await this.cacheManager.set(
      key,
      JSON.stringify(filteredTokens),
      ttl * 1000,
    );
  }
}
