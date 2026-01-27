import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { KYSELY_TOKEN, type KyselyDB } from '../../database/kysely.module';

export interface DAUResult {
  date: Date;
  activeUsers: number;
}

export interface MAUResult {
  month: string;
  activeUsers: number;
}

export interface CohortRetentionResult {
  cohortWeek: string;
  weekNumber: number;
  retainedUsers: number;
  retentionRate: number;
}

export interface LearningFunnelResult {
  stage: string;
  count: number;
  percentage: number;
}

export interface CourseCompletionByLevelResult {
  level: string;
  totalEnrollments: number;
  completedLessons: number;
  completionRate: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string | null;
  points: number;
  currentStreak: number;
  rank: number;
}

export interface StudentRiskResult {
  userId: string;
  email: string;
  daysSinceLastActivity: number;
  currentStreak: number;
  riskLevel: 'high' | 'medium' | 'low';
}

@Injectable()
export class AnalyticsRepository {
  private static readonly LEADERBOARD_CACHE_TTL = 300; // 5 minutes

  constructor(
    @Inject(KYSELY_TOKEN)
    private readonly db: KyselyDB,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async getDailyActiveUsers(days: number = 30): Promise<DAUResult[]> {
    const result = await this.db
      .selectFrom('BehaviorLog')
      .select([
        sql<Date>`DATE("timestamp")`.as('date'),
        sql<number>`COUNT(DISTINCT "userId")`.as('activeUsers'),
      ])
      .where('userId', 'is not', null)
      .where(
        'timestamp',
        '>=',
        sql<Date>`NOW() - INTERVAL '${sql.raw(String(days))} days'`,
      )
      .groupBy(sql`DATE("timestamp")`)
      .orderBy('date', 'desc')
      .execute();

    return result.map((r) => ({
      date: r.date,
      activeUsers: Number(r.activeUsers),
    }));
  }

  async getMonthlyActiveUsers(months: number = 12): Promise<MAUResult[]> {
    const result = await this.db
      .selectFrom('BehaviorLog')
      .select([
        sql<string>`TO_CHAR("timestamp", 'YYYY-MM')`.as('month'),
        sql<number>`COUNT(DISTINCT "userId")`.as('activeUsers'),
      ])
      .where('userId', 'is not', null)
      .where(
        'timestamp',
        '>=',
        sql<Date>`NOW() - INTERVAL '${sql.raw(String(months))} months'`,
      )
      .groupBy(sql`TO_CHAR("timestamp", 'YYYY-MM')`)
      .orderBy('month', 'desc')
      .execute();

    return result.map((r) => ({
      month: r.month,
      activeUsers: Number(r.activeUsers),
    }));
  }

  async getCohortRetention(
    weeks: number = 8,
  ): Promise<CohortRetentionResult[]> {
    const query = sql<CohortRetentionResult>`
      WITH user_cohorts AS (
        SELECT 
          id as user_id,
          DATE_TRUNC('week', "createdAt") as cohort_week
        FROM "User"
        WHERE "createdAt" >= NOW() - INTERVAL '${sql.raw(String(weeks * 2))} weeks'
          AND role = 'STUDENT'
      ),
      user_activity AS (
        SELECT 
          "userId",
          DATE_TRUNC('week', "timestamp") as activity_week
        FROM "BehaviorLog"
        WHERE "userId" IS NOT NULL
          AND "timestamp" >= NOW() - INTERVAL '${sql.raw(String(weeks * 2))} weeks'
        GROUP BY "userId", DATE_TRUNC('week', "timestamp")
      ),
      retention AS (
        SELECT 
          uc.cohort_week,
          EXTRACT(WEEK FROM ua.activity_week) - EXTRACT(WEEK FROM uc.cohort_week) as week_number,
          COUNT(DISTINCT uc.user_id) as retained_users
        FROM user_cohorts uc
        LEFT JOIN user_activity ua ON uc.user_id = ua."userId"
          AND ua.activity_week >= uc.cohort_week
        GROUP BY uc.cohort_week, week_number
      ),
      cohort_sizes AS (
        SELECT cohort_week, COUNT(*) as cohort_size
        FROM user_cohorts
        GROUP BY cohort_week
      )
      SELECT 
        TO_CHAR(r.cohort_week, 'YYYY-MM-DD') as "cohortWeek",
        r.week_number::int as "weekNumber",
        r.retained_users::int as "retainedUsers",
        ROUND((r.retained_users::decimal / cs.cohort_size) * 100, 2) as "retentionRate"
      FROM retention r
      JOIN cohort_sizes cs ON r.cohort_week = cs.cohort_week
      WHERE r.week_number >= 0 AND r.week_number <= ${weeks}
      ORDER BY r.cohort_week DESC, r.week_number ASC
    `;

    const result = await query.execute(this.db);
    return result.rows;
  }

  async getLearningFunnel(): Promise<LearningFunnelResult[]> {
    const totalUsers = await this.db
      .selectFrom('User')
      .select(sql<number>`COUNT(*)`.as('count'))
      .where('role', '=', 'STUDENT')
      .executeTakeFirst();

    const usersWithProgress = await this.db
      .selectFrom('UserProgress')
      .select(sql<number>`COUNT(DISTINCT "userId")`.as('count'))
      .executeTakeFirst();

    const usersCompleted = await this.db
      .selectFrom('UserProgress')
      .select(sql<number>`COUNT(DISTINCT "userId")`.as('count'))
      .where('status', '=', 'COMPLETED')
      .executeTakeFirst();

    const total = Number(totalUsers?.count || 0);
    const started = Number(usersWithProgress?.count || 0);
    const completed = Number(usersCompleted?.count || 0);

    return [
      { stage: 'Registered', count: total, percentage: 100 },
      {
        stage: 'Started Learning',
        count: started,
        percentage: total > 0 ? (started / total) * 100 : 0,
      },
      {
        stage: 'Completed Lesson',
        count: completed,
        percentage: total > 0 ? (completed / total) * 100 : 0,
      },
    ];
  }

  async getCourseCompletionByLevel(): Promise<CourseCompletionByLevelResult[]> {
    const query = sql<CourseCompletionByLevelResult>`
      SELECT 
        c.level,
        COUNT(DISTINCT up."userId")::int as "totalEnrollments",
        COUNT(CASE WHEN up.status = 'COMPLETED' THEN 1 END)::int as "completedLessons",
        ROUND(
          (COUNT(CASE WHEN up.status = 'COMPLETED' THEN 1 END)::decimal / 
           NULLIF(COUNT(*), 0)) * 100, 2
        ) as "completionRate"
      FROM "Course" c
      JOIN "Lesson" l ON c.id = l."courseId"
      LEFT JOIN "UserProgress" up ON l.id = up."lessonId"
      WHERE c.published = true
      GROUP BY c.level
      ORDER BY c.level
    `;

    const result = await query.execute(this.db);
    return result.rows;
  }

  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    const cacheKey = `leaderboard:${limit}`;

    const cached = await this.cacheManager.get<LeaderboardEntry[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const query = sql<LeaderboardEntry>`
      SELECT 
        u.id as "userId",
        u.name::text as name,
        u.points,
        COALESCE(us."currentStreak", 0) as "currentStreak",
        ROW_NUMBER() OVER (ORDER BY u.points DESC) as rank
      FROM "User" u
      LEFT JOIN "UserStreak" us ON u.id = us."userId"
      WHERE u.role = 'STUDENT'
      ORDER BY u.points DESC
      LIMIT ${limit}
    `;

    const result = await query.execute(this.db);
    const entries = result.rows;

    await this.cacheManager.set(
      cacheKey,
      entries,
      AnalyticsRepository.LEADERBOARD_CACHE_TTL,
    );

    return entries;
  }

  async getStudentBehaviorPattern(userId: string): Promise<{
    preferredTime: string;
    avgSessionDuration: number;
    mostActiveDay: string;
    learningStyle: string;
  }> {
    const timeDistribution = await this.db
      .selectFrom('BehaviorLog')
      .select([
        sql<string>`EXTRACT(HOUR FROM "timestamp")::text`.as('hour'),
        sql<number>`COUNT(*)`.as('count'),
      ])
      .where('userId', '=', userId)
      .groupBy(sql`EXTRACT(HOUR FROM "timestamp")`)
      .orderBy(sql`COUNT(*)`, 'desc')
      .limit(1)
      .executeTakeFirst();

    const avgDuration = await this.db
      .selectFrom('BehaviorLog')
      .select(sql<number>`AVG(duration)`.as('avgDuration'))
      .where('userId', '=', userId)
      .where('duration', 'is not', null)
      .executeTakeFirst();

    const dayDistribution = await this.db
      .selectFrom('BehaviorLog')
      .select([
        sql<string>`TO_CHAR("timestamp", 'Day')`.as('day'),
        sql<number>`COUNT(*)`.as('count'),
      ])
      .where('userId', '=', userId)
      .groupBy(sql`TO_CHAR("timestamp", 'Day')`)
      .orderBy(sql`COUNT(*)`, 'desc')
      .limit(1)
      .executeTakeFirst();

    const eventTypes = await this.db
      .selectFrom('BehaviorLog')
      .select(['eventType', sql<number>`COUNT(*)`.as('count')])
      .where('userId', '=', userId)
      .groupBy('eventType')
      .orderBy(sql`COUNT(*)`, 'desc')
      .limit(3)
      .execute();

    const learningStyle = eventTypes.find((e) => e.eventType === 'video_play')
      ? 'Visual'
      : eventTypes.find((e) => e.eventType === 'quiz_submit')
        ? 'Interactive'
        : 'Reading';

    return {
      preferredTime: timeDistribution?.hour
        ? `${timeDistribution.hour}:00`
        : 'N/A',
      avgSessionDuration: Number(avgDuration?.avgDuration || 0),
      mostActiveDay: dayDistribution?.day?.trim() || 'N/A',
      learningStyle,
    };
  }

  async getAtRiskStudents(
    inactiveDays: number = 7,
  ): Promise<StudentRiskResult[]> {
    const query = sql<StudentRiskResult>`
      WITH last_activity AS (
        SELECT 
          "userId",
          MAX("timestamp") as last_active
        FROM "BehaviorLog"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId"
      )
      SELECT 
        u.id as "userId",
        u.email,
        COALESCE(EXTRACT(DAY FROM NOW() - la.last_active)::int, 999) as "daysSinceLastActivity",
        COALESCE(us."currentStreak", 0) as "currentStreak",
        CASE 
          WHEN la.last_active IS NULL OR EXTRACT(DAY FROM NOW() - la.last_active) > ${inactiveDays * 2} THEN 'high'
          WHEN EXTRACT(DAY FROM NOW() - la.last_active) > ${inactiveDays} THEN 'medium'
          ELSE 'low'
        END as "riskLevel"
      FROM "User" u
      LEFT JOIN last_activity la ON u.id = la."userId"
      LEFT JOIN "UserStreak" us ON u.id = us."userId"
      WHERE u.role = 'STUDENT'
        AND (la.last_active IS NULL OR la.last_active < NOW() - INTERVAL '${sql.raw(String(inactiveDays))} days')
      ORDER BY "daysSinceLastActivity" DESC
      LIMIT 100
    `;

    const result = await query.execute(this.db);
    return result.rows;
  }

  async getEngagementMetrics(days: number = 7): Promise<{
    totalSessions: number;
    avgSessionsPerUser: number;
    avgDurationPerSession: number;
    topEventTypes: Array<{ eventType: string; count: number }>;
  }> {
    const sessionStats = await this.db
      .selectFrom('BehaviorLog')
      .select([
        sql<number>`COUNT(DISTINCT "sessionId")`.as('totalSessions'),
        sql<number>`COUNT(DISTINCT "userId")`.as('uniqueUsers'),
        sql<number>`AVG(duration)`.as('avgDuration'),
      ])
      .where(
        'timestamp',
        '>=',
        sql<Date>`NOW() - INTERVAL '${sql.raw(String(days))} days'`,
      )
      .executeTakeFirst();

    const topEvents = await this.db
      .selectFrom('BehaviorLog')
      .select(['eventType', sql<number>`COUNT(*)`.as('count')])
      .where(
        'timestamp',
        '>=',
        sql<Date>`NOW() - INTERVAL '${sql.raw(String(days))} days'`,
      )
      .groupBy('eventType')
      .orderBy(sql`COUNT(*)`, 'desc')
      .limit(10)
      .execute();

    const totalSessions = Number(sessionStats?.totalSessions || 0);
    const uniqueUsers = Number(sessionStats?.uniqueUsers || 1);

    return {
      totalSessions,
      avgSessionsPerUser: totalSessions / uniqueUsers,
      avgDurationPerSession: Number(sessionStats?.avgDuration || 0),
      topEventTypes: topEvents.map((e) => ({
        eventType: e.eventType,
        count: Number(e.count),
      })),
    };
  }
}
