import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DynamicConfigService implements OnModuleInit {
  private readonly logger = new Logger(DynamicConfigService.name);
  private configCache: Map<string, string> = new Map();

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const isTest =
      process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
    if (isTest) {
      this.logger.log(
        'Test environment detected - using default configurations',
      );
      return;
    }
    await this.loadConfig();
  }

  async loadConfig() {
    this.logger.log('Loading system settings from database...');
    try {
      const settings = await this.prisma.systemSettings.findMany();
      settings.forEach((setting) => {
        this.configCache.set(setting.key, setting.value);
      });
      this.logger.log(`Loaded ${settings.length} settings.`);
    } catch (error) {
      this.logger.error(
        'Failed to load system settings (Reference Error expected if DB not running)',
        error,
      );
    }
  }

  get(key: string, defaultValue?: string): string {
    return this.configCache.get(key) || defaultValue || '';
  }
}
