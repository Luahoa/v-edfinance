# Hooked Model Patterns in V-EdFinance

## Overview
V-EdFinance implements Nir Eyal's Hooked Model as the core engagement engine for habit formation in financial education. The four-stage loop (Trigger → Action → Variable Reward → Investment) creates sustained user engagement without relying on manipulation.

**Authority:** Nir Eyal's "Hooked: How to Build Habit-Forming Products" (2014)

---

## The Hooked Loop Architecture

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

## Pattern 1: Trigger - External & Internal

### Overview
The actuator of behavior. External triggers (notifications, emails) transition to internal triggers (emotions like FOMO, curiosity, financial anxiety).

### External Trigger Implementation

**Location:** [apps/api/src/modules/nudge/trigger.service.spec.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/nudge/trigger.service.spec.ts#L38-L125)

**Code Example - Time-Based Trigger (Streak Inactivity):**
```typescript
describe('Streak Inactivity Trigger (20-24h)', () => {
  it('should trigger nudge for user inactive for 22 hours', async () => {
    const twentyTwoHoursAgo = new Date(Date.now() - 22 * 60 * 60 * 1000);
    const mockUsers = [{
      userId: 'user-1',
      currentStreak: 7,
      lastActivityDate: twentyTwoHoursAgo,
      streakFrozen: false,
    }];
    
    await nudgeService.handleStreakNudges();
    
    expect(mockPrisma.behaviorLog.create).toHaveBeenCalledTimes(1);
  });
});
```

**Trigger Window:** 20-24 hours since last activity (critical re-engagement window)

### Internal Trigger Examples

**Location:** [.shared/behavioral-economics-skill/knowledge/hooked-model.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.shared/behavioral-economics-skill/knowledge/hooked-model.md#L5-L25)

**Emotional Triggers Mapped:**
```typescript
// Sending an external trigger that taps into internal emotion
await notificationService.sendSmartTrigger({
  userId: user.id,
  type: 'LEARNING_GAP',
  context: { 
    lastLogin: '3 days ago', 
    gap: 'Investment Basics',
    emotion: 'ANXIETY' // Internal trigger
  }
});

// Emotion-to-Trigger mapping:
// - ANXIETY → "You're falling behind peers" (Social Proof)
// - FOMO → "85% of users completed this today" (Scarcity)
// - CURIOSITY → "Unlock mystery scenario" (Variable Reward)
```

### Trigger Types in Production

| Trigger Type | Context | Example Message | Frequency |
|--------------|---------|-----------------|-----------|
| **Streak Loss** | 20-24h inactivity | "⚠️ Your 7-day streak ends in 2h" | Once per day |
| **Social Proof** | Peer milestone | "120 friends learned today" | Every 6 hours |
| **Goal Gradient** | 90%+ progress | "Only 10% left to finish!" | On login |
| **Learning Gap** | 3+ days idle | "Your peers are 5 lessons ahead" | Every 48 hours |

### Best Practices
- **Transition to Internal:** After 4-6 weeks, external triggers should diminish as user forms habit
- **Optimal Timing:** AI-powered `SmartTriggerStrategy` sends notifications when user is most receptive (evening for financial planning)
- **Fatigue Prevention:** Max 2 external triggers/day (avoid notification burnout)

---

## Pattern 2: Action - Simplest Behavior

### Overview
The behavior done in anticipation of a reward. Must be easier than thinking. Follows Fogg Behavior Model: **B = MAT** (Behavior = Motivation × Ability × Trigger).

### Low-Friction Action Design

**Location:** [apps/web/src/components/organisms/QuickActionsGrid.tsx](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/web/src/components/organisms/QuickActionsGrid.tsx)

**Code Example - One-Click Actions:**
```typescript
// Quick Actions Dashboard (reduces cognitive load)
const quickActions = [
  {
    title: "Start 3-min lesson",
    icon: PlayIcon,
    action: () => router.push('/lessons/quick'),
    effort: 'LOW', // Ability: high
    motivation: 'CURIOSITY', // Motivation: medium
  },
  {
    title: "Log daily spend",
    icon: CoinIcon,
    action: () => openModal('expense-logger'),
    effort: 'VERY_LOW', // Ability: very high
    motivation: 'STREAK', // Motivation: high
  },
];

// Fogg Model validation:
// If effort > motivation, reduce effort (simplify UI)
// If effort = LOW && motivation = HIGH → Action highly likely
```

### Micro-Learning Strategy

**Location:** [.shared/behavioral-economics-skill/knowledge/hooked-model.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.shared/behavioral-economics-skill/knowledge/hooked-model.md#L27-L34)

**Design Principles:**
- **Lessons < 5 minutes** (fits into waiting time, commute)
- **One-tap enrollment** (no forms, no friction)
- **Progressive disclosure** (only show next step, not entire curriculum)

**Anti-Pattern:**
```typescript
// ❌ BAD: High cognitive load
const enrollment = {
  steps: ['Choose plan', 'Payment info', 'Learning path', 'Schedule', 'Confirm'],
  timeEstimate: '15 minutes',
};

// ✅ GOOD: Single-click action
const enrollment = {
  steps: ['Click "Start Free"'],
  timeEstimate: '5 seconds',
  defer: ['Payment', 'Schedule'], // Collect later via Investment phase
};
```

### Action Logging for Reward Phase

**Location:** [apps/api/src/common/gamification.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/common/gamification.service.ts#L14-L61)

```typescript
// Logging user action triggers the Reward phase
await gamificationService.logEvent(
  userId, 
  'LESSON_COMPLETE', 
  basePoints, 
  { lessonId, duration }
);

// This call:
// 1. Records action in BehaviorLog
// 2. Triggers variable reward calculation
// 3. Updates investment profile (learning patterns)
```

---

## Pattern 3: Variable Reward - The Dopamine Driver

### Overview
The "scratching of the itch." Variability creates craving and dopamine release. Implements three reward types: **Tribe** (social), **Hunt** (material), **Self** (intrinsic mastery).

### Reward Algorithms

**Location:** [apps/api/src/modules/nudge/reward.service.spec.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/nudge/reward.service.spec.ts#L63-L156)

#### 1. Variable Ratio (VR-3) - Most Addictive

**Code:**
```typescript
it('should apply RANDOM variable ratio schedule (VR-3: avg 3 actions per reward)', async () => {
  const actions = 10;
  const rewardTriggers: number[] = [];
  
  for (let i = 1; i <= actions; i++) {
    const shouldReward = Math.random() < 1 / 3; // 33% chance per action
    if (shouldReward) {
      rewardTriggers.push(i);
      await gamificationService.logEvent(userId, `ACTION_${i}`, 10, {});
    }
  }
  
  // Expected: ~3 rewards out of 10 actions (unpredictable timing)
  expect(rewardTriggers.length).toBeGreaterThan(0);
});
```

**Use Case:** Lesson completion, quiz attempts (unpredictable bonus rewards)

#### 2. Fixed Interval (FI-5) - Scheduled Rewards

**Code:**
```typescript
it('should apply FIXED interval schedule (FI-5: reward every 5th minute)', async () => {
  const intervals = [0, 4, 5, 10, 14, 15, 20];
  
  for (const minute of intervals) {
    const shouldReward = minute > 0 && minute % 5 === 0; // Every 5 minutes
    if (shouldReward) {
      await gamificationService.logEvent(userId, `INTERVAL_${minute}`, 15, {
        intervalMinute: minute,
      });
    }
  }
  
  expect(mockPrisma.user.update).toHaveBeenCalledTimes(4); // At 5, 10, 15, 20 mins
});
```

**Use Case:** Daily login bonuses, weekly challenges (predictable, builds anticipation)

#### 3. Progressive Streak Multiplier

**Code:**
```typescript
it('should calculate progressive reward multiplier based on streak', async () => {
  const baseReward = 10;
  const streak = await prismaService.userStreak.findUnique({ where: { userId } });
  
  // Multiplier caps at 2.5x (after 15-day streak)
  const multiplier = Math.min(1 + streak.currentStreak * 0.1, 2.5);
  const finalReward = Math.floor(baseReward * multiplier);
  
  // Example: 7-day streak → 1.7x multiplier → 17 points
  expect(finalReward).toBe(17);
  expect(multiplier).toBeCloseTo(1.7, 2);
});
```

**Use Case:** Encourages daily engagement (streak retention)

#### 4. Jackpot Mechanic (1% Chance for 10x)

**Code:**
```typescript
it('should implement jackpot mechanic (1% chance for 10x reward)', async () => {
  const baseReward = 10;
  let jackpotHit = false;
  
  const roll = Math.random();
  if (roll < 0.01) { // 1% chance
    jackpotHit = true;
    await gamificationService.logEvent(userId, 'JACKPOT_HIT', baseReward * 10, {
      jackpot: true,
      roll,
    });
  }
  
  // Expected: 100 points (10x base) when jackpot hits
  expect(jackpotHit).toBe(true);
});
```

**Use Case:** Random "mega rewards" to create memorable moments (shares on social media)

### Three Types of Variable Rewards

#### Tribe (Social Rewards)

**Examples:**
```typescript
const tribeRewards = [
  { type: 'LEADERBOARD_RANK', value: 'Top 10% this week' },
  { type: 'BADGE', value: 'Verified Investor' },
  { type: 'PEER_RECOGNITION', value: '+5 endorsements from cohort' },
];

// Social validation → dopamine release
```

#### Hunt (Material/Info Rewards)

**Examples:**
```typescript
const huntRewards = [
  { type: 'COINS', amount: randomBetween(10, 50) }, // Variable magnitude
  { type: 'UNLOCKABLE_CONTENT', value: 'Hidden scenario: Market Crash 2024' },
  { type: 'MYSTERY_BOX', rarity: 'RARE' }, // Unknown contents
];

// Unpredictability → craving
```

#### Self (Intrinsic Mastery)

**Examples:**
```typescript
const selfRewards = [
  { type: 'STREAK_MILESTONE', value: '30 days completed' },
  { type: 'SKILL_MASTERY', value: 'Options Trading: Expert' },
  { type: 'COMPETENCE', value: 'Portfolio +12% this month' },
];

// Sense of progress → sustained motivation
```

### Near-Miss Mechanics (Advanced Dopamine Trigger)

**Location:** [apps/api/src/modules/nudge/reward.service.spec.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/nudge/reward.service.spec.ts#L454-L485)

**Code:**
```typescript
// "Almost won" feedback (higher dopamine than actual win)
const quizScore = 94; // Out of 100
const threshold = 95; // Needed for rare badge

if (quizScore >= threshold * 0.98 && quizScore < threshold) {
  return {
    message: "🔥 SO CLOSE! 94/100 (need 95 for Rare Badge). Try again!",
    nearMiss: true,
    dopamineBoost: 'HIGH', // Creates anticipation for retry
  };
}
```

**Use Case:** Quiz scores, investment simulations (encourages retry without frustration)

---

## Pattern 4: Investment - Loading the Next Trigger

### Overview
User does work to increase the product's value (stored value). The more they invest, the harder it is to leave. Loads the next trigger by increasing perceived product value.

### Forms of Investment

#### 1. Data Investment (Behavior Analysis)

**Location:** [apps/api/src/behavior/investment-profile.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/behavior/investment-profile.service.ts#L15-L59)

**Code:**
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
      user_query: 'Hãy phân tích hành vi học tập và đầu tư của tôi dựa trên dữ liệu nhật ký',
      locale: 'vi',
    },
    user_profile: {
      logs: logs.map((l) => ({ type: l.eventType, path: l.path })),
      completed_lessons: progress.filter((p) => p.status === 'COMPLETED').length,
    },
  };
  
  // AI analyzes behavior to update investment philosophy
  const analysis = await this.geminiService.generateResponse(prompt);
  
  // Update profile (investment increases product value)
  return this.prisma.investmentProfile.upsert({
    where: { userId },
    update: {
      investmentPhilosophy: validatedPhilosophy,
    },
    create: { /* ... */ },
  });
}
```

**Value Proposition:** "The more you use it, the better the AI personalized advice becomes."

#### 2. Reputation Investment (Streaks)

**Location:** [.shared/behavioral-economics-skill/knowledge/hooked-model.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.shared/behavioral-economics-skill/knowledge/hooked-model.md#L60-L71)

**Examples:**
```typescript
const reputationInvestments = [
  { type: 'STREAK', value: 30, meaning: 'Visible to peers, hard to abandon' },
  { type: 'LEADERBOARD_RANK', value: 'Top 5%', meaning: 'Status to maintain' },
  { type: 'ENDORSEMENTS', value: 12, meaning: 'Social proof to preserve' },
];

// Psychological cost of quitting increases with reputation
```

#### 3. Content Investment (Journaling, Quizzes)

**Examples:**
```typescript
const contentInvestments = [
  { type: 'JOURNAL_ENTRIES', count: 47, meaning: 'Personal data stored in platform' },
  { type: 'QUIZ_ANSWERS', count: 120, meaning: 'Builds personalized learning path' },
  { type: 'GOAL_TRACKING', goals: 5, meaning: 'Platform knows your aspirations' },
];

// Switching cost: Lose all this personalized content
```

### Investment Triggers Next Loop

**Cycle Diagram:**
```
User completes lesson (ACTION)
    ↓
Receives variable reward (REWARD)
    ↓
Prompted to journal insights (INVESTMENT)
    ↓
Journaling updates AI profile (data investment)
    ↓
Next day: "Based on your journal, try this scenario" (TRIGGER)
    ↓
LOOP CONTINUES
```

---

## Full Integration Test: Trigger → Action → Reward → Investment

**Location:** [tests/integration/nudge-behavior-loop.integration.spec.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/tests/integration/nudge-behavior-loop.integration.spec.ts#L37-L341)

**Test Flow:**
```typescript
it('should complete full Hooked loop for user session', async () => {
  // 1. TRIGGER: Streak warning nudge (22h inactivity)
  const trigger = await triggerService.evaluateStreakNudge(userId);
  expect(trigger.type).toBe('STREAK_LOSS');
  
  // 2. ACTION: User logs in and completes lesson (low friction)
  const action = await userService.completeLesson(userId, lessonId);
  expect(action.duration).toBeLessThan(5 * 60); // < 5 minutes
  
  // 3. VARIABLE REWARD: Random points + streak bonus
  const reward = await rewardService.calculateReward(userId, 'LESSON_COMPLETE');
  expect(reward.points).toBeGreaterThanOrEqual(10); // Variable (10-50)
  expect(reward.streakBonus).toBe(true);
  
  // 4. INVESTMENT: Behavior logged, profile updated
  const investment = await investmentService.analyzeBehaviorAndSyncProfile(userId);
  expect(investment.investmentPhilosophy).toBeDefined(); // AI-updated
  
  // 5. NEXT TRIGGER LOADED: New recommendation based on updated profile
  const nextTrigger = await triggerService.getNextRecommendation(userId);
  expect(nextTrigger.context).toContain('Based on your recent learning');
});
```

---

## Best Practices

### 1. Transition External → Internal Triggers
```typescript
// Week 1-2: External triggers (notifications)
await sendNotification('Complete daily lesson');

// Week 4-6: Internal triggers (habit formed)
// User feels anxiety/curiosity without external prompt
// Platform becomes default response to "I want to learn finance"
```

### 2. Variable Reward Timing
- **VR-3 (Random):** For unpredictable tasks (quiz bonuses)
- **FI-5 (Fixed):** For scheduled rituals (daily login)
- **Progressive:** For long-term retention (streak multipliers)

### 3. Investment Visibility
```typescript
// Show investment value to increase switching cost
const dashboardStats = {
  streakDays: 47,
  journalEntries: 120,
  aiInsights: 34,
  message: "Your learning profile is 87% complete. Keep building!",
};
```

### 4. Ethical Design (Not Manipulation)
- **User Control:** Can disable notifications, export data
- **Value First:** Rewards must map to real learning (not fake points)
- **Transparent Mechanics:** Explain how rewards work (no hidden algorithms)

---

## Anti-Patterns

### ❌ Reward Fatigue
```typescript
// BAD: Constant rewards (lose novelty)
await rewardEveryAction(userId);

// GOOD: Variable ratio (unpredictable)
if (Math.random() < 0.3) await rewardAction(userId);
```

### ❌ Friction in Action Phase
```typescript
// BAD: Multi-step enrollment
const steps = ['Form', 'Payment', 'Confirmation']; // 3 minutes

// GOOD: Single-click start
const steps = ['Click "Start Free"']; // 5 seconds
```

### ❌ No Investment Phase
```typescript
// BAD: No data collection
await completeLesson(); // User gets reward but no profile update

// GOOD: Investment loading next trigger
await completeLesson();
await updateLearningProfile(); // Loads next personalized recommendation
```

---

## Performance Considerations

### Caching Variable Rewards
```typescript
// Cache reward multipliers (avoid DB hits on every action)
const streakMultiplier = await redis.get(`streak:${userId}`);
if (!streakMultiplier) {
  const streak = await prisma.userStreak.findUnique({ where: { userId } });
  await redis.set(`streak:${userId}`, calculateMultiplier(streak), { ttl: 3600 });
}
```

### Batch Investment Updates
```typescript
// Update AI profile every 10 actions (not every action)
const actionCount = await redis.incr(`actions:${userId}`);
if (actionCount % 10 === 0) {
  await investmentService.analyzeBehaviorAndSyncProfile(userId);
}
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Trigger → Action Rate** | >40% | % who act after notification |
| **Action → Reward Latency** | <2 seconds | Time to show reward UI |
| **Investment Depth** | >30 data points/user | Journal entries, quiz answers, etc. |
| **Habit Formation** | 30% at Week 4 | % who engage without external trigger |

---

## References

### Internal
- [Trigger Service Tests](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/nudge/trigger.service.spec.ts)
- [Reward Service Tests](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/nudge/reward.service.spec.ts)
- [Investment Profile Service](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/behavior/investment-profile.service.ts)
- [Hooked Model Knowledge Base](file:///c:/Users/luaho/Demo%20project/v-edfinance/.shared/behavioral-economics-skill/knowledge/hooked-model.md)
- [Full Loop Integration Test](file:///c:/Users/luaho/Demo%20project/v-edfinance/tests/integration/nudge-behavior-loop.integration.spec.ts)

### External (Theory)
- Eyal, N. (2014). *Hooked: How to Build Habit-Forming Products*
- Fogg, B. J. (2009). "A Behavior Model for Persuasive Design" (B = MAT)
- Skinner, B. F. (1953). *Science and Human Behavior* (Variable Ratio Schedules)

### Related Patterns
- [Nudge Theory Patterns](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/patterns/NUDGE_THEORY_PATTERNS.md) (previous)
- [Gamification Patterns](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/patterns/GAMIFICATION_PATTERNS.md) (next)
