import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { RedisCacheModule } from '../common/redis-cache.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtBlacklistService } from './jwt-blacklist.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    PrismaModule,
    RedisCacheModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService?.get
          ? configService.get<string>('JWT_SECRET')
          : process.env.JWT_SECRET;

        // V-SEC-001: Fail fast if JWT_SECRET is missing - no fallback to insecure default
        if (!secret) {
          throw new Error(
            'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required. ' +
              'Application cannot start without a secure JWT secret.',
          );
        }

        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtBlacklistService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, JwtBlacklistService],
})
export class AuthModule {}
