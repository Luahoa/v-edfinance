export type ChatRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface ChatMessageMetadata {
  type?: 'SOCRATIC' | 'COACH' | 'COURSE_LINK' | 'QUIZ' | 'UPDATE_PROFILE';
  suggestions?: string[];
  hasActionCard?: boolean;
  label?: string;
  payload?: unknown;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: ChatRole;
  content: string;
  metadata?: ChatMessageMetadata;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  userId: string;
  title: string;
  module?: string;
  createdAt: string;
  updatedAt: string;
}
