import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isTest =
          process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
        if (isTest) {
          return {
            store: 'memory',
            ttl: 3600,
          };
        }
        return {
          store: redisStore,
          host:
            (configService?.get
              ? configService.get('REDIS_HOST')
              : process.env.REDIS_HOST) || 'localhost',
          port:
            (configService?.get
              ? configService.get('REDIS_PORT')
              : process.env.REDIS_PORT) || 6379,
          ttl: Number(
            (configService?.get
              ? configService.get('REDIS_TTL')
              : process.env.REDIS_TTL) || 3600,
          ),
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
