export const BuddyGroupType = {
    LEARNING: "LEARNING",
    SAVING: "SAVING",
    INVESTING: "INVESTING"
} as const;
export type BuddyGroupType = (typeof BuddyGroupType)[keyof typeof BuddyGroupType];
export const BuddyRole = {
    LEADER: "LEADER",
    MEMBER: "MEMBER"
} as const;
export type BuddyRole = (typeof BuddyRole)[keyof typeof BuddyRole];
export const PostType = {
    ACHIEVEMENT: "ACHIEVEMENT",
    MILESTONE: "MILESTONE",
    NUDGE: "NUDGE",
    DISCUSSION: "DISCUSSION"
} as const;
export type PostType = (typeof PostType)[keyof typeof PostType];
export const Role = {
    STUDENT: "STUDENT",
    TEACHER: "TEACHER",
    ADMIN: "ADMIN"
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const Level = {
    BEGINNER: "BEGINNER",
    INTERMEDIATE: "INTERMEDIATE",
    EXPERT: "EXPERT"
} as const;
export type Level = (typeof Level)[keyof typeof Level];
export const LessonType = {
    VIDEO: "VIDEO",
    READING: "READING",
    QUIZ: "QUIZ",
    INTERACTIVE: "INTERACTIVE"
} as const;
export type LessonType = (typeof LessonType)[keyof typeof LessonType];
export const ProgressStatus = {
    STARTED: "STARTED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED"
} as const;
export type ProgressStatus = (typeof ProgressStatus)[keyof typeof ProgressStatus];
export const ChatRole = {
    USER: "USER",
    ASSISTANT: "ASSISTANT",
    SYSTEM: "SYSTEM"
} as const;
export type ChatRole = (typeof ChatRole)[keyof typeof ChatRole];
export const RelationStatus = {
    FOLLOWING: "FOLLOWING",
    FRIEND_REQUESTED: "FRIEND_REQUESTED",
    FRIENDS: "FRIENDS",
    BLOCKED: "BLOCKED"
} as const;
export type RelationStatus = (typeof RelationStatus)[keyof typeof RelationStatus];
export const QuestionType = {
    MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
    TRUE_FALSE: "TRUE_FALSE",
    SHORT_ANSWER: "SHORT_ANSWER",
    MATCHING: "MATCHING"
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];
