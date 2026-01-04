import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtBlacklistService } from './jwt-blacklist.service';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private jwtBlacklistService: JwtBlacklistService,
  ) {
    const secret = configService?.get
      ? configService.get<string>('JWT_SECRET')
      : process.env.JWT_SECRET;

    // V-SEC-001: Fail fast if JWT_SECRET is missing - no fallback to insecure default
    if (!secret) {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required. ' +
          'Application cannot start without a secure JWT secret. ' +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true, // Pass request to validate method
    });
  }

  async validate(req: Request, payload: any) {
    // Extract token from Authorization header
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // Check if token is blacklisted
    const isBlacklisted =
      await this.jwtBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
