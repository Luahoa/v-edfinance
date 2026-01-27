import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UserSegment {
  id: string;
  name: string;
  users: string[];
  criteria: SegmentCriteria;
  updatedAt: Date;
}

export interface SegmentCriteria {
  ageRange?: { min: number; max: number };
  engagementLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  behaviorType?: 'SAVER' | 'HUNTER' | 'OBSERVER';
  pointsRange?: { min: number; max: number };
  completedLessonsMin?: number;
  locale?: string[];
}

export interface UserDemographics {
  age: number;
  locale: string;
  registeredAt: Date;
  engagementScore: number;
  behaviorType: 'SAVER' | 'HUNTER' | 'OBSERVER';
}

@Injectable()
export class UserSegmentationService {
  private readonly logger = new Logger(UserSegmentationService.name);
  private segments: Map<string, UserSegment> = new Map();

  constructor(private prisma: PrismaService) {}

  defineSegment(
    id: string,
    name: string,
    criteria: SegmentCriteria,
  ): UserSegment {
    const segment: UserSegment = {
      id,
      name,
      users: [],
      criteria,
      updatedAt: new Date(),
    };
    this.segments.set(id, segment);
    this.logger.log(`Segment defined: ${name} (${id})`);
    return segment;
  }

  async updateSegment(segmentId: string): Promise<UserSegment | null> {
    const segment = this.segments.get(segmentId);
    if (!segment) {
      this.logger.warn(`Segment ${segmentId} not found`);
      return null;
    }

    const users = await this.getUsersMatchingCriteria(segment.criteria);
    segment.users = users.map((u) => u.id);
    segment.updatedAt = new Date();

    this.segments.set(segmentId, segment);
    this.logger.log(
      `Segment ${segment.name} updated with ${segment.users.length} users`,
    );
    return segment;
  }

  async getUsersMatchingCriteria(
    criteria: SegmentCriteria,
  ): Promise<{ id: string }[]> {
    const where: any = {};

    if (criteria.pointsRange) {
      where.points = {
        gte: criteria.pointsRange.min,
        lte: criteria.pointsRange.max,
      };
    }

    if (criteria.locale && criteria.locale.length > 0) {
      where.preferredLanguage = { in: criteria.locale };
    }

    let users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        dateOfBirth: true,
        preferredLanguage: true,
        createdAt: true,
        points: true,
      },
    });

    if (criteria.ageRange) {
      users = users.filter((user) => {
        if (!user.dateOfBirth) return false;
        const age = this.calculateAge(new Date(user.dateOfBirth));
        return (
          criteria.ageRange &&
          age >= criteria.ageRange.min &&
          age <= criteria.ageRange.max
        );
      });
    }

    if (criteria.completedLessonsMin !== undefined) {
      const userIds = users.map((u) => u.id);
      const progressCounts = await this.prisma.userProgress.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          status: 'COMPLETED',
        },
        _count: { id: true },
      });

      const qualifiedUserIds = new Set(
        progressCounts
          .filter((p) => p._count.id >= criteria.completedLessonsMin!)
          .map((p) => p.userId),
      );

      users = users.filter((u) => qualifiedUserIds.has(u.id));
    }

    if (criteria.engagementLevel) {
      const engagementUsers = await this.filterByEngagement(
        users.map((u) => u.id),
        criteria.engagementLevel,
      );
      users = users.filter((u) => engagementUsers.has(u.id));
    }

    if (criteria.behaviorType) {
      const behaviorUsers = await this.filterByBehavior(
        users.map((u) => u.id),
        criteria.behaviorType,
      );
      users = users.filter((u) => behaviorUsers.has(u.id));
    }

    return users.map((u) => ({ id: u.id }));
  }

  private async filterByEngagement(
    userIds: string[],
    level: 'LOW' | 'MEDIUM' | 'HIGH',
  ): Promise<Set<string>> {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const activityCounts = await this.prisma.behaviorLog.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        timestamp: { gte: lastWeek },
      },
      _count: { id: true },
    });

    const result = new Set<string>();
    for (const entry of activityCounts) {
      if (!entry.userId) continue;
      const count = entry._count.id;

      if (level === 'LOW' && count < 10) result.add(entry.userId);
      else if (level === 'MEDIUM' && count >= 10 && count <= 50)
        result.add(entry.userId);
      else if (level === 'HIGH' && count > 50) result.add(entry.userId);
    }

    return result;
  }

  private async filterByBehavior(
    userIds: string[],
    behaviorType: 'SAVER' | 'HUNTER' | 'OBSERVER',
  ): Promise<Set<string>> {
    const result = new Set<string>();

    for (const userId of userIds) {
      const logs = await this.prisma.behaviorLog.findMany({
        where: { userId },
        select: { eventType: true },
        take: 50,
      });

      const riskEvents = logs.filter(
        (l) =>
          l.eventType === 'TRADE_BUY' || l.eventType === 'HIGH_RISK_DECISION',
      ).length;

      const saveEvents = logs.filter(
        (l) =>
          l.eventType === 'COMMITMENT_CREATED' ||
          l.eventType === 'POINTS_DEDUCTED',
      ).length;

      let detected: 'SAVER' | 'HUNTER' | 'OBSERVER' = 'OBSERVER';
      if (riskEvents > saveEvents && riskEvents > 5) detected = 'HUNTER';
      else if (saveEvents > riskEvents && saveEvents > 5) detected = 'SAVER';

      if (detected === behaviorType) result.add(userId);
    }

    return result;
  }

  async getUserDemographics(userId: string): Promise<UserDemographics | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        dateOfBirth: true,
        preferredLanguage: true,
        createdAt: true,
      },
    });

    if (!user || !user.dateOfBirth) return null;

    const logs = await this.prisma.behaviorLog.findMany({
      where: { userId },
      select: { eventType: true },
      take: 50,
    });

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentLogs = await this.prisma.behaviorLog.count({
      where: { userId, timestamp: { gte: lastWeek } },
    });

    const riskEvents = logs.filter(
      (l) =>
        l.eventType === 'TRADE_BUY' || l.eventType === 'HIGH_RISK_DECISION',
    ).length;
    const saveEvents = logs.filter(
      (l) =>
        l.eventType === 'COMMITMENT_CREATED' ||
        l.eventType === 'POINTS_DEDUCTED',
    ).length;

    let behaviorType: 'SAVER' | 'HUNTER' | 'OBSERVER' = 'OBSERVER';
    if (riskEvents > saveEvents && riskEvents > 5) behaviorType = 'HUNTER';
    else if (saveEvents > riskEvents && saveEvents > 5) behaviorType = 'SAVER';

    return {
      age: this.calculateAge(new Date(user.dateOfBirth)),
      locale: user.preferredLanguage || 'vi',
      registeredAt: user.createdAt,
      engagementScore: recentLogs,
      behaviorType,
    };
  }

  getSegmentById(segmentId: string): UserSegment | null {
    return this.segments.get(segmentId) || null;
  }

  async targetSegment(segmentId: string, message: string): Promise<boolean> {
    const segment = this.segments.get(segmentId);
    if (!segment || segment.users.length === 0) {
      this.logger.warn(
        `Cannot target segment ${segmentId}: not found or empty`,
      );
      return false;
    }

    this.logger.log(
      `Targeting ${segment.users.length} users in segment "${segment.name}" with message: ${message}`,
    );

    await this.prisma.behaviorLog.createMany({
      data: segment.users.map((userId) => ({
        sessionId: `segment-${segmentId}`,
        userId,
        path: 'nudge/segment',
        eventType: 'SEGMENT_TARGETED',
        payload: {
          segmentId,
          segmentName: segment.name,
          message,
          timestamp: new Date(),
        },
      })),
    });

    return true;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }
    return age;
  }

  getAllSegments(): UserSegment[] {
    return Array.from(this.segments.values());
  }

  deleteSegment(segmentId: string): boolean {
    const existed = this.segments.has(segmentId);
    this.segments.delete(segmentId);
    if (existed) {
      this.logger.log(`Segment ${segmentId} deleted`);
    }
    return existed;
  }
}
