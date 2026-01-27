import { Injectable } from '@nestjs/common';

export interface SocialInteraction {
  userId: string;
  targetUserId?: string;
  type: 'follow' | 'like' | 'comment' | 'share';
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SocialService {
  async recordInteraction(interaction: SocialInteraction): Promise<void> {
    // Stub implementation
  }

  async getFollowers(userId: string): Promise<string[]> {
    // Stub implementation
    return [];
  }

  async getFollowing(userId: string): Promise<string[]> {
    // Stub implementation
    return [];
  }

  async getSocialFeed(userId: string, limit = 20): Promise<unknown[]> {
    // Stub implementation
    return [];
  }
}
