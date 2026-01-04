import { ProgressStatus } from '@/types';

export interface UpdateProgressRequest {
  status: ProgressStatus;
  durationSpent: number;
}

export interface UpdateProgressResponse {
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  durationSpent: number;
  completedAt?: string;
}

export class ProgressAPI {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async updateProgress(
    lessonId: string,
    data: UpdateProgressRequest,
    token: string
  ): Promise<UpdateProgressResponse> {
    const response = await fetch(`${this.baseUrl}/courses/lessons/${lessonId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to update progress: ${response.status}`);
    }

    return response.json();
  }

  async getProgress(lessonId: string, token: string): Promise<UpdateProgressResponse | null> {
    const response = await fetch(`${this.baseUrl}/courses/lessons/${lessonId}/progress`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch progress: ${response.status}`);
    }

    return response.json();
  }
}

export const progressAPI = new ProgressAPI();
