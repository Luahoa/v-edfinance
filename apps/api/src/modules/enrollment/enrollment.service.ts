import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Handle enrollment webhook from external platform
   * Simplified version using existing schema models
   */
  async handleEnrollmentWebhook(payload: EnrollmentWebhookPayload): Promise<void> {
    this.logger.log(`Processing enrollment webhook for user: ${payload.userId}`);

    try {
      // 1. Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        this.logger.warn(`User not found: ${payload.userId}`);
        throw new Error('User not found');
      }

      // 2. Log enrollment event in BehaviorLog
      await this.prisma.behaviorLog.create({
        data: {
          userId: payload.userId,
          sessionId: payload.externalId || `enrollment-${Date.now()}`,
          path: `/courses/${payload.courseId}/enroll`,
          eventType: 'COURSE_ENROLLMENT',
          actionCategory: 'ENROLLMENT',
          payload: {
            courseId: payload.courseId,
            status: payload.status,
            enrolledAt: payload.enrolledAt || new Date(),
            externalId: payload.externalId,
          },
        },
      });

      this.logger.log(`Enrollment logged for user: ${payload.userId}`);

      // 3. Award points via gamification system
      await this.awardEnrollmentPoints(user.id, payload.courseId);

    } catch (error) {
      this.logger.error(`Enrollment webhook failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Award points for enrollment using existing GamificationPoints model
   */
  private async awardEnrollmentPoints(userId: string, courseId: string): Promise<void> {
    try {
      // TODO: Implement when gamification system is ready
      // For now, just log the event
      this.logger.log(`Points award pending for user ${userId}, course ${courseId}`);
      
      // Create behavior log for points tracking
      await this.prisma.behaviorLog.create({
        data: {
          userId,
          sessionId: `points-${Date.now()}`,
          path: '/gamification/points',
          eventType: 'POINTS_EARNED',
          actionCategory: 'GAMIFICATION',
          payload: {
            points: 50,
            reason: 'COURSE_ENROLLMENT',
            courseId,
          },
        },
      });

      this.logger.log(`Points logged for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to log points: ${error.message}`);
      // Don't throw - enrollment should succeed even if points fail
    }
  }

  /**
   * Get user's enrollment history from BehaviorLog
   */
  async getUserEnrollments(userId: string): Promise<any[]> {
    const logs = await this.prisma.behaviorLog.findMany({
      where: {
        userId,
        eventType: 'COURSE_ENROLLMENT',
      },
      orderBy: { timestamp: 'desc' },
    });

    return logs.map(log => {
      const payloadData = log.payload as any;
      return {
        id: log.id,
        courseId: payloadData?.courseId,
        status: payloadData?.status,
        enrolledAt: payloadData?.enrolledAt || log.timestamp,
        externalId: payloadData?.externalId,
      };
    });
  }

  /**
   * Check if user is enrolled (via BehaviorLog)
   */
  async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.prisma.behaviorLog.findFirst({
      where: {
        userId,
        eventType: 'COURSE_ENROLLMENT',
      },
    });

    // Check if payload contains matching courseId
    if (enrollment) {
      const payloadData = enrollment.payload as any;
      return payloadData?.courseId === courseId;
    }

    return false;
  }
}

/**
 * Enrollment webhook payload interface
 */
export interface EnrollmentWebhookPayload {
  userId: string;
  courseId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  enrolledAt?: Date;
  externalId?: string;
}

