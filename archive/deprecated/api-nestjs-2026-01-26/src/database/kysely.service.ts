import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { KYSELY_TOKEN } from './kysely.module';
import type { KyselyDB } from './kysely.module';

@Injectable()
export class KyselyService {
  constructor(
    @Inject(KYSELY_TOKEN)
    private readonly db: KyselyDB,
  ) {}

  get query(): KyselyDB {
    return this.db;
  }

  async executeRaw<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.db.executeQuery<T>({
      query: {
        sql,
        parameters: params ?? [],
      },
      queryId: `raw-${Date.now()}`,
    } as any);
    return result.rows;
  }
}
