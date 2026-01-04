export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface UserProgress {
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  durationSpent: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
