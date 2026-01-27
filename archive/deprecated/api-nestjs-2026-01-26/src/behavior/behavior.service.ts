import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { LogEventDto } from './dto/log-event.dto';

@Injectable()
export class BehaviorService {
  constructor(private prisma: PrismaService) {}

  async logEvent(userId: string | undefined, dto: LogEventDto) {
    return this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: dto.sessionId,
        path: dto.path,
        eventType: dto.eventType,
        actionCategory: dto.actionCategory || 'GENERAL',
        duration: dto.duration || 0,
        deviceInfo: dto.deviceInfo as Prisma.InputJsonValue,
        payload: dto.payload as Prisma.InputJsonValue,
      },
    });
  }

  async getUserBehaviors(userId: string) {
    return this.prisma.behaviorLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
