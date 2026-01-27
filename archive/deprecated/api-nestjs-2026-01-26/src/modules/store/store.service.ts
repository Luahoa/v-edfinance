import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoreService {
  private readonly STREAK_FREEZE_PRICE = 500;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async buyStreakFreeze(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });

      if (!user || user.points < this.STREAK_FREEZE_PRICE) {
        throw new BadRequestException('Insufficient points');
      }

      this.eventEmitter.emit('points.deduct', {
        userId,
        points: this.STREAK_FREEZE_PRICE,
        reason: 'PURCHASE_STREAK_FREEZE',
      });

      return this.prisma.userStreak.update({
        where: { userId },
        data: {
          freezesRemaining: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async getStoreItems() {
    return await Promise.resolve([
      {
        id: 'streak-freeze',
        name: {
          vi: 'Đóng băng chuỗi',
          en: 'Streak Freeze',
          zh: '连胜冻结',
        },
        description: {
          vi: 'Giữ cho chuỗi ngày học của bạn không bị mất nếu bạn lỡ một ngày.',
          en: 'Keep your streak alive even if you miss a day.',
          zh: '即使您错过一天，也可以保持连胜。',
        },
        price: this.STREAK_FREEZE_PRICE,
        type: 'STREAK_FREEZE',
      },
    ]);
  }
}
