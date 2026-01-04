import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { BuddyGroupType, BuddyRole, PostType, Role, Level, LessonType, ProgressStatus, ChatRole, RelationStatus, QuestionType } from "./enums";

export type Achievement = {
    id: Generated<string>;
    key: string;
    name: unknown;
    description: unknown;
    iconKey: string;
    criteria: unknown;
    points: Generated<number>;
    tier: Generated<string>;
    category: string;
    isActive: Generated<boolean>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type BehaviorLog = {
    id: Generated<string>;
    userId: string | null;
    sessionId: string;
    path: string;
    eventType: string;
    actionCategory: Generated<string | null>;
    duration: Generated<number | null>;
    deviceInfo: unknown | null;
    payload: unknown | null;
    timestamp: Generated<Timestamp>;
};
export type BuddyChallenge = {
    id: Generated<string>;
    groupId: string;
    title: unknown;
    target: number;
    rewardPoints: number;
    expiresAt: Timestamp;
};
export type BuddyGroup = {
    id: Generated<string>;
    name: string | null;
    description: string | null;
    type: Generated<BuddyGroupType>;
    totalPoints: Generated<number>;
    streak: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type BuddyMember = {
    id: Generated<string>;
    groupId: string;
    userId: string;
    role: Generated<BuddyRole>;
    joinedAt: Generated<Timestamp>;
};
export type Certificate = {
    id: Generated<string>;
    userId: string;
    courseId: string;
    studentName: unknown;
    courseTitle: unknown;
    completedAt: Generated<Timestamp>;
    pdfUrl: string | null;
    metadata: unknown | null;
    createdAt: Generated<Timestamp>;
};
export type ChatMessage = {
    id: Generated<string>;
    threadId: string;
    role: ChatRole;
    content: string;
    metadata: unknown | null;
    createdAt: Generated<Timestamp>;
};
export type ChatThread = {
    id: Generated<string>;
    userId: string;
    title: string;
    module: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type Course = {
    id: Generated<string>;
    slug: string;
    title: unknown;
    description: unknown;
    thumbnailKey: string;
    price: number;
    level: Generated<Level>;
    published: Generated<boolean>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type InvestmentProfile = {
    id: Generated<string>;
    userId: string;
    riskScore: Generated<number>;
    investmentPhilosophy: unknown;
    financialGoals: unknown;
    currentKnowledge: Generated<Level>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type Lesson = {
    id: Generated<string>;
    courseId: string;
    order: number;
    title: unknown;
    content: unknown;
    videoKey: unknown | null;
    type: Generated<LessonType>;
    duration: number | null;
    published: Generated<boolean>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type ModerationLog = {
    id: Generated<string>;
    userId: string;
    action: string;
    reason: string;
    moderatorId: string | null;
    severity: string | null;
    metadata: unknown | null;
    createdAt: Generated<Timestamp>;
};
export type OptimizationLog = {
    id: Generated<string>;
    queryText: string;
    recommendation: string;
    performanceGain: number | null;
    confidence: number | null;
    source: string | null;
    createdAt: Generated<Timestamp>;
    appliedAt: Timestamp | null;
};
export type Quiz = {
    id: Generated<string>;
    lessonId: string;
    title: unknown;
    description: unknown | null;
    published: Generated<boolean>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type QuizAttempt = {
    id: Generated<string>;
    userId: string;
    quizId: string;
    answers: unknown;
    score: number;
    percentage: number;
    startedAt: Generated<Timestamp>;
    completedAt: Timestamp | null;
};
export type QuizQuestion = {
    id: Generated<string>;
    quizId: string;
    type: QuestionType;
    question: unknown;
    options: unknown | null;
    correctAnswer: unknown;
    points: Generated<number>;
    order: number;
    explanation: unknown | null;
};
export type RefreshToken = {
    id: Generated<string>;
    token: string;
    userId: string;
    expiresAt: Timestamp;
    revoked: Generated<boolean>;
    createdAt: Generated<Timestamp>;
};
export type SimulationCommitment = {
    id: Generated<string>;
    userId: string;
    goalName: string;
    targetAmount: number;
    lockedAmount: number;
    penaltyRate: Generated<number>;
    unlockDate: Timestamp;
    isCompleted: Generated<boolean>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type SimulationScenario = {
    id: Generated<string>;
    userId: string;
    type: string;
    currentStatus: unknown;
    decisions: unknown;
    isActive: Generated<boolean>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type SocialPost = {
    id: Generated<string>;
    userId: string;
    groupId: string | null;
    type: Generated<PostType>;
    content: unknown | null;
    likesCount: Generated<number>;
    createdAt: Generated<Timestamp>;
};
export type SystemSettings = {
    key: string;
    value: string;
    description: string | null;
    updatedAt: Timestamp;
};
export type User = {
    id: Generated<string>;
    email: string;
    passwordHash: string;
    name: unknown | null;
    role: Generated<Role>;
    points: Generated<number>;
    preferredLocale: Generated<string>;
    preferredLanguage: string | null;
    dateOfBirth: Timestamp | null;
    moderationStrikes: Generated<number>;
    failedLoginAttempts: Generated<number>;
    lockedUntil: Timestamp | null;
    metadata: unknown | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type UserAchievement = {
    id: Generated<string>;
    userId: string;
    type: string;
    name: unknown;
    description: unknown;
    iconKey: string;
    awardedAt: Generated<Timestamp>;
};
export type UserChecklist = {
    id: Generated<string>;
    userId: string;
    title: string;
    category: string | null;
    items: unknown;
    progress: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type UserProgress = {
    id: Generated<string>;
    userId: string;
    lessonId: string;
    status: Generated<ProgressStatus>;
    durationSpent: Generated<number>;
    progressPercentage: Generated<number | null>;
    completedAt: Timestamp | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type UserRelationship = {
    id: Generated<string>;
    followerId: string;
    followedId: string;
    status: Generated<RelationStatus>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type UserStreak = {
    id: Generated<string>;
    userId: string;
    currentStreak: Generated<number>;
    longestStreak: Generated<number>;
    lastActivityDate: Generated<Timestamp>;
    streakFrozen: Generated<boolean>;
    freezesRemaining: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type VirtualPortfolio = {
    id: Generated<string>;
    userId: string;
    balance: Generated<number>;
    assets: unknown;
    totalValue: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type DB = {
    Achievement: Achievement;
    BehaviorLog: BehaviorLog;
    BuddyChallenge: BuddyChallenge;
    BuddyGroup: BuddyGroup;
    BuddyMember: BuddyMember;
    Certificate: Certificate;
    ChatMessage: ChatMessage;
    ChatThread: ChatThread;
    Course: Course;
    InvestmentProfile: InvestmentProfile;
    Lesson: Lesson;
    ModerationLog: ModerationLog;
    OptimizationLog: OptimizationLog;
    Quiz: Quiz;
    QuizAttempt: QuizAttempt;
    QuizQuestion: QuizQuestion;
    RefreshToken: RefreshToken;
    SimulationCommitment: SimulationCommitment;
    SimulationScenario: SimulationScenario;
    SocialPost: SocialPost;
    SystemSettings: SystemSettings;
    User: User;
    UserAchievement: UserAchievement;
    UserChecklist: UserChecklist;
    UserProgress: UserProgress;
    UserRelationship: UserRelationship;
    UserStreak: UserStreak;
    VirtualPortfolio: VirtualPortfolio;
};
