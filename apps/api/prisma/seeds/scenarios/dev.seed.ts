import { PrismaClient, Prisma } from '@prisma/client';
import { createBatchUsers } from '../factories/user.factory';
import { createBatchCourses, createCourseLessons } from '../factories/course.factory';
import { generateBehaviorLogsForUsers } from '../factories/behavior.factory';
import {
  createUserStreakData,
  createUserAchievements,
  createBuddyGroupData,
  createBuddyChallengeData,
} from '../factories/gamification.factory';

const prisma = new PrismaClient();

const DEV_CONFIG = {
  users: 50,
  courses: 10,
  behaviorDays: 7,
  lessonsPerCourse: { min: 5, max: 12 },
  achievementsPerUser: { min: 1, max: 5 },
  buddyGroups: 5,
  groupSize: 4,
};

async function seedDev() {
  console.log('🌱 Starting DEV seed...');
  console.log(`   Users: ${DEV_CONFIG.users}`);
  console.log(`   Courses: ${DEV_CONFIG.courses}`);
  console.log(`   Behavior Days: ${DEV_CONFIG.behaviorDays}`);
  console.log(`   Buddy Groups: ${DEV_CONFIG.buddyGroups}`);

  console.log('\n👥 Creating users...');
  const users = createBatchUsers(DEV_CONFIG.users);
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        role: user.role,
        points: user.points,
        preferredLocale: user.locale,
        dateOfBirth: user.dateOfBirth,
        metadata: user.metadata,
        createdAt: user.createdAt,
      },
    });
  }
  console.log(`   ✅ Created ${users.length} users`);

  console.log('\n📚 Creating courses with lessons...');
  const courses = createBatchCourses(DEV_CONFIG.courses);
  for (const course of courses) {
    const lessonCount =
      Math.floor(Math.random() * (DEV_CONFIG.lessonsPerCourse.max - DEV_CONFIG.lessonsPerCourse.min)) +
      DEV_CONFIG.lessonsPerCourse.min;

    await prisma.course.upsert({
      where: { id: course.id },
      update: {},
      create: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        thumbnailKey: course.thumbnailKey,
        price: course.price,
        level: course.level as 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT',
        published: course.published,
        createdAt: course.createdAt,
      },
    });

    const lessons = createCourseLessons(course.id, course.level, lessonCount);
    for (const lesson of lessons) {
      await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: {},
        create: {
          id: lesson.id,
          courseId: lesson.courseId,
          order: lesson.order,
          title: lesson.title,
          content: lesson.content,
          type: lesson.type as 'VIDEO' | 'READING' | 'QUIZ' | 'INTERACTIVE',
          duration: lesson.duration,
          published: lesson.published,
        },
      });
    }
  }
  console.log(`   ✅ Created ${courses.length} courses`);

  console.log('\n🔥 Creating user streaks...');
  const studentIds = users.filter((u) => u.role === 'STUDENT').map((u) => u.id);
  let streakCount = 0;
  for (const userId of studentIds) {
    const activityLevel = Math.random() < 0.2 ? 'high' : Math.random() < 0.5 ? 'medium' : 'low';
    const streak = createUserStreakData({ userId, activityLevel });
    try {
      await prisma.userStreak.upsert({
        where: { userId },
        update: {},
        create: {
          id: streak.id,
          userId: streak.userId,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActivityDate: streak.lastActivityDate,
          streakFrozen: streak.streakFrozen,
          freezesRemaining: streak.freezesRemaining,
        },
      });
      streakCount++;
    } catch {
      // Skip if already exists
    }
  }
  console.log(`   ✅ Created ${streakCount} user streaks`);

  console.log('\n🏆 Creating achievements...');
  let achievementCount = 0;
  for (const userId of studentIds) {
    const count =
      Math.floor(Math.random() * (DEV_CONFIG.achievementsPerUser.max - DEV_CONFIG.achievementsPerUser.min)) +
      DEV_CONFIG.achievementsPerUser.min;
    const achievements = createUserAchievements(userId, count);
    for (const achievement of achievements) {
      try {
        await prisma.userAchievement.create({
          data: {
            id: achievement.id,
            userId: achievement.userId,
            type: achievement.type,
            name: achievement.name,
            description: achievement.description,
            iconKey: achievement.iconKey,
            awardedAt: achievement.awardedAt,
          },
        });
        achievementCount++;
      } catch {
        // Skip duplicates
      }
    }
  }
  console.log(`   ✅ Created ${achievementCount} achievements`);

  console.log('\n👥 Creating buddy groups...');
  for (let i = 0; i < DEV_CONFIG.buddyGroups; i++) {
    const memberIds = studentIds.slice(i * DEV_CONFIG.groupSize, (i + 1) * DEV_CONFIG.groupSize);
    if (memberIds.length < 2) continue;

    const groupData = createBuddyGroupData(i, memberIds);

    try {
      await prisma.buddyGroup.create({
        data: {
          id: groupData.group.id,
          name: groupData.group.name,
          description: groupData.group.description,
          type: groupData.group.type,
          totalPoints: groupData.group.totalPoints,
          streak: groupData.group.streak,
        },
      });

      for (const member of groupData.members) {
        await prisma.buddyMember.create({
          data: {
            id: member.id,
            groupId: member.groupId,
            userId: member.userId,
            role: member.role as 'LEADER' | 'MEMBER',
            joinedAt: member.joinedAt,
          },
        });
      }

      // Add challenges to each group
      for (let j = 0; j < 2; j++) {
        const challenge = createBuddyChallengeData(groupData.group.id, j);
        await prisma.buddyChallenge.create({
          data: {
            id: challenge.id,
            groupId: challenge.groupId,
            title: challenge.title,
            target: challenge.target,
            rewardPoints: challenge.rewardPoints,
            expiresAt: challenge.expiresAt,
          },
        });
      }
    } catch {
      // Skip if exists
    }
  }
  console.log(`   ✅ Created ${DEV_CONFIG.buddyGroups} buddy groups`);

  console.log('\n📊 Creating behavior logs...');
  const logs = generateBehaviorLogsForUsers(studentIds, DEV_CONFIG.behaviorDays);

  let logCount = 0;
  for (const log of logs) {
    try {
      await prisma.behaviorLog.create({
        data: {
          id: log.id,
          userId: log.userId,
          sessionId: log.sessionId,
          path: log.path,
          eventType: log.eventType,
          actionCategory: log.actionCategory,
          duration: log.duration,
          deviceInfo: log.deviceInfo,
          payload: log.payload === null ? Prisma.DbNull : log.payload,
          timestamp: log.timestamp,
        } as Prisma.BehaviorLogCreateInput,
      });
      logCount++;
    } catch {
      // Skip duplicates
    }
  }
  console.log(`   ✅ Created ${logCount} behavior logs`);

  console.log('\n✅ DEV seed completed!');
}

seedDev()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
