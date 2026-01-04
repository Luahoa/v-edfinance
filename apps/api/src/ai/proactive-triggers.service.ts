import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NudgeEngineService } from '../modules/nudge/nudge-engine.service';

@Injectable()
export class ProactiveTriggersService {
  private readonly logger = new Logger(ProactiveTriggersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nudgeEngine: NudgeEngineService,
  ) {}

  /**
   * Check for users with at-risk streaks every 4 hours
   * TODO: Implement after UserStreak tracking is complete
   * Blocked by: Need to track lastActivityAt in UserStreak model
   */
  // @Cron('0 */4 * * *') // Every 4 hours at :00 - DISABLED
  async checkStreaksAtRisk() {
    this.logger.log('🔍 Checking for at-risk streaks... (DISABLED - Feature not implemented)');
    
    // FIXME: User model does not have lastLoginAt or streak fields
    // Schema has UserStreak relation instead - need to:
    // 1. Query user.streaks.lastActivityAt instead of user.lastLoginAt
    // 2. Query user.streaks.count instead of user.streak
    // 3. Add sessionId and path to BehaviorLog.create()
    
    /* ORIGINAL CODE - DISABLED UNTIL STREAK TRACKING IMPLEMENTED
    const now = new Date();
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

    const usersAtRisk = await this.prisma.user.findMany({
      where: {
        streaks: {
          lastActivityAt: { lt: twentyHoursAgo },
          count: { gte: 3 },
        },
      },
      include: {
        streaks: true,
      },
      take: 100,
    });

    this.logger.log(`Found ${usersAtRisk.length} users at risk`);

    for (const user of usersAtRisk) {
      const hoursLeft =
        24 - (now.getTime() - user.streaks.lastActivityAt.getTime()) / (1000 * 60 * 60);

      if (hoursLeft < 6 && hoursLeft > 0) {
        const nudge = await this.nudgeEngine.generateNudge(
          user.id,
          'STREAK_WARNING',
          {
            streak: user.streaks.count,
            hoursLeft: Math.floor(hoursLeft),
          },
        );

        if (nudge) {
          this.logger.log(
            `📲 Sending streak alert to ${user.email} (${hoursLeft.toFixed(1)}h left)`,
          );

          await this.prisma.behaviorLog.create({
            data: {
              userId: user.id,
              sessionId: 'system-cron',
              path: '/proactive/streak-warning',
              eventType: 'PROACTIVE_NUDGE_SENT',
              actionCategory: 'ENGAGEMENT',
              payload: {
                nudgeType: nudge.type,
                hoursLeft: Math.floor(hoursLeft),
                message: nudge.message[user.preferredLocale || 'vi'],
              },
            },
          });
        }
      }
    }
    */
  }

  /**
   * Check for unfinished courses daily at 9 AM
   */
  @Cron('0 9 * * *') // Daily at 9:00 AM
  async checkUnfinishedCourses() {
    this.logger.log('📚 Checking for unfinished courses...');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // FIXED: courseProgress → userProgress (model was renamed in schema)
    const almostDone = await this.prisma.userProgress.findMany({
      where: {
        progress: { gte: 80, lt: 100 },
        updatedAt: { lt: sevenDaysAgo },
      },
      include: {
        user: { 
          select: { 
            id: true, 
            email: true, 
            preferredLocale: true  // FIXED: locale → preferredLocale
          } 
        },
        course: { select: { id: true, title: true } },
      },
      take: 50,
    });

    this.logger.log(`Found ${almostDone.length} unfinished courses`);

    for (const cp of almostDone) {
      const nudge = await this.nudgeEngine.generateNudge(
        cp.user.id,
        'COURSE_COMPLETION',
        {
          courseTitle: cp.course.title,
          progress: cp.progress,
        },
      );

      if (nudge) {
        this.logger.log(`📲 Sending course reminder to ${cp.user.email}`);

        // FIXED: Added required sessionId and path fields
        await this.prisma.behaviorLog.create({
          data: {
            userId: cp.user.id,
            sessionId: 'system-cron',  // System-generated session
            path: '/proactive/course-completion',  // Virtual path for tracking
            eventType: 'PROACTIVE_NUDGE_SENT',
            actionCategory: 'LEARNING',
            payload: {
              courseId: cp.course.id,
              progress: cp.progress,
              message: nudge.message[cp.user.preferredLocale || 'vi'],  // FIXED: locale → preferredLocale
            },
          },
        });
      }
    }
  }
}
