import { ChatRole, LessonType, Level, PrismaClient, ProgressStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed starting...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@v-edfinance.com' },
    update: {},
    create: {
      email: 'admin@v-edfinance.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      preferredLocale: 'vi',
      metadata: { displayName: 'V-EdFinance Admin' },
    },
  });

  // 2. Create Sample Student
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      passwordHash: studentPassword,
      role: Role.STUDENT,
      preferredLocale: 'vi',
      metadata: { displayName: 'Học viên Demo' },
    },
  });

  // 3. Create Sample Course
  const course = await prisma.course.upsert({
    where: { slug: 'tai-chinh-ca-nhan-101' },
    update: {},
    create: {
      slug: 'tai-chinh-ca-nhan-101',
      title: {
        vi: 'Tài Chính Cá Nhân 101',
        en: 'Personal Finance 101',
        zh: '个人理财 101',
      },
      description: {
        vi: 'Khóa học nền tảng về quản lý tài chính cá nhân cho người mới bắt đầu.',
        en: 'Foundational course on personal finance management for beginners.',
        zh: '面向初学者的个人理财 quản lý 基础课程。',
      },
      thumbnailKey: 'courses/finance-101/thumb.jpg',
      price: 0,
      level: Level.BEGINNER,
      published: true,
      lessons: {
        create: [
          {
            order: 1,
            title: {
              vi: 'Tổng quan về tài chính cá nhân',
              en: 'Overview of Personal Finance',
              zh: '个人理财概述',
            },
            content: {
              vi: '# Chào mừng bạn đến với khóa học...',
              en: '# Welcome to the course...',
              zh: '# 欢迎来到课程...',
            },
            videoKey: { vi: 'v1-vi.mp4', en: 'v1-en.mp4' },
            type: LessonType.VIDEO,
            duration: 600,
            published: true,
          },
          {
            order: 2,
            title: {
              vi: 'Lập kế hoạch chi tiêu',
              en: 'Budgeting Fundamentals',
              zh: '预算基础',
            },
            content: {
              vi: '# Cách lập kế hoạch chi tiêu hiệu quả...',
              en: '# How to budget effectively...',
              zh: '# 如何有效制定预算...',
            },
            type: LessonType.READING,
            published: true,
          },
        ],
      },
    },
  });

  // 4. Create Sample Checklist for Demo Student
  await prisma.userChecklist.create({
    data: {
      userId: student.id,
      title: 'Hành trang Tài chính mới',
      category: 'LEARNING',
      items: [
        { text: 'Xem video giới thiệu', completed: false },
        { text: 'Đọc tài liệu PDF', completed: false },
        { text: 'Thực hiện bài kiểm tra đầu vào', completed: false },
      ],
      progress: 0,
    },
  });

  // 5. System Settings
  await prisma.systemSettings.upsert({
    where: { key: 'maintenance_mode' },
    update: {},
    create: {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Khi bật, chỉ Admin mới có thể truy cập hệ thống',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
