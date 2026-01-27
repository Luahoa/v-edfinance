import { PrismaClient, Prisma } from '@prisma/client';
import { createBatchUsers } from '../factories/user.factory';
import { createBatchCourses, createCourseLessons } from '../factories/course.factory';
import { generateBehaviorLogsForUsers } from '../factories/behavior.factory';

const prisma = new PrismaClient();

const DEMO_CONFIG = {
  users: 200,
  courses: 25,
  behaviorDays: 30,
  lessonsPerCourse: { min: 8, max: 20 },
};

async function seedDemo() {
  console.log('🎭 Starting DEMO seed (rich data for sales demos)...');
  console.log(`   Users: ${DEMO_CONFIG.users}`);
  console.log(`   Courses: ${DEMO_CONFIG.courses}`);
  console.log(`   Behavior Days: ${DEMO_CONFIG.behaviorDays}`);

  console.log('\n👥 Creating users...');
  const users = createBatchUsers(DEMO_CONFIG.users);

  const batchSize = 50;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    await prisma.user.createMany({
      data: batch.map((u) => ({
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash,
        name: u.name,
        role: u.role,
        points: u.points,
        preferredLocale: u.locale,
        createdAt: u.createdAt,
      })),
      skipDuplicates: true,
    });
    console.log(`   Progress: ${Math.min(i + batchSize, users.length)}/${users.length}`);
  }
  console.log(`   ✅ Created ${users.length} users`);

  console.log('\n📚 Creating courses with lessons...');
  const courses = createBatchCourses(DEMO_CONFIG.courses);
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const lessonCount =
      Math.floor(
        Math.random() * (DEMO_CONFIG.lessonsPerCourse.max - DEMO_CONFIG.lessonsPerCourse.min),
      ) + DEMO_CONFIG.lessonsPerCourse.min;

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
    await prisma.lesson.createMany({
      data: lessons.map((l) => ({
        id: l.id,
        courseId: l.courseId,
        order: l.order,
        title: l.title,
        content: l.content,
        type: l.type as 'VIDEO' | 'READING' | 'QUIZ' | 'INTERACTIVE',
        duration: l.duration,
        published: l.published,
      })),
      skipDuplicates: true,
    });

    if ((i + 1) % 5 === 0) {
      console.log(`   Progress: ${i + 1}/${courses.length} courses`);
    }
  }
  console.log(`   ✅ Created ${courses.length} courses`);

  console.log('\n📊 Creating behavior logs (this may take a while)...');
  const studentIds = users.filter((u) => u.role === 'STUDENT').map((u) => u.id);

  for (let day = 0; day < DEMO_CONFIG.behaviorDays; day += 5) {
    const daysToProcess = Math.min(5, DEMO_CONFIG.behaviorDays - day);
    const logs = generateBehaviorLogsForUsers(studentIds, daysToProcess);

    const logBatchSize = 500;
    for (let i = 0; i < logs.length; i += logBatchSize) {
      const batch = logs.slice(i, i + logBatchSize);
      await prisma.behaviorLog.createMany({
        data: batch.map((log) => ({
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
        })) as Prisma.BehaviorLogCreateManyInput[],
        skipDuplicates: true,
      });
    }
    console.log(`   Days processed: ${day + daysToProcess}/${DEMO_CONFIG.behaviorDays}`);
  }

  console.log('\n✅ DEMO seed completed!');
  console.log('   Ready for sales demonstrations 🎉');
}

seedDemo()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
