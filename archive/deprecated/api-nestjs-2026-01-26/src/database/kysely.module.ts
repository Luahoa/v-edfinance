import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB } from './types';

export const KYSELY_TOKEN = 'KYSELY_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: KYSELY_TOKEN,
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        const pool = new Pool({
          connectionString: databaseUrl,
          max: 10,
        });

        return new Kysely<DB>({
          dialect: new PostgresDialect({ pool }),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [KYSELY_TOKEN],
})
export class KyselyModule implements OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {}

  private kysely: Kysely<DB> | null = null;

  async onModuleDestroy() {
    if (this.kysely) {
      await this.kysely.destroy();
    }
  }
}

export type KyselyDB = Kysely<DB>;
