import { PrismaClient } from '@prisma/client';
import { createBatchUsers } from '../factories/user.factory';
import { createBatchCourses, createCourseLessons } from '../factories/course.factory';

const prisma = new PrismaClient();

const TEST_CONFIG = {
  users: 20,
  courses: 5,
  lessonsPerCourse: 5,
};

async function seedTest() {
  console.log('🧪 Starting TEST seed (minimal for CI/CD)...');

  console.log('\n🗑️  Cleaning database...');
  await prisma.behaviorLog.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  console.log('\n👥 Creating users...');
  const users = createBatchUsers(TEST_CONFIG.users);
  await prisma.user.createMany({
    data: users.map((u) => ({
      id: u.id,
      email: u.email,
      passwordHash: u.passwordHash,
      name: u.name,
      role: u.role,
      points: u.points,
      preferredLocale: u.locale,
    })),
  });
  console.log(`   ✅ Created ${users.length} users`);

  console.log('\n📚 Creating courses...');
  const courses = createBatchCourses(TEST_CONFIG.courses);
  for (const course of courses) {
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

    const lessons = createCourseLessons(course.id, course.level, TEST_CONFIG.lessonsPerCourse);
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
  }
  console.log(`   ✅ Created ${courses.length} courses with lessons`);

  console.log('\n✅ TEST seed completed!');
}

seedTest()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
