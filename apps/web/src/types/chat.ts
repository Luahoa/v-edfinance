export type ChatRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface ChatMessage {
  id: string;
  threadId: string;
  role: ChatRole;
  content: string;
  metadata?: {
    type?: 'SOCRATIC' | 'COACH';
    suggestions?: string[];
  };
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
