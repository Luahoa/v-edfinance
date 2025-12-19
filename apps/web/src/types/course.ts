export type Level = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
export type LessonType = 'VIDEO' | 'READING' | 'QUIZ';

export interface LocalizedString {
  vi: string;
  en: string;
  zh: string;
}

export interface Course {
  id: string;
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  thumbnailKey: string;
  price: number;
  level: Level;
  createdAt: string;
  updatedAt: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  courseId: string;
  title: LocalizedString;
  content: LocalizedString;
  videoKey?: LocalizedString;
  order: number;
  type: LessonType;
  createdAt: string;
  updatedAt: string;
}
