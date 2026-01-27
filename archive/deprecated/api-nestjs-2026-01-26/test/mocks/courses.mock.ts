import { Level, LessonType, type Course, type Lesson } from '@prisma/client';

/**
 * Mock courses with localized content (vi/en/zh).
 */
export const mockCourses: Omit<Course, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'course-001',
    slug: 'personal-finance-basics',
    title: {
      vi: 'Tài Chính Cá Nhân Cơ Bản',
      en: 'Personal Finance Basics',
      zh: '个人理财基础',
    },
    description: {
      vi: 'Học cách quản lý tài chính cá nhân hiệu quả, tiết kiệm và đầu tư thông minh.',
      en: 'Learn how to manage personal finances effectively, save money, and invest wisely.',
      zh: '学习如何有效管理个人财务、储蓄和明智投资。',
    },
    thumbnailKey: 'courses/finance-basics.jpg',
    price: 0,
    level: Level.BEGINNER,
    published: true,
  },
  {
    id: 'course-002',
    slug: 'stock-market-101',
    title: {
      vi: 'Thị Trường Chứng Khoán 101',
      en: 'Stock Market 101',
      zh: '股票市场入门',
    },
    description: {
      vi: 'Khám phá cách thức hoạt động của thị trường chứng khoán và cách đầu tư an toàn.',
      en: 'Discover how the stock market works and how to invest safely.',
      zh: '探索股票市场的运作方式以及如何安全投资。',
    },
    thumbnailKey: 'courses/stock-market.jpg',
    price: 299000,
    level: Level.INTERMEDIATE,
    published: true,
  },
  {
    id: 'course-003',
    slug: 'budgeting-mastery',
    title: {
      vi: 'Làm Chủ Ngân Sách',
      en: 'Budgeting Mastery',
      zh: '预算管理精通',
    },
    description: {
      vi: 'Phương pháp lập và quản lý ngân sách cá nhân để đạt mục tiêu tài chính.',
      en: 'Methods for creating and managing personal budgets to achieve financial goals.',
      zh: '创建和管理个人预算以实现财务目标的方法。',
    },
    thumbnailKey: 'courses/budgeting.jpg',
    price: 199000,
    level: Level.BEGINNER,
    published: true,
  },
  {
    id: 'course-004',
    slug: 'advanced-investment-strategies',
    title: {
      vi: 'Chiến Lược Đầu Tư Nâng Cao',
      en: 'Advanced Investment Strategies',
      zh: '高级投资策略',
    },
    description: {
      vi: 'Kỹ thuật đầu tư chuyên sâu cho nhà đầu tư có kinh nghiệm.',
      en: 'In-depth investment techniques for experienced investors.',
      zh: '面向经验丰富投资者的深度投资技巧。',
    },
    thumbnailKey: 'courses/advanced-investment.jpg',
    price: 599000,
    level: Level.EXPERT,
    published: true,
  },
  {
    id: 'course-005',
    slug: 'retirement-planning',
    title: {
      vi: 'Kế Hoạch Hưu Trí',
      en: 'Retirement Planning',
      zh: '退休规划',
    },
    description: {
      vi: 'Chuẩn bị tài chính cho tuổi già và hưu trí an nhàn.',
      en: 'Financial preparation for old age and comfortable retirement.',
      zh: '为老年和舒适退休做财务准备。',
    },
    thumbnailKey: 'courses/retirement.jpg',
    price: 399000,
    level: Level.INTERMEDIATE,
    published: false,
  },
];

/**
 * Mock lessons for courses with localized content.
 */
export const mockLessons: Omit<Lesson, 'createdAt' | 'updatedAt'>[] = [
  // Lessons for course-001 (Personal Finance Basics)
  {
    id: 'lesson-001-01',
    courseId: 'course-001',
    order: 1,
    title: {
      vi: 'Giới Thiệu Tài Chính Cá Nhân',
      en: 'Introduction to Personal Finance',
      zh: '个人理财简介',
    },
    content: {
      vi: 'Tài chính cá nhân là gì và tại sao nó quan trọng?',
      en: 'What is personal finance and why is it important?',
      zh: '什么是个人理财，为什么重要？',
    },
    videoKey: {
      vi: 'videos/vi/lesson-001-01.mp4',
      en: 'videos/en/lesson-001-01.mp4',
      zh: 'videos/zh/lesson-001-01.mp4',
    },
    type: LessonType.VIDEO,
    duration: 480,
    published: true,
  },
  {
    id: 'lesson-001-02',
    courseId: 'course-001',
    order: 2,
    title: {
      vi: 'Thu Nhập và Chi Tiêu',
      en: 'Income and Expenses',
      zh: '收入与支出',
    },
    content: {
      vi: 'Cách theo dõi và phân tích thu nhập cũng như chi tiêu của bạn.',
      en: 'How to track and analyze your income and expenses.',
      zh: '如何跟踪和分析您的收入和支出。',
    },
    videoKey: {
      vi: 'videos/vi/lesson-001-02.mp4',
      en: 'videos/en/lesson-001-02.mp4',
      zh: 'videos/zh/lesson-001-02.mp4',
    },
    type: LessonType.READING,
    duration: 600,
    published: true,
  },
  {
    id: 'lesson-001-03',
    courseId: 'course-001',
    order: 3,
    title: {
      vi: 'Tiết Kiệm Thông Minh',
      en: 'Smart Saving',
      zh: '智能储蓄',
    },
    content: {
      vi: 'Các phương pháp tiết kiệm hiệu quả cho mục tiêu dài hạn.',
      en: 'Effective saving methods for long-term goals.',
      zh: '实现长期目标的有效储蓄方法。',
    },
    videoKey: {
      vi: 'videos/vi/lesson-001-03.mp4',
      en: 'videos/en/lesson-001-03.mp4',
      zh: 'videos/zh/lesson-001-03.mp4',
    },
    type: LessonType.INTERACTIVE,
    duration: 720,
    published: true,
  },
  // Lessons for course-002 (Stock Market 101)
  {
    id: 'lesson-002-01',
    courseId: 'course-002',
    order: 1,
    title: {
      vi: 'Cổ Phiếu Là Gì?',
      en: 'What Are Stocks?',
      zh: '什么是股票？',
    },
    content: {
      vi: 'Tìm hiểu về cổ phiếu và cách thị trường hoạt động.',
      en: 'Learn about stocks and how the market works.',
      zh: '了解股票及市场运作方式。',
    },
    videoKey: {
      vi: 'videos/vi/lesson-002-01.mp4',
      en: 'videos/en/lesson-002-01.mp4',
      zh: 'videos/zh/lesson-002-01.mp4',
    },
    type: LessonType.VIDEO,
    duration: 900,
    published: true,
  },
  {
    id: 'lesson-002-02',
    courseId: 'course-002',
    order: 2,
    title: {
      vi: 'Phân Tích Cơ Bản',
      en: 'Fundamental Analysis',
      zh: '基本面分析',
    },
    content: {
      vi: 'Cách đánh giá giá trị của một công ty.',
      en: 'How to evaluate the value of a company.',
      zh: '如何评估公司价值。',
    },
    videoKey: null,
    type: LessonType.QUIZ,
    duration: 1200,
    published: true,
  },
];

/**
 * Get mock courses by level.
 */
export function getCoursesByLevel(
  level: Level,
): Omit<Course, 'createdAt' | 'updatedAt'>[] {
  return mockCourses.filter((course) => course.level === level);
}

/**
 * Get mock course by ID.
 */
export function getCourseById(
  id: string,
): Omit<Course, 'createdAt' | 'updatedAt'> | undefined {
  return mockCourses.find((course) => course.id === id);
}

/**
 * Get lessons for a specific course.
 */
export function getLessonsByCourseId(
  courseId: string,
): Omit<Lesson, 'createdAt' | 'updatedAt'>[] {
  return mockLessons.filter((lesson) => lesson.courseId === courseId);
}

/**
 * Get published courses only.
 */
export function getPublishedCourses(): Omit<
  Course,
  'createdAt' | 'updatedAt'
>[] {
  return mockCourses.filter((course) => course.published);
}
