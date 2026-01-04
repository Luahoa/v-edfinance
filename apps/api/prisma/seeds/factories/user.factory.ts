import { copycat } from '@snaplet/copycat';

export interface UserSeedOptions {
  count: number;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  withProgress?: boolean;
  withBehaviorLogs?: boolean;
  activityLevel?: 'low' | 'medium' | 'high';
}

const VIETNAMESE_NAMES = [
  'Nguyễn Văn An',
  'Trần Thị Bình',
  'Lê Hoàng Dũng',
  'Phạm Minh Châu',
  'Võ Đức Thành',
  'Đặng Thu Hà',
  'Hoàng Văn Hùng',
  'Bùi Thị Lan',
  'Đỗ Quang Minh',
  'Ngô Thị Ngọc',
  'Vũ Đình Phong',
  'Phan Thị Quỳnh',
  'Trịnh Văn Sơn',
  'Lý Thị Tâm',
  'Hồ Văn Uy',
  'Nguyễn Thị Mai',
  'Trần Văn Tuấn',
  'Lê Thị Hương',
  'Phạm Quốc Việt',
  'Hoàng Thị Linh',
  'Đỗ Văn Khoa',
  'Vũ Thị Nga',
  'Phan Văn Long',
  'Đinh Thị Hồng',
  'Đặng Văn Tùng',
];

// Financial persona types for EdTech behavioral modeling
const FINANCIAL_PERSONAS = [
  'conservative_saver',     // Risk-averse, prefers savings accounts
  'moderate_investor',      // Balanced approach, mix of stocks & bonds
  'aggressive_trader',      // High-risk tolerance, active trading
  'passive_indexer',        // Long-term, index fund focus
  'curious_learner',        // New to finance, exploring options
] as const;

type FinancialPersona = typeof FINANCIAL_PERSONAS[number];

export function createUserData(index: number, options: Partial<UserSeedOptions> = {}) {
  const role =
    options.role ||
    (copycat.oneOf(index, ['STUDENT', 'STUDENT', 'STUDENT', 'TEACHER', 'ADMIN']) as
      | 'STUDENT'
      | 'TEACHER'
      | 'ADMIN');
  const locale = copycat.oneOf(index, ['vi', 'vi', 'vi', 'en', 'zh']) as 'vi' | 'en' | 'zh';

  const vietnameseName = copycat.oneOf(index, VIETNAMESE_NAMES);
  const englishName = copycat.fullName(index);

  const name =
    locale === 'vi'
      ? { vi: vietnameseName, en: englishName, zh: englishName }
      : { vi: vietnameseName, en: englishName, zh: englishName };

  const birthYear = copycat.int(index, { min: 1979, max: 2006 });
  const birthMonth = copycat.int(index * 2, { min: 1, max: 12 });
  const birthDay = copycat.int(index * 3, { min: 1, max: 28 });

  // Financial profile for persona-based behavioral modeling
  const persona = copycat.oneOf(index, [...FINANCIAL_PERSONAS]) as FinancialPersona;
  const monthlyIncome = copycat.int(index, { min: 5_000_000, max: 50_000_000 }); // VND
  const riskTolerance = persona === 'aggressive_trader' ? 'high' 
    : persona === 'conservative_saver' ? 'low' 
    : 'medium';

  return {
    id: copycat.uuid(index).toString(),
    email: `user${index}@${copycat.oneOf(index, ['gmail.com', 'outlook.com', 'yahoo.com'])}`,
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
    name,
    role,
    points: role === 'STUDENT' ? copycat.int(index, { min: 0, max: 5000 }) : 0,
    locale,
    dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
    metadata: {
      signupSource: copycat.oneOf(index, ['organic', 'referral', 'ads', 'social']),
      deviceType: copycat.oneOf(index, ['mobile', 'desktop', 'tablet']),
      financialPersona: persona,
      monthlyIncome,
      riskTolerance,
      investmentGoals: persona === 'conservative_saver' 
        ? ['emergency_fund', 'retirement']
        : persona === 'aggressive_trader'
          ? ['wealth_growth', 'active_income']
          : ['balanced_growth', 'retirement', 'education'],
    },
    createdAt: new Date(Date.now() - copycat.int(index, { min: 0, max: 90 }) * 24 * 60 * 60 * 1000),
  };
}

export function createBatchUsers(count: number, options: Partial<UserSeedOptions> = {}) {
  return Array.from({ length: count }, (_, i) => createUserData(i, options));
}
