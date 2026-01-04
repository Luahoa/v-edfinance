import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import type { InvestmentProfile, Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtBlacklistService } from '../auth/jwt-blacklist.service';
import type { UpdateInvestmentProfileDto } from './dto/investment-profile.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(forwardRef(() => JwtBlacklistService))
    private jwtBlacklistService: JwtBlacklistService,
  ) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { investmentProfile: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { investmentProfile: true },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async getInvestmentProfile(
    userId: string,
  ): Promise<InvestmentProfile | null> {
    return this.prisma.investmentProfile.findUnique({
      where: { userId },
    });
  }

  async updateInvestmentProfile(
    userId: string,
    dto: UpdateInvestmentProfileDto,
  ): Promise<InvestmentProfile> {
    const data = dto as unknown as Prisma.InvestmentProfileUpdateInput;
    const createData = dto as unknown as Prisma.InvestmentProfileCreateInput;
    return this.prisma.investmentProfile.upsert({
      where: { userId },
      update: data,
      create: {
        ...createData,
        user: { connect: { id: userId } },
      },
    });
  }

  /**
   * Updates user profile with safe, whitelisted fields only.
   * Prevents mass assignment attacks by rejecting role, passwordHash, email, points changes.
   */
  async update(userId: string, dto: UpdateUserDto): Promise<User> {
    const safeData: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) {
      safeData.name = dto.name as Prisma.InputJsonValue;
    }
    if (dto.preferredLocale !== undefined) {
      safeData.preferredLocale = dto.preferredLocale;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: safeData,
    });
  }

  async changePassword(userId: string, dto: any): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    // VED-C6I: Invalidate all sessions after password change
    // Blacklist all active JWT tokens
    await this.jwtBlacklistService.blacklistAllUserTokens(userId);

    // Also revoke all refresh tokens in database
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    return {
      message: 'Password changed successfully. All devices logged out.',
    };
  }

  /**
   * VED-IU3: Unlocks a locked user account (Admin only)
   * Resets failedLoginAttempts and removes lockedUntil timestamp
   */
  async unlockAccount(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return {
      message: `Account for ${user.email} has been unlocked successfully.`,
    };
  }

  /**
   * Gets dashboard statistics for a user using optimized aggregation queries.
   * Uses SQL-level aggregation instead of loading all records into memory.
   */
  async getDashboardStats(userId: string) {
    const [user, progressStats, achievementCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
      }),
      this.prisma.userProgress.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
        _sum: { durationSpent: true },
      }),
      this.prisma.userAchievement.count({
        where: { userId },
      }),
    ]);

    const enrolledCoursesCount = await this.prisma.userProgress
      .findMany({
        where: { userId },
        select: { lesson: { select: { courseId: true } } },
        distinct: ['lessonId'],
      })
      .then((records) => new Set(records.map((r) => r.lesson.courseId)).size);

    const completedLessons =
      progressStats.find((s) => s.status === 'COMPLETED')?._count._all || 0;
    const totalDuration = progressStats.reduce(
      (acc, s) => acc + (s._sum.durationSpent || 0),
      0,
    );

    return {
      points: user?.points || 0,
      enrolledCoursesCount,
      completedLessonsCount: completedLessons,
      badgesCount: achievementCount,
      totalDurationSpent: totalDuration,
    };
  }
}
