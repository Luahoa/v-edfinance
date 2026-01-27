import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Kysely, sql } from 'kysely';
import { KYSELY_TOKEN } from '../database/kysely.module';
import type { DB } from '../database/types';

@Injectable()
export class AnalyticsRepository {
  constructor(
    @Inject(KYSELY_TOKEN) private readonly db: Kysely<DB>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getDailyActiveUsers(days: number = 30) {
    return this.db
      .selectFrom('BehaviorLog')
      .select([
        sql<string>`DATE("timestamp")`.as('date'),
        sql<number>`COUNT(DISTINCT "userId")`.as('dau'),
        sql<number>`COUNT(DISTINCT "sessionId")`.as('sessions'),
        sql<number>`AVG("duration")`.as('avgSessionDuration'),
      ])
      .where(
        'timestamp',
        '>=',
        sql<Date>`NOW() - INTERVAL '${sql.raw(String(days))} days'`,
      )
      .where('userId', 'is not', null)
      .groupBy(sql`DATE("timestamp")`)
      .orderBy('date', 'desc')
      .execute();
  }

  async getMonthlyActiveUsers(months: number = 12) {
    return this.db
      .selectFrom('BehaviorLog')
      .select([
        sql<string>`TO_CHAR("timestamp", 'YYYY-MM')`.as('month'),
        sql<number>`COUNT(DISTINCT "userId")`.as('mau'),
        sql<number>`COUNT(DISTINCT "sessionId")`.as('totalSessions'),
      ])
      .where(
        'timestamp',
        '>=',
        sql<Date>`NOW() - INTERVAL '${sql.raw(String(months))} months'`,
      )
      .where('userId', 'is not', null)
      .groupBy(sql`TO_CHAR("timestamp", 'YYYY-MM')`)
      .orderBy('month', 'desc')
      .execute();
  }

  async getLearningFunnel(courseId?: string) {
    let query = this.db
      .selectFrom('User as u')
      .leftJoin('UserProgress as up', 'up.userId', 'u.id')
      .leftJoin('Lesson as l', 'l.id', 'up.lessonId')
      .where('u.role', '=', 'STUDENT');

    if (courseId) {
      query = query.where('l.courseId', '=', courseId);
    }

    return query
      .select([
        sql<number>`COUNT(DISTINCT u.id)`.as('totalStudents'),
        sql<number>`COUNT(DISTINCT CASE WHEN up.id IS NOT NULL THEN u.id END)`.as(
          'startedLesson',
        ),
        sql<number>`COUNT(DISTINCT CASE WHEN up.status = 'COMPLETED' THEN u.id END)`.as(
          'completedLesson',
        ),
      ])
      .execute();
  }

  async getCourseCompletionByLevel() {
    return this.db
      .selectFrom('Course as c')
      .leftJoin('Lesson as l', 'l.courseId', 'c.id')
      .leftJoin('UserProgress as up', 'up.lessonId', 'l.id')
      .where('c.published', '=', true)
      .select([
        'c.level',
        sql<number>`COUNT(DISTINCT c.id)`.as('courseCount'),
        sql<number>`COUNT(DISTINCT up."userId")`.as('totalEnrollments'),
        sql<number>`COUNT(DISTINCT CASE WHEN up.status = 'COMPLETED' THEN up."userId" END)`.as(
          'completions',
        ),
        sql<number>`ROUND(AVG(up."progressPercentage")::numeric, 2)`.as(
          'avgProgress',
        ),
      ])
      .groupBy('c.level')
      .execute();
  }

  async getLeaderboard(options: {
    groupId?: string;
    timeframe: 'week' | 'month' | 'all';
    limit: number;
  }) {
    const cacheKey = `leaderboard:${options.groupId || 'global'}:${options.timeframe}:${options.limit}`;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const timeFilter = {
      week: sql<Date>`NOW() - INTERVAL '7 days'`,
      month: sql<Date>`NOW() - INTERVAL '30 days'`,
      all: sql<Date>`'1970-01-01'::timestamp`,
    }[options.timeframe];

    const selectColumns = [
      'u.id',
      'u.name',
      'u.points',
      sql<number>`COALESCE(us."currentStreak", 0)`.as('streak'),
      sql<number>`COUNT(DISTINCT ua.id)`.as('achievementCount'),
      sql<number>`(
        u.points * 1 + 
        COALESCE(us."currentStreak", 0) * 10 + 
        COUNT(DISTINCT ua.id) * 50
      )`.as('totalScore'),
    ] as const;

    let result;

    if (options.groupId) {
      result = await this.db
        .selectFrom('User as u')
        .leftJoin('UserStreak as us', 'us.userId', 'u.id')
        .leftJoin('UserAchievement as ua', 'ua.userId', 'u.id')
        .innerJoin('BuddyMember as bm', 'bm.userId', 'u.id')
        .where('u.role', '=', 'STUDENT')
        .where('bm.groupId', '=', options.groupId)
        .select([
          'u.id',
          'u.name',
          'u.points',
          sql<number>`COALESCE(us."currentStreak", 0)`.as('streak'),
          sql<number>`COUNT(DISTINCT ua.id)`.as('achievementCount'),
          sql<number>`(u.points * 1 + COALESCE(us."currentStreak", 0) * 10 + COUNT(DISTINCT ua.id) * 50)`.as(
            'totalScore',
          ),
        ])
        .where('ua.awardedAt', '>=', timeFilter)
        .groupBy(['u.id', 'u.name', 'u.points', 'us.currentStreak'])
        .orderBy('totalScore', 'desc')
        .limit(options.limit)
        .execute();
    } else {
      result = await this.db
        .selectFrom('User as u')
        .leftJoin('UserStreak as us', 'us.userId', 'u.id')
        .leftJoin('UserAchievement as ua', 'ua.userId', 'u.id')
        .where('u.role', '=', 'STUDENT')
        .select([
          'u.id',
          'u.name',
          'u.points',
          sql<number>`COALESCE(us."currentStreak", 0)`.as('streak'),
          sql<number>`COUNT(DISTINCT ua.id)`.as('achievementCount'),
          sql<number>`(u.points * 1 + COALESCE(us."currentStreak", 0) * 10 + COUNT(DISTINCT ua.id) * 50)`.as(
            'totalScore',
          ),
        ])
        .where('ua.awardedAt', '>=', timeFilter)
        .groupBy(['u.id', 'u.name', 'u.points', 'us.currentStreak'])
        .orderBy('totalScore', 'desc')
        .limit(options.limit)
        .execute();
    }

    // Cache for 5 minutes (300 seconds)
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  async getTopCourses(limit: number = 10) {
    return this.db
      .selectFrom('Course as c')
      .leftJoin('Lesson as l', 'l.courseId', 'c.id')
      .leftJoin('UserProgress as up', 'up.lessonId', 'l.id')
      .where('c.published', '=', true)
      .select([
        'c.id',
        'c.title',
        'c.level',
        sql<number>`COUNT(DISTINCT up."userId")`.as('enrollments'),
        sql<number>`COUNT(DISTINCT CASE WHEN up.status = 'COMPLETED' THEN up."userId" END)`.as(
          'completions',
        ),
      ])
      .groupBy(['c.id', 'c.title', 'c.level'])
      .orderBy('enrollments', 'desc')
      .limit(limit)
      .execute();
  }

  async getStudentBehaviorSummary(userId: string, days: number = 30) {
    return this.db
      .selectFrom('BehaviorLog')
      .select([
        sql<number>`COUNT(*)`.as('totalEvents'),
        sql<number>`COUNT(DISTINCT "sessionId")`.as('sessions'),
        sql<number>`SUM(duration)`.as('totalDuration'),
        sql<string>`MODE() WITHIN GROUP (ORDER BY "eventType")`.as(
          'mostCommonEvent',
        ),
      ])
      .where('userId', '=', userId)
      .where(
        'timestamp',
        '>=',
        sql<Date>`NOW() - INTERVAL '${sql.raw(String(days))} days'`,
      )
      .execute();
  }

  /**
   * Cohort Retention Analysis - Track user retention by signup week
   * Returns weekly retention rates for each cohort
   */
  async getCohortRetention(weeks: number = 12) {
    return this.db
      .selectFrom('User as u')
      .leftJoin('BehaviorLog as bl', 'bl.userId', 'u.id')
      .where('u.role', '=', 'STUDENT')
      .where(
        'u.createdAt',
        '>=',
        sql<Date>`NOW() - INTERVAL '${sql.raw(String(weeks))} weeks'`,
      )
      .select([
        sql<string>`DATE_TRUNC('week', u."createdAt")`.as('cohortWeek'),
        sql<number>`COUNT(DISTINCT u.id)`.as('cohortSize'),
        sql<number>`COUNT(DISTINCT CASE WHEN bl."timestamp" >= u."createdAt" + INTERVAL '1 week' AND bl."timestamp" < u."createdAt" + INTERVAL '2 weeks' THEN u.id END)`.as(
          'week1',
        ),
        sql<number>`COUNT(DISTINCT CASE WHEN bl."timestamp" >= u."createdAt" + INTERVAL '2 weeks' AND bl."timestamp" < u."createdAt" + INTERVAL '3 weeks' THEN u.id END)`.as(
          'week2',
        ),
        sql<number>`COUNT(DISTINCT CASE WHEN bl."timestamp" >= u."createdAt" + INTERVAL '3 weeks' AND bl."timestamp" < u."createdAt" + INTERVAL '4 weeks' THEN u.id END)`.as(
          'week3',
        ),
        sql<number>`COUNT(DISTINCT CASE WHEN bl."timestamp" >= u."createdAt" + INTERVAL '4 weeks' AND bl."timestamp" < u."createdAt" + INTERVAL '5 weeks' THEN u.id END)`.as(
          'week4',
        ),
      ])
      .groupBy(sql`DATE_TRUNC('week', u."createdAt")`)
      .orderBy('cohortWeek', 'desc')
      .execute();
  }

  /**
   * Student At-Risk Detection - Identify students likely to drop out
   * Based on declining activity patterns
   */
  async getAtRiskStudents(options: {
    activityThresholdDays: number;
    progressThreshold: number;
    limit: number;
  }) {
    return this.db
      .selectFrom('User as u')
      .leftJoin('UserProgress as up', 'up.userId', 'u.id')
      .leftJoin('BehaviorLog as bl', 'bl.userId', 'u.id')
      .leftJoin('UserStreak as us', 'us.userId', 'u.id')
      .where('u.role', '=', 'STUDENT')
      .select([
        'u.id',
        'u.name',
        'u.email',
        sql<Date>`MAX(bl."timestamp")`.as('lastActivity'),
        sql<number>`COALESCE(AVG(up."progressPercentage"), 0)`.as(
          'avgProgress',
        ),
        sql<number>`COALESCE(us."currentStreak", 0)`.as('currentStreak'),
        sql<number>`EXTRACT(DAY FROM NOW() - MAX(bl."timestamp"))`.as(
          'daysSinceLastActivity',
        ),
      ])
      .groupBy(['u.id', 'u.name', 'u.email', 'us.currentStreak'])
      .having(
        sql`MAX(bl."timestamp")`,
        '<',
        sql<Date>`NOW() - INTERVAL '${sql.raw(String(options.activityThresholdDays))} days'`,
      )
      .having(
        sql`COALESCE(AVG(up."progressPercentage"), 0)`,
        '<',
        options.progressThreshold,
      )
      .orderBy(sql`MAX(bl."timestamp")`, 'asc')
      .limit(options.limit)
      .execute();
  }

  /**
   * Student Behavior Pattern Analysis - For AI personalization
   * Analyzes learning time patterns, content preferences, difficulty analysis
   */
  async getStudentBehaviorPattern(userId: string, days: number = 30) {
    return this.db
      .selectFrom('BehaviorLog as bl')
      .leftJoin('UserProgress as up', 'up.userId', 'bl.userId')
      .leftJoin('Lesson as l', 'l.id', 'up.lessonId')
      .leftJoin('Course as c', 'c.id', 'l.courseId')
      .where('bl.userId', '=', userId)
      .where(
        'bl.timestamp',
        '>=',
        sql<Date>`NOW() - INTERVAL '${sql.raw(String(days))} days'`,
      )
      .select([
        sql<number>`EXTRACT(HOUR FROM bl."timestamp")`.as('preferredHour'),
        sql<number>`COUNT(DISTINCT DATE(bl."timestamp"))`.as('activeDays'),
        sql<number>`AVG(bl."duration")`.as('avgSessionDuration'),
        sql<string>`MODE() WITHIN GROUP (ORDER BY bl."eventType")`.as(
          'mostCommonEvent',
        ),
        sql<string>`MODE() WITHIN GROUP (ORDER BY c."level")`.as(
          'preferredDifficulty',
        ),
        sql<number>`COUNT(DISTINCT CASE WHEN up.status = 'COMPLETED' THEN l.id END)`.as(
          'completedLessons',
        ),
        sql<number>`COUNT(DISTINCT CASE WHEN up.status = 'IN_PROGRESS' THEN l.id END)`.as(
          'inProgressLessons',
        ),
        sql<number>`AVG(up."progressPercentage")`.as('avgProgress'),
        sql<number>`COUNT(DISTINCT bl."sessionId")`.as('totalSessions'),
      ])
      .execute();
  }

  /**
   * Course Engagement Metrics - Deep analytics per course
   */
  async getCourseEngagementMetrics(courseId: string) {
    return this.db
      .selectFrom('Course as c')
      .innerJoin('Lesson as l', 'l.courseId', 'c.id')
      .leftJoin('UserProgress as up', 'up.lessonId', 'l.id')
      .leftJoin('BehaviorLog as bl', (join) =>
        join
          .onRef('bl.userId', '=', 'up.userId')
          .on('bl.path', 'like', sql`'%' || c.slug || '%'`),
      )
      .where('c.id', '=', courseId)
      .select([
        'c.id',
        'c.title',
        sql<number>`COUNT(DISTINCT up."userId")`.as('totalEnrollments'),
        sql<number>`COUNT(DISTINCT CASE WHEN up.status = 'COMPLETED' THEN up."userId" END)`.as(
          'completions',
        ),
        sql<number>`ROUND(100.0 * COUNT(DISTINCT CASE WHEN up.status = 'COMPLETED' THEN up."userId" END) / NULLIF(COUNT(DISTINCT up."userId"), 0), 2)`.as(
          'completionRate',
        ),
        sql<number>`AVG(up."durationSpent")`.as('avgTimeSpent'),
        sql<number>`COUNT(DISTINCT bl."sessionId")`.as('totalSessions'),
        sql<number>`AVG(bl.duration)`.as('avgSessionDuration'),
      ])
      .groupBy(['c.id', 'c.title'])
      .executeTakeFirst();
  }

  /**
   * Revenue Analytics - Track course purchases and revenue
   */
  async getRevenueMetrics(options: { startDate: Date; endDate: Date }) {
    return this.db
      .selectFrom('Course as c')
      .leftJoin('Lesson as l', 'l.courseId', 'c.id')
      .leftJoin('UserProgress as up', 'up.lessonId', 'l.id')
      .where('c.published', '=', true)
      .where('up.createdAt', '>=', options.startDate)
      .where('up.createdAt', '<=', options.endDate)
      .select([
        sql<string>`DATE_TRUNC('day', up."createdAt")`.as('date'),
        sql<number>`COUNT(DISTINCT up."userId")`.as('newEnrollments'),
        sql<number>`SUM(DISTINCT c.price)`.as('potentialRevenue'),
        sql<number>`COUNT(DISTINCT c.id)`.as('activeCourses'),
      ])
      .groupBy(sql`DATE_TRUNC('day', up."createdAt")`)
      .orderBy('date', 'desc')
      .execute();
  }

  /**
   * Gamification Effectiveness - Measure impact of points/streaks on engagement
   */
  async getGamificationEffectiveness() {
    return this.db
      .selectFrom('User as u')
      .leftJoin('UserStreak as us', 'us.userId', 'u.id')
      .leftJoin('BehaviorLog as bl', 'bl.userId', 'u.id')
      .leftJoin('UserProgress as up', 'up.userId', 'u.id')
      .where('u.role', '=', 'STUDENT')
      .select([
        sql<string>`CASE 
          WHEN u.points >= 1000 THEN 'high_points'
          WHEN u.points >= 100 THEN 'medium_points'
          ELSE 'low_points'
        END`.as('pointsSegment'),
        sql<string>`CASE 
          WHEN COALESCE(us."currentStreak", 0) >= 7 THEN 'high_streak'
          WHEN COALESCE(us."currentStreak", 0) >= 3 THEN 'medium_streak'
          ELSE 'low_streak'
        END`.as('streakSegment'),
        sql<number>`COUNT(DISTINCT u.id)`.as('userCount'),
        sql<number>`AVG(COALESCE(up."progressPercentage", 0))`.as(
          'avgProgress',
        ),
        sql<number>`COUNT(DISTINCT bl."sessionId") / NULLIF(COUNT(DISTINCT u.id), 0)`.as(
          'sessionsPerUser',
        ),
        sql<number>`COUNT(DISTINCT CASE WHEN up.status = 'COMPLETED' THEN up.id END)`.as(
          'completedLessons',
        ),
      ])
      .groupBy([
        sql`CASE WHEN u.points >= 1000 THEN 'high_points' WHEN u.points >= 100 THEN 'medium_points' ELSE 'low_points' END`,
        sql`CASE WHEN COALESCE(us."currentStreak", 0) >= 7 THEN 'high_streak' WHEN COALESCE(us."currentStreak", 0) >= 3 THEN 'medium_streak' ELSE 'low_streak' END`,
      ])
      .execute();
  }
}
