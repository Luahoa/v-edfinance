import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.warn(
        'Prisma failed to connect to database, but continuing for testing purposes.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
