import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(EventEmitter2) private eventEmitter: EventEmitter2,
  ) {}

  async logEvent(
    userId: string,
    eventType: string,
    pointsEarned: number,
    metadata: { isSimulation?: boolean; [key: string]: any } = {},
  ) {
    const isSimulation = metadata.isSimulation ?? false;

    if (!isSimulation) {
      this.logger.log(
        `User ${userId} earned ${pointsEarned} points for ${eventType}`,
      );
    }

    // High-concurrency optimized updates
    const updateTask = this.prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: pointsEarned,
        },
      },
    });

    const logTask = this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: isSimulation ? 'simulation-system' : 'gamification-system',
        path: '/gamification',
        eventType,
        payload: {
          pointsEarned,
          source: 'gamification-service',
          version: '1.1',
          ...metadata,
        },
      },
    });

    // Execute core updates
    await Promise.all([updateTask, logTask]);

    // Emit event for decouple Nudge/Analytics logic
    this.eventEmitter.emit('points.earned', {
      userId,
      eventType,
      pointsEarned,
      metadata,
    });
  }

  async deductPoints(userId: string, points: number, reason: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user || user.points < points) {
      throw new Error('Insufficient points');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          decrement: points,
        },
      },
    });

    await this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: 'gamification-system',
        path: '/gamification/deduct',
        eventType: 'POINTS_DEDUCTED',
        payload: {
          pointsDeducted: points,
          reason,
        },
      },
    });

    // Emit event for analytics/nudge services
    this.eventEmitter.emit('points.deducted', {
      userId,
      pointsDeducted: points,
      reason,
    });

    return true;
  }
}
