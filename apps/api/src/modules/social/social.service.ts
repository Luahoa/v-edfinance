import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BuddyGroupType,
  BuddyRole,
  PostType,
  RelationStatus,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SocialGateway } from './social.gateway';

export interface LocalizedContent {
  vi: string;
  en: string;
  zh: string;
  [key: string]: unknown;
}

@Injectable()
export class SocialService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private socialGateway: SocialGateway,
  ) {}

  async createPost(
    userId: string,
    type: PostType,
    content: LocalizedContent,
    groupId?: string,
  ) {
    const post = await this.prisma.socialPost.create({
      data: {
        userId,
        type,
        content: content as Prisma.InputJsonValue,
        groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            metadata: true,
          },
        },
      },
    });

    try {
      this.socialGateway.broadcastNewPost(post);
    } catch {
      // Broadcast failure should not fail post creation
    }

    return post;
  }

  async getFeed(userId: string, limit = 20, offset = 0) {
    const userGroups = await this.prisma.buddyMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((g) => g.groupId);

    return this.prisma.socialPost.findMany({
      where: {
        OR: [{ groupId: { in: groupIds } }, { groupId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            metadata: true,
          },
        },
      },
    });
  }

  async likePost(userId: string, postId: string) {
    return this.prisma.socialPost.update({
      where: { id: postId },
      data: {
        likesCount: { increment: 1 },
      },
    });
  }

  async commentOnPost(userId: string, postId: string, content: string) {
    return this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: 'social-interaction',
        path: `/social/posts/${postId}/comment`,
        eventType: 'POST_COMMENT',
        payload: { postId, content } as Prisma.InputJsonValue,
      },
    });
  }

  async sendPushNotification(
    userId: string,
    title: LocalizedContent,
    body: LocalizedContent,
    data?: unknown,
  ) {
    console.log(
      `[Push Notification] to ${userId}: ${JSON.stringify(title)} - ${JSON.stringify(body)}`,
    );

    await this.prisma.behaviorLog.create({
      data: {
        userId,
        sessionId: 'system-notification',
        path: '/notification',
        eventType: 'PUSH_SENT',
        payload: { title, body, data } as Prisma.InputJsonValue,
      },
    });
  }

  async createGroup(
    userId: string,
    data: { name: string; description?: string; type?: BuddyGroupType },
  ) {
    return this.prisma.buddyGroup.create({
      data: {
        ...data,
        members: {
          create: {
            userId,
            role: BuddyRole.LEADER,
          },
        },
      },
      include: {
        members: true,
      },
    });
  }

  async joinGroup(userId: string, groupId: string) {
    const group = await this.prisma.buddyGroup.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) throw new Error('Group not found');
    if (group.members.length >= 10) throw new Error('Group is full');

    const member = await this.prisma.buddyMember.create({
      data: {
        userId,
        groupId,
      },
    });

    await this.createPost(
      userId,
      PostType.DISCUSSION,
      {
        vi: `Vừa gia nhập nhóm ${group.name}! Chào mừng thành viên mới nào.`,
        en: `Just joined ${group.name}! Let's welcome the new member.`,
        zh: `刚加入了 ${group.name} 小组！让我们欢迎新成员。`,
      },
      groupId,
    );

    return member;
  }

  async getGroupDetails(groupId: string) {
    return this.prisma.buddyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                points: true,
                metadata: true,
                streaks: true,
              },
            },
          },
        },
        challenges: true,
      },
    });
  }

  async updateGroupStreak(groupId: string) {
    const group = await this.prisma.buddyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: { include: { streaks: true } } } },
      },
    });

    if (!group) return;

    const allActive = group.members.every(
      (m) => m.user.streaks?.currentStreak && m.user.streaks.currentStreak > 0,
    );

    if (allActive) {
      await this.prisma.buddyGroup.update({
        where: { id: groupId },
        data: { streak: { increment: 1 } },
      });

      if ((group.streak + 1) % 7 === 0) {
        await this.createPost(
          group.members[0].userId,
          PostType.MILESTONE,
          {
            vi: `Nhóm ${group.name} đã đạt chuỗi ${group.streak + 1} ngày cùng nhau!`,
            en: `Group ${group.name} reached a ${group.streak + 1}-day streak together!`,
            zh: `${group.name} 小组共同达成了 ${group.streak + 1} 天的学习连击！`,
          },
          groupId,
        );
      }
    } else {
      await this.createPost(
        group.members[0].userId,
        PostType.NUDGE,
        {
          vi: 'Chuỗi ngày của nhóm đang gặp nguy hiểm! Một số thành viên chưa hoàn thành nhiệm vụ hôm nay.',
          en: `Group streak is in danger! Some members haven't finished today's tasks.`,
          zh: '小组的连击处于危险之中！一些成员今天还没有完成任务。',
        },
        groupId,
      );
    }
  }

  async getRecommendedGroups(userId: string) {
    const userProfile = await this.prisma.investmentProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) return this.prisma.buddyGroup.findMany({ take: 3 });

    return this.prisma.buddyGroup.findMany({
      where: {
        type:
          userProfile.currentKnowledge === 'BEGINNER'
            ? BuddyGroupType.LEARNING
            : BuddyGroupType.INVESTING,
      },
      take: 5,
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async createGroupChallenge(
    groupId: string,
    data: {
      title: LocalizedContent;
      target: number;
      rewardPoints: number;
      days: number;
    },
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.days);

    const challenge = await this.prisma.buddyChallenge.create({
      data: {
        groupId,
        title: data.title as Prisma.InputJsonValue,
        target: data.target,
        rewardPoints: data.rewardPoints,
        expiresAt,
      },
    });

    await this.createPost(
      (
        await this.prisma.buddyMember.findFirst({
          where: { groupId, role: BuddyRole.LEADER },
        })
      )?.userId || 'system',
      PostType.MILESTONE,
      {
        vi: `Thử thách mới: ${data.title.vi}! Cùng nhau đạt mục tiêu ${data.target} để nhận ${data.rewardPoints} điểm.`,
        en: `New challenge: ${data.title.en}! Reach ${data.target} together to get ${data.rewardPoints} points.`,
        zh: `新挑战：${data.title.zh}！共同达到 ${data.target} 目标以获得 ${data.rewardPoints} 积分。`,
      },
      groupId,
    );

    return challenge;
  }

  async checkChallengeProgress(challengeId: string) {
    const challenge = await this.prisma.buddyChallenge.findUnique({
      where: { id: challengeId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            members: {
              select: { userId: true, user: { select: { points: true } } },
            },
          },
        },
      },
    });

    if (!challenge) return;

    // Delete challenge if group has no members
    if (challenge.group.members.length === 0) {
      await this.prisma.buddyChallenge.delete({ where: { id: challengeId } });
      return;
    }

    const totalGroupPoints = challenge.group.members.reduce(
      (sum, m) => sum + m.user.points,
      0,
    );

    if (totalGroupPoints >= challenge.target) {
      const memberIds = challenge.group.members.map((m) => m.userId);
      await Promise.all([
        this.prisma.user.updateMany({
          where: { id: { in: memberIds } },
          data: { points: { increment: challenge.rewardPoints } },
        }),
        this.createPost(
          'system',
          PostType.ACHIEVEMENT,
          {
            vi: `Chúc mừng! Nhóm ${challenge.group.name} đã hoàn thành thử thách và nhận ${challenge.rewardPoints} điểm mỗi người.`,
            en: `Congrats! Group ${challenge.group.name} completed the challenge and earned ${challenge.rewardPoints} points each.`,
            zh: `恭喜！${challenge.group.name} 小组完成了挑战，每人获得 ${challenge.rewardPoints} 积分。`,
          },
          challenge.groupId,
        ),
        this.prisma.buddyChallenge.delete({ where: { id: challengeId } }),
      ]);
    } else if (new Date() > challenge.expiresAt) {
      await Promise.all([
        this.createPost(
          'system',
          PostType.NUDGE,
          {
            vi: 'Thử thách thất bại! Nhóm đã bỏ lỡ cơ hội nhận thưởng. Cố gắng hơn ở lần sau nhé.',
            en: 'Challenge failed! The group missed the reward opportunity. Try harder next time.',
            zh: '挑战失败！小组错过了奖励机会。下次要更加努力。',
          },
          challenge.groupId,
        ),
        this.prisma.buddyChallenge.delete({ where: { id: challengeId } }),
      ]);
    }
  }

  async generateCompetitiveNudge(groupId: string) {
    const members = await this.prisma.buddyMember.findMany({
      where: { groupId },
      include: { user: true },
    });

    if (members.length < 2) return null;

    const sortedMembers = [...members].sort(
      (a, b) => b.user.points - a.user.points,
    );
    const leader = sortedMembers[0];
    const second = sortedMembers[1];

    const gap = leader.user.points - second.user.points;

    if (gap > 0) {
      const nudgeContent = {
        vi: `Bạn đang dẫn đầu nhóm với khoảng cách ${gap} điểm! Đừng để ${second.user.email.split('@')[0]} bắt kịp.`,
        en: `You are leading the group by ${gap} points! Don't let ${second.user.email.split('@')[0]} catch up.`,
        zh: `您以 ${gap} 分의优势领先！不要让 ${second.user.email.split('@')[0]} 赶上。`,
        targetUserId: second.userId,
        gap,
      };

      await this.sendPushNotification(
        second.userId,
        { vi: 'Cố lên!', en: 'Keep going!', zh: '加油！' },
        {
          vi: `Bạn chỉ cách ${leader.user.email.split('@')[0]} ${gap} điểm. Học thêm 1 bài để vượt qua nào!`,
          en: `You are only ${gap} points behind ${leader.user.email.split('@')[0]}. Finish one more lesson to overtake!`,
          zh: `你只落后 ${leader.user.email.split('@')[0]} ${gap} 分。再学一课就能超过了！`,
        },
      );

      return this.createPost(
        leader.userId,
        PostType.NUDGE,
        nudgeContent,
        groupId,
      );
    }
    return null;
  }

  // --- Friend/Following System ---

  async sendFriendRequest(senderId: string, receiverId: string) {
    return this.prisma.userRelationship.create({
      data: {
        followerId: senderId,
        followedId: receiverId,
        status: RelationStatus.FRIEND_REQUESTED,
      },
    });
  }

  async acceptFriendRequest(senderId: string, receiverId: string) {
    return this.prisma.$transaction([
      this.prisma.userRelationship.update({
        where: {
          followerId_followedId: {
            followerId: senderId,
            followedId: receiverId,
          },
        },
        data: { status: RelationStatus.FRIENDS },
      }),
      this.prisma.userRelationship.upsert({
        where: {
          followerId_followedId: {
            followerId: receiverId,
            followedId: senderId,
          },
        },
        update: { status: RelationStatus.FRIENDS },
        create: {
          followerId: receiverId,
          followedId: senderId,
          status: RelationStatus.FRIENDS,
        },
      }),
    ]);
  }

  async rejectFriendRequest(senderId: string, receiverId: string) {
    return this.prisma.userRelationship.delete({
      where: {
        followerId_followedId: { followerId: senderId, followedId: receiverId },
      },
    });
  }

  async blockUser(userId: string, targetId: string) {
    return this.prisma.userRelationship.upsert({
      where: {
        followerId_followedId: { followerId: userId, followedId: targetId },
      },
      update: { status: RelationStatus.BLOCKED },
      create: {
        followerId: userId,
        followedId: targetId,
        status: RelationStatus.BLOCKED,
      },
    });
  }

  async unblockUser(userId: string, targetId: string) {
    return this.prisma.userRelationship.delete({
      where: {
        followerId_followedId: { followerId: userId, followedId: targetId },
      },
    });
  }

  async getFriendActivityFeed(userId: string, limit = 20) {
    const friends = await this.prisma.userRelationship.findMany({
      where: {
        followerId: userId,
        status: RelationStatus.FRIENDS,
      },
      select: { followedId: true },
    });

    const friendIds = friends.map((f) => f.followedId);

    return this.prisma.socialPost.findMany({
      where: {
        userId: { in: friendIds },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            metadata: true,
          },
        },
      },
    });
  }
}
