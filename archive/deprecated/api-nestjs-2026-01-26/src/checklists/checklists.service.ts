import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChecklistsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, title: string, category: string, items: any[]) {
    return this.prisma.userChecklist.create({
      data: {
        userId,
        title,
        category,
        items,
        progress: 0,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.userChecklist.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateItem(
    userId: string,
    checklistId: string,
    itemIndex: number,
    completed: boolean,
  ) {
    const checklist = await this.prisma.userChecklist.findUnique({
      where: { id: checklistId },
    });

    if (!checklist || checklist.userId !== userId) {
      throw new NotFoundException('Checklist not found');
    }

    const items = checklist.items as any[];
    if (items[itemIndex]) {
      items[itemIndex].completed = completed;
      items[itemIndex].completedAt = completed ? new Date() : null;
    }

    // Recalculate progress
    const completedCount = items.filter((item) => item.completed).length;
    const progress = Math.round((completedCount / items.length) * 100);

    const updated = await this.prisma.userChecklist.update({
      where: { id: checklistId },
      data: { items, progress },
    });

    // Reward Logic: If 100% completed for the first time
    if (progress === 100 && checklist.progress < 100) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { points: { increment: 50 } }, // Reward 50 points
      });

      this.eventEmitter.emit('points.earned', {
        userId,
        eventType: 'CHECKLIST_COMPLETED',
        pointsEarned: 50,
        metadata: { checklistId },
      });

      await this.prisma.userAchievement.create({
        data: {
          userId,
          type: 'MILESTONE',
          name: {
            vi: `Hoàn thành: ${checklist.title}`,
            en: `Completed: ${checklist.title}`,
          },
          description: {
            vi: 'Bạn đã hoàn thành checklist xuất sắc!',
            en: 'You finished the checklist perfectly!',
          },
          iconKey: 'achievements/checklist-done.png',
        },
      });
    }

    return {
      checklist: updated,
      rewarded: progress === 100 && checklist.progress < 100,
      message: completed
        ? 'Tuyệt vời! Bạn đang tiến gần hơn tới mục tiêu.'
        : 'Đừng bỏ cuộc, hãy tiếp tục cố gắng!',
    };
  }
}
