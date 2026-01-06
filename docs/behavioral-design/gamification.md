# Gamification Patterns

## Overview

V-EdFinance uses gamification to drive engagement through **points**, **leaderboards**, **streaks**, **challenges**, and **achievements**. These mechanics create social competition, progression visibility, and intrinsic motivation.

**Core Principle**: Extrinsic rewards (points/badges) must transition to intrinsic motivation (mastery/autonomy) for sustainable engagement.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│            GAMIFICATION SYSTEM FLOW                 │
├─────────────────────────────────────────────────────┤
│  USER ACTION (Lesson/Challenge)                     │
│       ↓                                             │
│  GAMIFICATION SERVICE                               │
│       ↓                                             │
│  POINTS + BEHAVIOR LOG                              │
│       ↓                                             │
│  EVENT EMIT ('points.earned')                       │
│       ↓                                             │
│  ACHIEVEMENTS + LEADERBOARDS + NUDGES               │
│       ↓                                             │
│  SOCIAL POSTS + NOTIFICATIONS                       │
└─────────────────────────────────────────────────────┘
```

---

## 1. Points System

### Core Implementation: GamificationService

Central hub for logging events and awarding points.

[apps/api/src/common/gamification.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/common/gamification.service.ts#L14-L106)

```typescript
async logEvent(
  userId: string,
  eventType: string,
  pointsEarned: number,
  metadata: { isSimulation?: boolean; [key: string]: any } = {},
) {
  const isSimulation = metadata.isSimulation ?? false;

  // High-concurrency optimized updates
  const updateTask = this.prisma.user.update({
    where: { id: userId },
    data: { points: { increment: pointsEarned } },
  });

  const logTask = this.prisma.behaviorLog.create({
    data: {
      userId,
      sessionId: isSimulation ? 'simulation-system' : 'gamification-system',
      path: '/gamification',
      eventType,
      payload: {
        pointsEarned,
        source: 'gamification-service',
        version: '1.1',
        ...metadata,
      },
    },
  });

  // Execute core updates in parallel
  await Promise.all([updateTask, logTask]);

  // Emit event for decouple Nudge/Analytics logic
  this.eventEmitter.emit('points.earned', {
    userId,
    eventType,
    pointsEarned,
    metadata,
  });
}
```

**Design Patterns**:
- **Atomic Operations**: Parallel updates prevent race conditions
- **Event-Driven Architecture**: Decouples points from nudges/analytics
- **Simulation Mode**: Allows testing without polluting production data

### Points Economy

| Event Type | Points | Frequency |
|------------|--------|-----------|
| **Lesson Completed** | 50 | Per lesson |
| **Quiz Passed (80%+)** | 100 | Per quiz |
| **Daily Login** | 10 | Once/day |
| **7-Day Streak** | 200 | Once/week |
| **Group Challenge Won** | Variable | Per challenge |
| **Variable Reward** | 10-60 (random) | 20% probability |

### Point Deduction (Store/Penalties)

```typescript
async deductPoints(userId: string, points: number, reason: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  if (!user || user.points < points) {
    throw new Error('Insufficient points');
  }

  await this.prisma.user.update({
    where: { id: userId },
    data: { points: { decrement: points } },
  });

  await this.prisma.behaviorLog.create({
    data: {
      userId,
      sessionId: 'gamification-system',
      path: '/gamification/deduct',
      eventType: 'POINTS_DEDUCTED',
      payload: { pointsDeducted: points, reason },
    },
  });

  this.eventEmitter.emit('points.deducted', { userId, pointsDeducted: points, reason });
  return true;
}
```

**Use Cases**:
- Store purchases (streak freeze, avatar customization)
- Challenge entry fees
- Early withdrawal penalties

---

## 2. Leaderboards

### Implementation: LeaderboardService

[apps/api/src/modules/leaderboard/leaderboard.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/leaderboard/leaderboard.service.ts#L8-L151)

#### Pattern A: Global Ranking

```typescript
async getGlobalRanking(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  if (!user) throw new Error('User not found');

  const [rank, totalUsers] = await Promise.all([
    this.prisma.user.count({
      where: { points: { gt: user.points } },
    }),
    this.prisma.user.count(),
  ]);

  const percentile = totalUsers > 0 ? (1 - rank / totalUsers) * 100 : 0;

  return {
    rank: rank + 1,
    totalUsers,
    percentile: Number(percentile.toFixed(2)),
    points: user.points,
  };
}
```

**Social Proof Integration**: "You're in the top 15% of users!"

#### Pattern B: Periodic Leaderboards

```typescript
async getPeriodicLeaderboard(
  period: 'daily' | 'weekly' | 'monthly',
  limit = 10,
) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  const logs = await this.prisma.behaviorLog.groupBy({
    by: ['userId'],
    where: {
      eventType: 'POINTS_EARNED',
      timestamp: { gte: startDate },
    },
    _sum: { duration: true },
    orderBy: { _sum: { duration: 'desc' } },
    take: limit,
  });

  // Fetch user details for display
  const userIds = logs.map((l) => l.userId).filter((id): id is string => !!id);
  const users = await this.prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, metadata: true },
  });

  return logs.map((log) => {
    const user = users.find((u) => u.id === log.userId);
    return {
      userId: log.userId,
      points: log._sum.duration || 0,
      displayName:
        (user?.metadata as any)?.displayName ||
        user?.email.split('@')[0] ||
        'Unknown',
    };
  });
}
```

**Reset Strategy**:
- **Daily**: Resets at midnight (local time)
- **Weekly**: Resets Sunday 00:00
- **Monthly**: Resets 1st of month

#### Pattern C: Streak Leaderboard

```typescript
async getStreakLeaderboard(limit = 10) {
  const streaks = await this.prisma.userStreak.findMany({
    take: limit,
    orderBy: { currentStreak: 'desc' },
    include: {
      user: {
        select: { id: true, email: true, metadata: true },
      },
    },
  });

  return streaks.map((streak) => ({
    userId: streak.userId,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    displayName:
      (streak.user.metadata as any)?.displayName ||
      streak.user.email.split('@')[0],
    avatar: (streak.user.metadata as any)?.avatar || null,
  }));
}
```

**Competitive Mechanics**: Separates current vs all-time streaks.

---

## 3. Streaks

### Database Model

[apps/api/prisma/schema.prisma](file:///e:/Demo%20project/v-edfinance/apps/api/prisma/schema.prisma#L278-L293)

```prisma
model UserStreak {
  id               String   @id @default(uuid())
  userId           String   @unique
  currentStreak    Int      @default(0)
  longestStreak    Int      @default(0)
  lastActivityDate DateTime @default(now())
  streakFrozen     Boolean  @default(false)
  freezesRemaining Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([currentStreak])
  @@index([lastActivityDate])
}
```

**Key Features**:
- **Streak Freeze**: Users can buy freezes (store) to protect from 24h lapses
- **Longest Streak**: Tracks all-time best (social proof)
- **Last Activity Date**: Triggers Loss Aversion nudges at 20-24h

### Integration with Loss Aversion

See [nudge-theory.md](nudge-theory.md#pattern-a-streak-loss-warning) for warning logic.

---

## 4. Group Challenges (P2P Gamification)

### Implementation: SocialService

[apps/api/src/modules/social/social.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/social/social.service.ts#L270-L418)

#### Create Group Challenge

```typescript
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
    (await this.prisma.buddyMember.findFirst({
      where: { groupId, role: BuddyRole.LEADER },
    }))?.userId || 'system',
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
```

#### Automatic Progress Checking

```typescript
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

  // Delete expired challenges
  if (challenge.group.members.length === 0) {
    await this.prisma.buddyChallenge.delete({ where: { id: challengeId } });
    return;
  }

  const totalGroupPoints = challenge.group.members.reduce(
    (sum, m) => sum + m.user.points,
    0,
  );

  // Award points if target reached
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
          en: `Congratulations! Group ${challenge.group.name} completed the challenge and earned ${challenge.rewardPoints} points each.`,
          zh: `恭喜！小组 ${challenge.group.name} 完成了挑战，每人获得 ${challenge.rewardPoints} 积分。`,
        },
        challenge.groupId,
      ),
      this.prisma.buddyChallenge.delete({ where: { id: challengeId } }),
    ]);
  }
}
```

**Social Mechanics**:
- **Collaborative Goals**: Entire group earns rewards together
- **Peer Pressure**: Leaderboards within groups show who contributed most
- **Viral Loop**: Winners share achievements publicly

---

## 5. Achievements

### Database Models

[apps/api/prisma/schema.prisma](file:///e:/Demo%20project/v-edfinance/apps/api/prisma/schema.prisma#L256-L384)

#### Achievement Definition (System-Wide)

```prisma
model Achievement {
  id          String   @id @default(uuid())
  key         String   @unique  // e.g., 'FIRST_LESSON', 'STREAK_7'
  name        Json     // Localized name: { vi, en, zh }
  description Json     // Localized description
  iconKey     String   // Asset storage key for icon
  criteria    Json     // Unlock criteria (e.g., { eventType: 'LESSON_COMPLETED', count: 1 })
  points      Int      @default(0)  // Bonus points awarded
  tier        String   @default("BRONZE")  // BRONZE, SILVER, GOLD, PLATINUM
  category    String   // LEARNING, SOCIAL, STREAK, FINANCIAL
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([tier])
  @@index([isActive])
}
```

#### User Achievement (Unlocked)

```prisma
model UserAchievement {
  id          String   @id @default(uuid())
  userId      String
  type        String
  name        Json
  description Json
  iconKey     String
  awardedAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([awardedAt])
  @@index([userId, awardedAt])
}
```

### Achievement Tiers

| Tier | Points Range | Color | Example |
|------|--------------|-------|---------|
| **BRONZE** | 0-100 | 🥉 Brown | First Lesson |
| **SILVER** | 100-500 | 🥈 Gray | 7-Day Streak |
| **GOLD** | 500-1000 | 🥇 Gold | 100 Lessons Completed |
| **PLATINUM** | 1000+ | 💎 Diamond | Top 1% Learner |

---

## 6. Adaptive Progression

### Implementation: AdaptiveService

[apps/api/src/modules/adaptive/adaptive.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/adaptive/adaptive.service.ts#L18-L61)

```typescript
async adjustLearningPath(
  userId: string,
  lessonId: string,
  performance: { score?: number; timeSpent: number },
) {
  let difficultyAdjustment = 'STAY';

  // Simple logic: Adjust based on quiz score
  if (performance.score && performance.score > 80) {
    difficultyAdjustment = 'LEVEL_UP';
  } else if (performance.score && performance.score < 50) {
    difficultyAdjustment = 'REINFORCE';
  }

  // Log adaptive behavior
  await this.prisma.behaviorLog.create({
    data: {
      userId,
      sessionId: 'adaptive-engine',
      path: `/adaptive/adjust/${lessonId}`,
      eventType: 'ADAPTIVE_ADJUSTMENT',
      payload: {
        lessonId,
        performance,
        adjustment: difficultyAdjustment,
      },
    },
  });

  return {
    userId,
    lessonId,
    adjustment: difficultyAdjustment,
    suggestedLevel: difficultyAdjustment === 'LEVEL_UP' ? 'INTERMEDIATE' : 'BEGINNER',
    message:
      difficultyAdjustment === 'LEVEL_UP'
        ? 'Great work! Moving to harder content.'
        : 'Let's reinforce basics first.',
  };
}
```

**Flow State Optimization**:
- **LEVEL_UP (80%+)**: Challenge increases to maintain flow
- **REINFORCE (<50%)**: Simplify to prevent frustration
- **STAY (50-80%)**: Optimal difficulty zone

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **Daily Point Earners** | 50% DAU | TBD |
| **Leaderboard Engagement** | 30% view/week | TBD |
| **Streak Retention (7-day)** | 40% | TBD |
| **Group Challenge Completion** | 60% | TBD |
| **Achievement Unlock Rate** | 2.5/user/month | TBD |

---

## Integration with Behavioral Models

### With Hooked Model
- **Trigger**: Leaderboard rank notifications
- **Action**: Complete lesson to earn points
- **Variable Reward**: Random point bonuses (10-60)
- **Investment**: Unlock achievements, build streak

### With Nudge Theory
- **Social Proof**: "120 friends earned points today"
- **Loss Aversion**: "Protect your 7-day streak!"
- **Framing**: "Earn 100 points" vs "Don't miss 100 points"

See [hooked-model.md](hooked-model.md) and [nudge-theory.md](nudge-theory.md) for integration details.

---

## Related Patterns
- [Hooked Model](hooked-model.md) - Habit formation loop
- [Nudge Theory](nudge-theory.md) - Psychological tactics
- [Social Features](../api/social-system.md) - Group challenges and posts

---

## References
1. Chou, Y. (2015). *Actionable Gamification: Beyond Points, Badges, and Leaderboards*
2. [apps/api/src/common/gamification.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/common/gamification.service.ts) - Central implementation
3. [apps/api/src/modules/leaderboard/](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/leaderboard/) - Ranking system
4. [apps/api/src/modules/social/](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/social/) - Challenges and group mechanics
