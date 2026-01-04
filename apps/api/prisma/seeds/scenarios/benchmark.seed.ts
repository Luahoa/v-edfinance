import { PrismaClient, Prisma } from '@prisma/client';
import { createBatchUsers } from '../factories/user.factory';
import { createBatchCourses, createCourseLessons } from '../factories/course.factory';
import { generateBehaviorLogsForUsers } from '../factories/behavior.factory';
import {
  createUserStreakData,
  createUserAchievements,
  createBuddyGroupData,
} from '../factories/gamification.factory';

const prisma = new PrismaClient();

const BENCHMARK_CONFIG = {
  users: 10000,
  courses: 100,
  behaviorDays: 90,
  lessonsPerCourse: { min: 8, max: 24 },
  achievementsPerUser: 5,
  groupSize: 5,
  batchSize: 500,
};

async function seedBenchmark() {
  console.log('⚡ Starting BENCHMARK seed (10k users for load testing)...');
  console.log(`   Users: ${BENCHMARK_CONFIG.users}`);
  console.log(`   Courses: ${BENCHMARK_CONFIG.courses}`);
  console.log(`   Behavior Days: ${BENCHMARK_CONFIG.behaviorDays}`);
  console.log(`   Batch Size: ${BENCHMARK_CONFIG.batchSize}`);

  const startTime = Date.now();

  console.log('\n👥 Creating users in batches...');
  const users = createBatchUsers(BENCHMARK_CONFIG.users);
  
  for (let i = 0; i < users.length; i += BENCHMARK_CONFIG.batchSize) {
    const batch = users.slice(i, i + BENCHMARK_CONFIG.batchSize);
    await prisma.user.createMany({
      data: batch.map((u) => ({
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash,
        name: u.name,
        role: u.role,
        points: u.points,
        preferredLocale: u.locale,
        dateOfBirth: u.dateOfBirth,
        metadata: u.metadata,
        createdAt: u.createdAt,
      })),
      skipDuplicates: true,
    });
    console.log(`   Created users ${i + 1}-${Math.min(i + BENCHMARK_CONFIG.batchSize, users.length)}`);
  }

  console.log('\n📚 Creating courses with lessons...');
  const courses = createBatchCourses(BENCHMARK_CONFIG.courses);
  
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const lessonCount =
      Math.floor(
        Math.random() *
          (BENCHMARK_CONFIG.lessonsPerCourse.max - BENCHMARK_CONFIG.lessonsPerCourse.min)
      ) + BENCHMARK_CONFIG.lessonsPerCourse.min;

    await prisma.course.create({
      data: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        thumbnailKey: course.thumbnailKey,
        price: course.price,
        level: course.level as 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT',
        published: true,
      },
    });

    const lessons = createCourseLessons(course.id, course.level, lessonCount);
    await prisma.lesson.createMany({
      data: lessons.map((l) => ({
        id: l.id,
        courseId: l.courseId,
        order: l.order,
        title: l.title,
        content: l.content,
        type: l.type as 'VIDEO' | 'READING' | 'QUIZ' | 'INTERACTIVE',
        duration: l.duration,
        published: true,
      })),
    });

    if ((i + 1) % 10 === 0) {
      console.log(`   Created ${i + 1}/${courses.length} courses`);
    }
  }

  console.log('\n🔥 Creating user streaks...');
  const studentIds = users.filter((u) => u.role === 'STUDENT').map((u) => u.id);
  
  for (let i = 0; i < studentIds.length; i += BENCHMARK_CONFIG.batchSize) {
    const batch = studentIds.slice(i, i + BENCHMARK_CONFIG.batchSize);
    const streaks = batch.map((userId) => {
      const activityLevel = Math.random() < 0.2 ? 'high' : Math.random() < 0.5 ? 'medium' : 'low';
      return createUserStreakData({ userId, activityLevel });
    });

    await prisma.userStreak.createMany({
      data: streaks.map((s) => ({
        id: s.id,
        userId: s.userId,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        lastActivityDate: s.lastActivityDate,
        streakFrozen: s.streakFrozen,
        freezesRemaining: s.freezesRemaining,
      })),
      skipDuplicates: true,
    });

    if ((i + BENCHMARK_CONFIG.batchSize) % 2000 === 0) {
      console.log(`   Created streaks for ${Math.min(i + BENCHMARK_CONFIG.batchSize, studentIds.length)} students`);
    }
  }

  console.log('\n🏆 Creating achievements (sampling 20% of users)...');
  const sampledStudents = studentIds.filter(() => Math.random() < 0.2);
  
  for (let i = 0; i < sampledStudents.length; i += BENCHMARK_CONFIG.batchSize) {
    const batch = sampledStudents.slice(i, i + BENCHMARK_CONFIG.batchSize);
    const achievements = batch.flatMap((userId) =>
      createUserAchievements(userId, BENCHMARK_CONFIG.achievementsPerUser)
    );

    await prisma.userAchievement.createMany({
      data: achievements.map((a) => ({
        id: a.id,
        userId: a.userId,
        type: a.type,
        name: a.name,
        description: a.description,
        iconKey: a.iconKey,
        awardedAt: a.awardedAt,
      })),
      skipDuplicates: true,
    });
  }
  console.log(`   Created achievements for ${sampledStudents.length} students`);

  console.log('\n👥 Creating buddy groups (200 groups)...');
  const groupCount = 200;
  for (let i = 0; i < groupCount; i++) {
    const memberIds = studentIds
      .slice(i * BENCHMARK_CONFIG.groupSize, (i + 1) * BENCHMARK_CONFIG.groupSize)
      .slice(0, BENCHMARK_CONFIG.groupSize);

    if (memberIds.length < 2) continue;

    const groupData = createBuddyGroupData(i, memberIds);

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

    await prisma.buddyMember.createMany({
      data: groupData.members.map((m) => ({
        id: m.id,
        groupId: m.groupId,
        userId: m.userId,
        role: m.role as 'LEADER' | 'MEMBER',
        joinedAt: m.joinedAt,
      })),
      skipDuplicates: true,
    });
  }

  console.log('\n📊 Creating behavior logs (sampling 10% of days)...');
  const sampledDays = Math.ceil(BENCHMARK_CONFIG.behaviorDays * 0.1);
  const sampledUserIds = studentIds.filter(() => Math.random() < 0.1);
  
  const logs = generateBehaviorLogsForUsers(sampledUserIds, sampledDays, {
    low: 0.4,
    medium: 0.4,
    high: 0.2,
  });

  for (let i = 0; i < logs.length; i += BENCHMARK_CONFIG.batchSize) {
    const batch = logs.slice(i, i + BENCHMARK_CONFIG.batchSize);
    await prisma.behaviorLog.createMany({
      data: batch.map((log) => ({
        id: log.id,
        userId: log.userId,
        sessionId: log.sessionId,
        path: log.path,
        eventType: log.eventType,
        actionCategory: log.actionCategory,
        duration: log.duration,
        deviceInfo: log.deviceInfo as Prisma.JsonObject,
        payload: log.payload === null ? Prisma.DbNull : (log.payload as Prisma.JsonObject),
        timestamp: log.timestamp,
      })),
      skipDuplicates: true,
    });

    if ((i + BENCHMARK_CONFIG.batchSize) % 5000 === 0) {
      console.log(`   Created ${Math.min(i + BENCHMARK_CONFIG.batchSize, logs.length)} behavior logs`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ BENCHMARK seed completed in ${elapsed}s!`);
  console.log(`   Total users: ${users.length}`);
  console.log(`   Total courses: ${courses.length}`);
  console.log(`   Total behavior logs: ${logs.length}`);
}

seedBenchmark()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
