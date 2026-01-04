import { copycat } from '@snaplet/copycat';

export interface AchievementSeedOptions {
  count: number;
  category?: string;
  tier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export interface UserStreakSeedOptions {
  userId: string;
  activityLevel?: 'low' | 'medium' | 'high';
}

export interface UserAchievementSeedOptions {
  userId: string;
  achievementCount?: number;
}

const ACHIEVEMENT_CATEGORIES = ['LEARNING', 'SOCIAL', 'STREAK', 'FINANCIAL', 'MILESTONE'] as const;
type AchievementCategory = typeof ACHIEVEMENT_CATEGORIES[number];

const ACHIEVEMENT_TIERS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const;
type AchievementTier = typeof ACHIEVEMENT_TIERS[number];

const ACHIEVEMENT_TEMPLATES = {
  LEARNING: [
    { key: 'first_lesson', name: { vi: 'Bài học đầu tiên', en: 'First Lesson', zh: '第一课' }, points: 10 },
    { key: 'course_complete', name: { vi: 'Hoàn thành khóa học', en: 'Course Complete', zh: '完成课程' }, points: 100 },
    { key: 'quiz_master', name: { vi: 'Bậc thầy quiz', en: 'Quiz Master', zh: '测验大师' }, points: 50 },
    { key: 'fast_learner', name: { vi: 'Học nhanh', en: 'Fast Learner', zh: '快速学习者' }, points: 75 },
    { key: 'knowledge_seeker', name: { vi: 'Người tìm kiến thức', en: 'Knowledge Seeker', zh: '知识追求者' }, points: 150 },
  ],
  SOCIAL: [
    { key: 'first_friend', name: { vi: 'Bạn đầu tiên', en: 'First Friend', zh: '第一个朋友' }, points: 20 },
    { key: 'team_player', name: { vi: 'Đồng đội', en: 'Team Player', zh: '团队合作者' }, points: 50 },
    { key: 'influencer', name: { vi: 'Người ảnh hưởng', en: 'Influencer', zh: '影响者' }, points: 100 },
    { key: 'helper', name: { vi: 'Người giúp đỡ', en: 'Helper', zh: '帮助者' }, points: 30 },
  ],
  STREAK: [
    { key: 'streak_3', name: { vi: 'Chuỗi 3 ngày', en: '3-Day Streak', zh: '3天连续' }, points: 15 },
    { key: 'streak_7', name: { vi: 'Chuỗi 1 tuần', en: 'Week Streak', zh: '一周连续' }, points: 35 },
    { key: 'streak_30', name: { vi: 'Chuỗi 1 tháng', en: 'Month Streak', zh: '一月连续' }, points: 100 },
    { key: 'streak_100', name: { vi: 'Chuỗi 100 ngày', en: '100-Day Streak', zh: '100天连续' }, points: 500 },
  ],
  FINANCIAL: [
    { key: 'first_save', name: { vi: 'Tiết kiệm đầu tiên', en: 'First Save', zh: '第一次储蓄' }, points: 25 },
    { key: 'portfolio_builder', name: { vi: 'Xây dựng danh mục', en: 'Portfolio Builder', zh: '投资组合构建者' }, points: 75 },
    { key: 'smart_investor', name: { vi: 'Nhà đầu tư thông minh', en: 'Smart Investor', zh: '聪明投资者' }, points: 150 },
    { key: 'goal_achiever', name: { vi: 'Đạt mục tiêu', en: 'Goal Achiever', zh: '目标达成者' }, points: 200 },
  ],
  MILESTONE: [
    { key: 'level_up', name: { vi: 'Lên cấp', en: 'Level Up', zh: '升级' }, points: 50 },
    { key: 'first_month', name: { vi: 'Tháng đầu tiên', en: 'First Month', zh: '第一个月' }, points: 100 },
    { key: 'anniversary', name: { vi: 'Kỷ niệm 1 năm', en: 'Anniversary', zh: '周年纪念' }, points: 500 },
  ],
};

export function createAchievementData(index: number, options: Partial<AchievementSeedOptions> = {}) {
  const category: AchievementCategory = options.category as AchievementCategory || copycat.oneOf(index, [...ACHIEVEMENT_CATEGORIES]);
  const tier: AchievementTier = options.tier || copycat.oneOf(index, [...ACHIEVEMENT_TIERS]) as AchievementTier;
  const templates = ACHIEVEMENT_TEMPLATES[category] || ACHIEVEMENT_TEMPLATES.LEARNING;
  const template = copycat.oneOf(index, templates);
  
  const tierMultiplier = { BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 5 }[tier];

  return {
    id: copycat.uuid(index).toString(),
    key: `${template.key}_${tier.toLowerCase()}_${index}`,
    name: template.name,
    description: {
      vi: `Đạt được thành tựu ${template.name.vi}`,
      en: `Achieve ${template.name.en}`,
      zh: `获得 ${template.name.zh}`,
    },
    iconKey: `achievements/${category.toLowerCase()}/${template.key}.svg`,
    criteria: {
      type: category,
      requirement: copycat.int(index, { min: 1, max: 10 }) * tierMultiplier,
    },
    points: template.points * tierMultiplier,
    tier,
    category,
    isActive: true,
    createdAt: new Date(Date.now() - copycat.int(index, { min: 30, max: 180 }) * 24 * 60 * 60 * 1000),
  };
}

export function createUserStreakData(options: UserStreakSeedOptions) {
  const { userId, activityLevel = 'medium' } = options;
  const index = userId.charCodeAt(0);
  
  const streakRanges = {
    low: { current: { min: 0, max: 3 }, longest: { min: 1, max: 7 } },
    medium: { current: { min: 3, max: 14 }, longest: { min: 7, max: 30 } },
    high: { current: { min: 14, max: 60 }, longest: { min: 30, max: 100 } },
  };
  
  const range = streakRanges[activityLevel];
  const currentStreak = copycat.int(index, range.current);
  const longestStreak = Math.max(currentStreak, copycat.int(index * 2, range.longest));
  
  const daysSinceActivity = activityLevel === 'high' ? 0 : copycat.int(index, { min: 0, max: activityLevel === 'low' ? 7 : 2 });

  return {
    id: copycat.uuid(index).toString(),
    userId,
    currentStreak,
    longestStreak,
    lastActivityDate: new Date(Date.now() - daysSinceActivity * 24 * 60 * 60 * 1000),
    streakFrozen: copycat.int(index, { min: 0, max: 10 }) < 1,
    freezesRemaining: copycat.int(index, { min: 0, max: 3 }),
    createdAt: new Date(Date.now() - copycat.int(index, { min: 30, max: 180 }) * 24 * 60 * 60 * 1000),
  };
}

export function createUserAchievementData(
  userAchievementIndex: number,
  options: UserAchievementSeedOptions,
) {
  const { userId } = options;
  const index = userAchievementIndex + userId.charCodeAt(0);
  
  const category: AchievementCategory = copycat.oneOf(index, [...ACHIEVEMENT_CATEGORIES]) as AchievementCategory;
  const templates = ACHIEVEMENT_TEMPLATES[category] || ACHIEVEMENT_TEMPLATES.LEARNING;
  const template = copycat.oneOf(index, templates);

  return {
    id: copycat.uuid(index).toString(),
    userId,
    type: category,
    name: template.name,
    description: {
      vi: `Bạn đã đạt được ${template.name.vi}!`,
      en: `You earned ${template.name.en}!`,
      zh: `您获得了 ${template.name.zh}!`,
    },
    iconKey: `achievements/${category.toLowerCase()}/${template.key}.svg`,
    awardedAt: new Date(Date.now() - copycat.int(index, { min: 0, max: 60 }) * 24 * 60 * 60 * 1000),
  };
}

export function createBatchAchievements(count: number, options: Partial<AchievementSeedOptions> = {}) {
  return Array.from({ length: count }, (_, i) => createAchievementData(i, options));
}

export function createUserAchievements(userId: string, count: number) {
  return Array.from({ length: count }, (_, i) => 
    createUserAchievementData(i, { userId })
  );
}

export function createBuddyGroupData(index: number, memberUserIds: string[]) {
  const groupTypes = ['LEARNING', 'SAVING', 'INVESTING'] as const;
  type GroupType = typeof groupTypes[number];
  const type: GroupType = copycat.oneOf(index, [...groupTypes]) as GroupType;
  
  const groupNames: Record<GroupType, Array<{ vi: string; en: string; zh: string }>> = {
    LEARNING: [
      { vi: 'Nhóm học tập', en: 'Study Group', zh: '学习小组' },
      { vi: 'Câu lạc bộ tài chính', en: 'Finance Club', zh: '金融俱乐部' },
    ],
    SAVING: [
      { vi: 'Nhóm tiết kiệm', en: 'Savings Group', zh: '储蓄小组' },
      { vi: 'Hũ tiết kiệm', en: 'Savings Jar', zh: '储蓄罐' },
    ],
    INVESTING: [
      { vi: 'Câu lạc bộ đầu tư', en: 'Investment Club', zh: '投资俱乐部' },
      { vi: 'Nhóm đầu tư', en: 'Investment Group', zh: '投资小组' },
    ],
  };

  const groupName = copycat.oneOf(index, groupNames[type]);

  return {
    group: {
      id: copycat.uuid(index).toString(),
      name: groupName.en,
      description: `${groupName.vi} - ${groupName.zh}`,
      type,
      totalPoints: copycat.int(index, { min: 0, max: 10000 }),
      streak: copycat.int(index, { min: 0, max: 30 }),
      createdAt: new Date(Date.now() - copycat.int(index, { min: 7, max: 90 }) * 24 * 60 * 60 * 1000),
    },
    members: memberUserIds.map((userId, memberIndex) => ({
      id: copycat.uuid(index * 100 + memberIndex).toString(),
      groupId: copycat.uuid(index).toString(),
      userId,
      role: memberIndex === 0 ? 'LEADER' : 'MEMBER',
      joinedAt: new Date(Date.now() - copycat.int(index * 10 + memberIndex, { min: 1, max: 60 }) * 24 * 60 * 60 * 1000),
    })),
  };
}

export function createBuddyChallengeData(groupId: string, index: number) {
  const challengeTypes = [
    { title: { vi: 'Hoàn thành 5 bài học', en: 'Complete 5 lessons', zh: '完成5节课' }, target: 5, reward: 100 },
    { title: { vi: 'Duy trì streak 7 ngày', en: 'Maintain 7-day streak', zh: '保持7天连续' }, target: 7, reward: 150 },
    { title: { vi: 'Tiết kiệm 1 triệu', en: 'Save 1 million VND', zh: '存100万越南盾' }, target: 1000000, reward: 200 },
    { title: { vi: 'Quiz điểm cao', en: 'High quiz score', zh: '高测验分数' }, target: 90, reward: 75 },
  ];

  const challenge = copycat.oneOf(index, challengeTypes);
  const daysUntilExpiry = copycat.int(index, { min: 3, max: 14 });

  return {
    id: copycat.uuid(index).toString(),
    groupId,
    title: challenge.title,
    target: challenge.target,
    rewardPoints: challenge.reward,
    expiresAt: new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000),
  };
}
