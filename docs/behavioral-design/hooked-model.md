# Hooked Model Implementation

## Overview

V-EdFinance implements Nir Eyal's **Hooked Model** to create sustainable habit formation in financial education. The four-stage loop (Trigger → Action → Variable Reward → Investment) drives repeated engagement without manipulation.

**Reference**: Nir Eyal, *Hooked: How to Build Habit-Forming Products* (2014)

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   HOOKED MODEL LOOP                  │
├──────────────────────────────────────────────────────┤
│  1. TRIGGER (External/Internal)                      │
│     ↓                                                │
│  2. ACTION (Simplest behavior)                       │
│     ↓                                                │
│  3. VARIABLE REWARD (Tribe/Hunt/Self)                │
│     ↓                                                │
│  4. INVESTMENT (Data/Reputation/Content)             │
│     ↓ (loads next trigger)                           │
│  └──→ LOOP BACK TO TRIGGER                           │
└──────────────────────────────────────────────────────┘
```

---

## Stage 1: Trigger

### Concept
The actuator of behavior. External triggers (notifications, emails) transition to internal triggers (emotions: FOMO, curiosity, financial anxiety).

### Implementation

**NudgeEngineService** - Generates personalized psychological triggers

[apps/api/src/modules/nudge/nudge-engine.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/nudge/nudge-engine.service.ts#L32-L113)

```typescript
async generateNudge(userId: string, context: string, data: any) {
  const persona = await this.analytics.getUserPersona(userId);
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { investmentProfile: true },
  });

  // Get base rule-based nudge
  const baseNudge = await this.getRuleBasedNudge(
    user,
    context,
    safeData,
    persona,
  );

  // Context-specific triggers
  switch (context) {
    case 'INVESTMENT_DECISION':
      return this.getInvestmentNudge(user, safeData, persona);
    case 'STREAK_WARNING':
      return this.getStreakNudge(user, safeData, persona);
    case 'SOCIAL_PROOF_REALTIME':
      return this.getRealtimeSocialNudge(user, safeData, persona);
    default:
      return null;
  }
}
```

**ProactiveTriggersService** - Automated trigger delivery

[apps/api/src/ai/proactive-triggers.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/ai/proactive-triggers.service.ts#L91-L158)

```typescript
@Cron('0 9 * * *') // Daily at 9:00 AM
async checkUnfinishedCourses() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const almostDone = await this.prisma.userProgress.findMany({
    where: {
      progressPercentage: { gte: 80, lt: 100 },
      updatedAt: { lt: sevenDaysAgo },
    },
    include: {
      user: { select: { id: true, email: true, preferredLocale: true } },
      lesson: { select: { id: true, title: true, course: true } },
    },
  });

  for (const cp of almostDone) {
    const nudge = await this.nudgeEngine.generateNudge(
      cp.user.id,
      'COURSE_COMPLETION',
      { courseTitle: cp.lesson.course.title, progress: cp.progressPercentage },
    );

    if (nudge) {
      await this.prisma.behaviorLog.create({
        data: {
          userId: cp.user.id,
          eventType: 'PROACTIVE_NUDGE_SENT',
          actionCategory: 'LEARNING',
          payload: {
            courseId: cp.lesson.course.id,
            message: nudge.message[cp.user.preferredLocale || 'vi'],
          },
        },
      });
    }
  }
}
```

### Trigger Catalog

| Trigger Type | Context | Example | Frequency |
|--------------|---------|---------|-----------|
| **Streak Loss** | 20-24h inactivity | "⚠️ Your 7-day streak ends in 2h" | Once/day |
| **Social Proof** | Peer milestone | "120 friends learned today" | Every 6h |
| **Goal Gradient** | 90%+ progress | "Only 10% left to finish!" | On login |
| **Learning Gap** | 3+ days idle | "Your peers are 5 lessons ahead" | Every 48h |

---

## Stage 2: Action

### Concept
The simplest behavior in anticipation of reward. Must be **frictionless** to maximize completion rate.

### Implementation

**BehaviorService** - Captures low-friction user actions

[apps/api/src/behavior/behavior.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/behavior/behavior.service.ts#L10-L23)

```typescript
async logEvent(userId: string | undefined, dto: LogEventDto) {
  return this.prisma.behaviorLog.create({
    data: {
      userId,
      sessionId: dto.sessionId,
      path: dto.path,
      eventType: dto.eventType,
      actionCategory: dto.actionCategory || 'GENERAL',
      duration: dto.duration || 0,
      deviceInfo: dto.deviceInfo as Prisma.InputJsonValue,
      payload: dto.payload as Prisma.InputJsonValue,
    },
  });
}
```

### Design Principles
- **Single-click actions**: Answer quiz, claim reward, start lesson
- **No form friction**: Pre-filled user data, minimal inputs
- **Progress visibility**: Real-time progress bars during action completion

---

## Stage 3: Variable Reward

### Concept
Unpredictable rewards drive dopamine response. Three reward types:
1. **Tribe**: Social validation (likes, leaderboard rank)
2. **Hunt**: Material rewards (points, badges)
3. **Self**: Competency mastery (level up, unlocked content)

### Implementation

**MentorService** - 20% Variable Ratio (VR) reward schedule

[apps/api/src/modules/analytics/mentor.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/analytics/mentor.service.ts#L70-L103)

```typescript
private async checkAndAwardVariableReward(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logsToday = await this.prisma.behaviorLog.findMany({
    where: {
      userId,
      timestamp: { gte: today },
      eventType: 'LESSON_COMPLETED',
    },
  });

  // 20% chance for surprise reward
  if (logsToday.length > 0 && Math.random() < 0.2) {
    const points = Math.floor(Math.random() * 50) + 10;
    const rewards = [
      { name: 'Hạt giống Lúa Thần', points },
      { name: 'Kinh nghiệm Nhà nông', points },
      { name: 'Túi Phân bón Trí tuệ', points },
    ];
    const selected = rewards[Math.floor(Math.random() * rewards.length)];

    this.eventEmitter.emit('points.earned', {
      userId,
      eventType: 'VARIABLE_REWARD_CLAIMED',
      pointsEarned: selected.points,
      metadata: { rewardName: selected.name },
    });

    return selected;
  }

  return null;
}
```

### Reward Design
- **Variable Ratio Schedule**: 20% reward probability (optimal for habit formation)
- **Random Magnitude**: 10-60 points (increases anticipation)
- **Cultural Theming**: Vietnamese farming metaphors ("Rice Seed", "Wisdom Fertilizer")

---

## Stage 4: Investment

### Concept
User puts effort into the system, increasing **stored value** and commitment. This loads the next trigger.

### Implementation

**InvestmentProfileService** - AI-powered behavioral analysis

[apps/api/src/behavior/investment-profile.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/behavior/investment-profile.service.ts#L15-L65)

```typescript
async analyzeBehaviorAndSyncProfile(userId: string) {
  const logs = await this.prisma.behaviorLog.findMany({
    where: { userId },
    take: 50,
    orderBy: { timestamp: 'desc' },
  });

  const progress = await this.prisma.userProgress.findMany({
    where: { userId },
    include: { lesson: true },
  });

  const prompt = {
    context: {
      user_query:
        'Hãy phân tích hành vi học tập và đầu tư của tôi dựa trên dữ liệu nhật ký và tiến độ.',
      locale: 'vi',
    },
    user_profile: {
      logs: logs.map((l) => ({ type: l.eventType, path: l.path })),
      completed_lessons: progress.filter((p) => p.status === 'COMPLETED').length,
    },
  };

  const analysis = await this.geminiService.generateResponse(prompt);

  const validatedPhilosophy = this.validation.validate(
    'INVESTMENT_PHILOSOPHY',
    { ai_summary: analysis.text },
  );

  // Updates InvestmentProfile with AI insights
  return this.prisma.investmentProfile.upsert({
    where: { userId },
    update: {
      investmentPhilosophy: validatedPhilosophy as unknown as Prisma.InputJsonValue,
    },
    create: {
      userId,
      riskScore: 5,
      investmentPhilosophy: validatedPhilosophy as unknown as Prisma.InputJsonValue,
      financialGoals: [] as unknown as Prisma.InputJsonValue,
      currentKnowledge: Level.BEGINNER,
    },
  });
}
```

### Investment Forms
- **Data**: Completing personality quizzes, logging financial goals
- **Reputation**: Building streaks, earning badges (public profile)
- **Content**: Creating personalized investment portfolios
- **Social Capital**: Inviting friends, joining challenges

---

## Integration with Nudge Theory

The Hooked Model works synergistically with Nudge Theory:

1. **Trigger** uses Loss Aversion ("Don't lose your streak!")
2. **Action** uses Choice Architecture (default options, simple UI)
3. **Variable Reward** uses Social Proof ("You ranked #12 today!")
4. **Investment** uses Commitment Devices (locked savings goals)

See [nudge-theory.md](nudge-theory.md) for detailed tactics.

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **Daily Active Users (DAU)** | 40% | TBD |
| **7-Day Retention** | 60% | TBD |
| **Average Session Length** | 8 minutes | TBD |
| **Trigger → Action Conversion** | 35% | TBD |
| **Variable Reward Claim Rate** | 20% | 20% (by design) |

---

## Related Patterns
- [Nudge Theory](nudge-theory.md) - Psychological tactics for each stage
- [Gamification](gamification.md) - Point systems and leaderboards
- [AI Personalization](../ai/personalization.md) - Adaptive content delivery

---

## References
1. Eyal, N. (2014). *Hooked: How to Build Habit-Forming Products*
2. [patterns/HOOKED_MODEL_PATTERNS.md](file:///e:/Demo%20project/v-edfinance/patterns/HOOKED_MODEL_PATTERNS.md) - Extended implementation guide
3. [docs/behavioral-design/README.md](file:///e:/Demo%20project/v-edfinance/docs/behavioral-design/README.md) - Behavioral framework overview
