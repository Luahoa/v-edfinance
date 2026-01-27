import { copycat } from '@snaplet/copycat';
import coursesData from '../data/courses.json';

const COURSE_TEMPLATES = coursesData;

const LESSON_TYPES = ['VIDEO', 'READING', 'QUIZ', 'INTERACTIVE'] as const;

// Vietnamese financial education lesson topics
const LESSON_TOPICS_BY_LEVEL = {
  BEGINNER: [
    { vi: 'Ngân sách cá nhân', en: 'Personal Budgeting', zh: '个人预算' },
    { vi: 'Quỹ khẩn cấp', en: 'Emergency Fund', zh: '应急基金' },
    { vi: 'Hiểu về lãi suất', en: 'Understanding Interest Rates', zh: '了解利率' },
    { vi: 'Tài khoản tiết kiệm', en: 'Savings Accounts', zh: '储蓄账户' },
    { vi: 'Lập kế hoạch chi tiêu', en: 'Spending Plan', zh: '支出计划' },
  ],
  INTERMEDIATE: [
    { vi: 'Đọc báo cáo tài chính', en: 'Reading Financial Statements', zh: '阅读财务报表' },
    { vi: 'Phân tích P/E ratio', en: 'P/E Ratio Analysis', zh: '市盈率分析' },
    { vi: 'Đa dạng hóa danh mục', en: 'Portfolio Diversification', zh: '投资组合多元化' },
    { vi: 'Chiến lược đầu tư dài hạn', en: 'Long-term Investment Strategy', zh: '长期投资策略' },
    { vi: 'Quản lý rủi ro', en: 'Risk Management', zh: '风险管理' },
  ],
  EXPERT: [
    { vi: 'Phân tích kỹ thuật nâng cao', en: 'Advanced Technical Analysis', zh: '高级技术分析' },
    { vi: 'Giao dịch phái sinh', en: 'Derivatives Trading', zh: '衍生品交易' },
    { vi: 'Quản lý danh mục chuyên nghiệp', en: 'Professional Portfolio Management', zh: '专业投资组合管理' },
    { vi: 'Phòng ngừa rủi ro', en: 'Risk Hedging', zh: '风险对冲' },
    { vi: 'Chiến lược arbitrage', en: 'Arbitrage Strategies', zh: '套利策略' },
  ],
};

export function createCourseData(index: number) {
  const template = COURSE_TEMPLATES[index % COURSE_TEMPLATES.length];
  
  // Generate slug from Vietnamese title
  const slugBase = template.title.vi
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
  
  const uniqueSlug = index === 0 ? slugBase : `${slugBase}-${index}`;

  return {
    id: copycat.uuid(`course-${index}`).toString(),
    slug: uniqueSlug,
    title: template.title,
    description: template.description,
    thumbnailKey: `courses/${uniqueSlug}/thumbnail.jpg`,
    price: copycat.oneOf(index, [0, 99000, 199000, 299000, 499000]),  // VND pricing
    level: template.level,
    estimatedDuration: template.estimatedDuration,
    published: copycat.int(index, { min: 0, max: 9 }) < 8,  // 80% published rate
    createdAt: new Date(Date.now() - copycat.int(index, { min: 30, max: 180 }) * 24 * 60 * 60 * 1000),
  };
}

export function createLessonData(courseId: string, courseLevel: string, index: number) {
  const lessonType = LESSON_TYPES[index % LESSON_TYPES.length];
  const durations = { VIDEO: 600, READING: 300, QUIZ: 180, INTERACTIVE: 900 };

  // Use realistic lesson topics based on course level
  const topics = LESSON_TOPICS_BY_LEVEL[courseLevel as keyof typeof LESSON_TOPICS_BY_LEVEL] || LESSON_TOPICS_BY_LEVEL.BEGINNER;
  const topic = topics[index % topics.length];

  return {
    id: copycat.uuid(`lesson-${courseId}-${index}`).toString(),
    courseId,
    order: index + 1,
    title: {
      vi: `Bài ${index + 1}: ${topic.vi}`,
      en: `Lesson ${index + 1}: ${topic.en}`,
      zh: `第${index + 1}课: ${topic.zh}`,
    },
    content: {
      vi: `Nội dung chi tiết về ${topic.vi.toLowerCase()}. ${copycat.paragraph(index, { minSentences: 3, maxSentences: 6 })}`,
      en: `Detailed content about ${topic.en.toLowerCase()}. ${copycat.paragraph(index * 2, { minSentences: 3, maxSentences: 6 })}`,
      zh: `关于${topic.zh}的详细内容。${copycat.paragraph(index * 3, { minSentences: 2, maxSentences: 4 })}`,
    },
    type: lessonType,
    duration: durations[lessonType],
    published: true,
  };
}

export function createBatchCourses(count: number) {
  return Array.from({ length: count }, (_, i) => createCourseData(i));
}

export function createCourseLessons(courseId: string, courseLevel: string, count: number) {
  return Array.from({ length: count }, (_, i) => createLessonData(courseId, courseLevel, i));
}
