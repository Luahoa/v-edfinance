# Nudge Theory Implementation

## Overview

V-EdFinance implements **Nudge Theory** (Richard Thaler & Cass Sunstein) to guide users toward better financial decisions through choice architecture, not coercion. All nudges are **transparent** and **reversible**.

**Reference**: Thaler & Sunstein, *Nudge: Improving Decisions About Health, Wealth, and Happiness* (2008)

---

## Core Principles

1. **Libertarian Paternalism**: Guide choices while preserving freedom
2. **Choice Architecture**: Design environments that make good choices easy
3. **Defaults Matter**: Pre-select beneficial options
4. **Transparency**: Users know they're being nudged

---

## Implemented Tactics

### 1. Social Proof

**Concept**: People follow what others do, especially similar peers.

**Implementation**: SocialProofService

[apps/api/src/modules/nudge/social-proof.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/nudge/social-proof.service.ts#L31-L142)

#### Pattern A: Cohort Behavior ("X% of users like you chose this")

```typescript
async generateCohortMessage(
  userId: string,
  action: string,
  targetId?: string,
): Promise<SocialProofNudge | null> {
  const persona = await this.analytics.getUserPersona(userId);
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { investmentProfile: true },
  });

  // Find similar users in cohort
  const cohortData = await this.getCohortBehavior(persona, action, targetId);

  const percentage = Math.round(
    (cohortData.actingUsers / cohortData.totalUsers) * 100,
  );

  return {
    type: 'SOCIAL_PROOF',
    message: this.formatCohortMessage(percentage, action, persona),
    priority: this.calculatePriority(percentage),
    metadata: {
      cohortSize: cohortData.totalUsers,
      percentage,
      comparisonType: 'SIMILAR_USERS',
    },
  };
}
```

**Example Output**:
- `"85% of investors with your profile choose this diversified portfolio"`
- `"120 friends completed this lesson today"`

#### Pattern B: Peer Comparison ("You're outperforming X% of users")

```typescript
async generatePeerComparison(
  userId: string,
  metricType: 'SAVINGS' | 'LEARNING' | 'INVESTMENT',
): Promise<SocialProofNudge | null> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { investmentProfile: true, progress: true },
  });

  const peerData = await this.getPeerMetrics(userId, metricType);
  const userRank = this.calculateUserRank(
    peerData.userValue,
    peerData.peerValues,
  );

  return {
    type: 'SOCIAL_PROOF',
    message: this.formatPeerMessage(metricType, userRank, peerData),
    priority: userRank > 50 ? 'HIGH' : 'MEDIUM',
    metadata: {
      cohortSize: peerData.peerValues.length,
      percentage: userRank,
      comparisonType: 'PEERS',
    },
  };
}
```

#### Pattern C: Social Norms ("X% of users are practicing [habit]")

```typescript
async generateSocialNorm(
  userId: string,
  behaviorType:
    | 'SAVINGS_HABIT'
    | 'INVESTMENT_DIVERSIFICATION'
    | 'LEARNING_CONSISTENCY',
): Promise<SocialProofNudge | null> {
  const normData = await this.getSocialNorm(behaviorType);
  const userAlignment = await this.checkUserAlignment(userId, behaviorType);

  return {
    type: 'SOCIAL_PROOF',
    message: this.formatSocialNormMessage(
      behaviorType,
      normData.percentage,
      userAlignment,
    ),
    priority: userAlignment ? 'LOW' : 'HIGH',
    metadata: {
      cohortSize: normData.totalUsers,
      percentage: normData.percentage,
      comparisonType: 'SOCIAL_NORM',
    },
  };
}
```

**Example Output**:
- `"78% of users save weekly - join the habit!"`
- `"Most investors like you diversify across 5+ sectors"`

---

### 2. Loss Aversion

**Concept**: Losses feel 2x more painful than equivalent gains. Frame messages to protect what users already have.

**Implementation**: LossAversionService

[apps/api/src/modules/nudge/loss-aversion.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/nudge/loss-aversion.service.ts#L13-L111)

#### Pattern A: Streak Loss Warning

```typescript
async generateStreakLossWarning(
  userId: string,
): Promise<LossAversionNudge | null> {
  const streak = await this.prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!streak || streak.currentStreak === 0) {
    return null;
  }

  const hoursSinceActivity = this.getHoursSince(streak.lastActivityDate);

  // Critical window: 20-24 hours
  if (hoursSinceActivity >= 20 && hoursSinceActivity < 24) {
    const streakValue = streak.currentStreak;
    const isHighValue = streakValue >= 7;

    return {
      type: 'STREAK_LOSS',
      message: {
        vi: `⚠️ Chuỗi ${streakValue} ngày của bạn sẽ mất trong ${24 - hoursSinceActivity} giờ nữa! Đừng để công sức của bạn tan biến.`,
        en: `⚠️ Your ${streakValue}-day streak will be lost in ${24 - hoursSinceActivity} hours! Don't let your hard work vanish.`,
        zh: `⚠️ 您的 ${streakValue} 天连续记录将在 ${24 - hoursSinceActivity} 小时内丢失！不要让您的努力白费。`,
      },
      priority: isHighValue ? 'CRITICAL' : 'HIGH',
      metadata: {
        currentStreak: streakValue,
        hoursRemaining: 24 - hoursSinceActivity,
        lastActivity: streak.lastActivityDate,
      },
    };
  }

  return null;
}
```

**Design Choice**: 20-24h window balances urgency without burnout.

#### Pattern B: Goal Gradient Effect ("Don't lose your progress")

```typescript
async generateAboutToLoseNudge(
  userId: string,
  progressPercentage: number,
  goalName: string,
): Promise<LossAversionNudge | null> {
  if (progressPercentage < 70 || progressPercentage >= 100) {
    return null;
  }

  const remaining = 100 - progressPercentage;

  return {
    type: 'ABOUT_TO_LOSE',
    message: {
      vi: `🎯 Bạn đã đạt ${progressPercentage}% mục tiêu "${goalName}". Chỉ còn ${remaining}% nữa - đừng để công sức của bạn đổ sông đổ bể!`,
      en: `🎯 You've reached ${progressPercentage}% of "${goalName}". Only ${remaining}% left - don't let your effort go to waste!`,
      zh: `🎯 您已完成"${goalName}"的 ${progressPercentage}%。只剩 ${remaining}% - 不要让您的努力白费！`,
    },
    priority: progressPercentage >= 90 ? 'CRITICAL' : 'HIGH',
    metadata: {
      goalName,
      progressPercentage,
      remaining,
    },
  };
}
```

**Threshold**: 70-100% progress (maximizes completion rate).

#### Pattern C: Commitment Contracts (Financial Penalties)

```typescript
async generateCommitmentContract(
  userId: string,
  amount: number,
  duration: number,
): Promise<LossAversionNudge | null> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  const formattedAmount = this.formatCurrency(amount);

  return {
    type: 'COMMITMENT_CONTRACT',
    message: {
      vi: `💰 Cam kết khóa ${formattedAmount} trong ${duration} ngày. Nếu rút sớm, bạn sẽ mất 10% phí. Bạn có chắc chắn muốn tiếp tục?`,
      en: `💰 Lock ${formattedAmount} for ${duration} days. Early withdrawal incurs a 10% penalty. Are you sure you want to continue?`,
      zh: `💰 锁定 ${formattedAmount} ${duration} 天。提前取款将产生 10% 的罚款。您确定要继续吗？`,
    },
    priority: 'HIGH',
    metadata: {
      amount,
      duration,
      penaltyRate: 0.1,
    },
  };
}
```

**Behavioral Mechanism**: 10% penalty creates loss aversion stronger than gains from early withdrawal.

---

### 3. Framing

**Concept**: How a choice is presented (gain vs. loss) significantly affects decisions.

**Implementation**: Integrated into LossAversionService

[apps/api/src/modules/nudge/loss-aversion.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/nudge/loss-aversion.service.ts#L113-L151)

#### Adaptive Framing (Persona-Based)

```typescript
async generateFramingNudge(
  userId: string,
  scenario: 'GAIN' | 'LOSS',
  amount: number,
): Promise<LossAversionNudge | null> {
  const formattedAmount = this.formatCurrency(amount);

  // LOSS Framing (for risk-averse SAVERS)
  if (scenario === 'LOSS') {
    return {
      type: 'FRAMING',
      message: {
        vi: `❌ Nếu không hành động ngay, bạn có thể mất ${formattedAmount} trong tương lai do lạm phát.`,
        en: `❌ Without action now, you could lose ${formattedAmount} in the future due to inflation.`,
        zh: `❌ 如果现在不采取行动，由于通货膨胀，您将来可能会损失 ${formattedAmount}。`,
      },
      priority: 'HIGH',
      metadata: { scenario, amount, framing: 'loss' },
    };
  }

  // GAIN Framing (for proactive HUNTERS)
  return {
    type: 'FRAMING',
    message: {
      vi: `✅ Hành động ngay để bảo vệ ${formattedAmount} trước lạm phát.`,
      en: `✅ Act now to protect ${formattedAmount} from inflation.`,
      zh: `✅ 立即采取行动以保护 ${formattedAmount} 免受通货膨胀影响。`,
    },
    priority: 'MEDIUM',
    metadata: { scenario, amount, framing: 'gain' },
  };
}
```

**Selection Logic**:
- **SAVER Persona**: LOSS framing ("Don't lose X")
- **HUNTER Persona**: GAIN framing ("Protect X")
- **Risk Context**: Auto-select LOSS framing

---

### 4. Mapping (Salience)

**Concept**: Abstract numbers mean nothing. Convert to **real-world equivalents** (e.g., "$50 = 1 coffee/week").

**Implementation**: Integrated into NudgeEngineService

[apps/api/src/modules/nudge/nudge-engine.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/nudge/nudge-engine.service.ts#L289-L310)

```typescript
private getBudgetingNudge(user: any, data: any, persona: string) {
  const savings = data.amount;
  const itemsCount = Math.floor(savings / 50000); // 50k VND = 1 coffee

  if (persona === 'SAVER') {
    return {
      type: NudgeType.GOAL_GRADIENT,
      message: {
        vi: `Chỉ còn ${10 - itemsCount} bước nữa là bạn đạt mục tiêu tiết kiệm tháng này!`,
        en: `Just ${10 - itemsCount} more steps to reach your savings goal this month!`,
        zh: `只需再走 ${10 - itemsCount} 步即可实现本月的储蓄目标！`,
      },
      priority: 'HIGH',
    };
  }

  // SALIENCE Mapping for default
  return {
    type: NudgeType.SALIENCE,
    message: {
      vi: `Tiết kiệm khoản này tương đương với ${itemsCount} ly cà phê mỗi tháng.`,
      en: `Saving this is equivalent to ${itemsCount} cups of coffee per month.`,
      zh: `节省这笔钱相当于每月 ${itemsCount} 杯咖啡。`,
    },
    priority: 'MEDIUM',
  };
}
```

**Mapping Strategy**:
- **50,000 VND = 1 cup of coffee** (universal Vietnamese reference)
- **1,000,000 VND = 20 cups = 1 week of coffee**
- **Future**: Expand to meals, transportation, housing

---

## Orchestration: NudgeEngineService

The **NudgeEngineService** acts as the central brain, selecting tactics based on:

1. **User Persona**: HUNTER, SAVER, OBSERVER
2. **Context**: INVESTMENT_DECISION, BUDGETING, STREAK_WARNING
3. **A/B Testing**: 10% traffic gets AI-generated variants

[apps/api/src/modules/nudge/nudge-engine.service.ts](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/nudge/nudge-engine.service.ts#L32-L113)

```typescript
async generateNudge(userId: string, context: string, data: any) {
  const persona = await this.analytics.getUserPersona(userId);
  const baseNudge = await this.getRuleBasedNudge(user, context, data, persona);

  // A/B test AI variants (10% traffic)
  const shouldUseAI = Math.random() < 0.1;

  if (shouldUseAI && this.aiService) {
    try {
      const aiVariant = await this.generateAIVariant(baseNudge, userId);
      await this.trackNudgeVariant(userId, {
        base: baseNudge,
        ai: aiVariant,
        variant: 'AI',
        context,
      });
      return aiVariant;
    } catch (error) {
      console.error('AI variant generation failed:', error);
    }
  }

  return baseNudge;
}
```

---

## Persona-Tactic Matrix

| Persona | Social Proof | Loss Aversion | Framing | Mapping |
|---------|--------------|---------------|---------|---------|
| **HUNTER** | Peer comparison ("Top 20%") | Commitment contracts | GAIN framing | Investment returns |
| **SAVER** | Social norms ("Most save weekly") | Streak protection | LOSS framing | Coffee equivalents |
| **OBSERVER** | Cohort behavior ("85% chose...") | Goal gradient | Neutral data | Educational metaphors |

---

## Ethical Guardrails

1. **Transparency**: Users can disable nudges in settings
2. **No Dark Patterns**: All choices are reversible
3. **Privacy**: Nudges use aggregated, anonymized peer data
4. **Opt-Out**: `/settings/nudges` page allows per-tactic disabling

---

## Integration with Hooked Model

Nudge tactics map to Hooked stages:

- **Trigger**: Social Proof + Loss Aversion → Create urgency
- **Action**: Mapping → Simplify decision-making
- **Variable Reward**: Framing → Enhance perceived value
- **Investment**: All tactics → Increase commitment depth

See [hooked-model.md](hooked-model.md) for detailed integration.

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **Nudge Click-Through Rate** | 25% | TBD |
| **Decision Quality Score** | +15% vs control | TBD |
| **User Trust Score** | >4.2/5 | TBD |
| **Opt-Out Rate** | <5% | TBD |

---

## Related Patterns
- [Hooked Model](hooked-model.md) - Habit formation loop
- [Gamification](gamification.md) - Points and leaderboards
- [Personalization](../ai/personalization.md) - AI-driven nudge selection

---

## References
1. Thaler, R. H., & Sunstein, C. R. (2008). *Nudge: Improving Decisions About Health, Wealth, and Happiness*
2. [AGENTS.md](file:///e:/Demo%20project/v-edfinance/AGENTS.md#L397-L412) - Behavioral design overview
3. [apps/api/src/modules/nudge/](file:///e:/Demo%20project/v-edfinance/apps/api/src/modules/nudge/) - Implementation modules
