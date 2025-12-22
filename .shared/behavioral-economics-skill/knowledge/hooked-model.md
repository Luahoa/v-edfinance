# Hooked Model - Implementation Guide
## Overview
The Hooked Model (Nir Eyal) is V-EdFinance's core engagement engine. It creates habit-forming loops for financial education.

## 1. Trigger (Kích hoạt)
**Concept:** The actuator of behavior.
- **External Triggers:** Notifications, emails, cues.
- **Internal Triggers:** Emotions (fear of missing out, curiosity, anxiety about finances).

**Codebase Implementation:**
- **Service:** `NotificationService`
- **Modules:** `apps/api/src/modules/notifications`
- **Patterns:**
  - `SmartTriggerStrategy`: AI analyzes user behavior to send notifications at optimal times.
  - `EmotionDetector`: Maps user sentiment to trigger appropriate nudges.

**Usage Example:**
```typescript
// Sending an external trigger based on learning gap
await notificationService.sendSmartTrigger({
  userId: user.id,
  type: 'LEARNING_GAP',
  context: { lastLogin: '3 days ago', gap: 'Investment Basics' }
});
```

## 2. Action (Hành động)
**Concept:** The behavior done in anticipation of a reward. Must be easier than thinking (Fogg Behavior Model: B=MAT).

**Codebase Implementation:**
- **Frontend Components:** Quick Actions, One-click learning.
- **Design System:** Low friction UI/UX.
- **Micro-learning:** Lessons under 5 minutes.

## 3. Variable Reward (Phần thưởng biến thiên)
**Concept:** The "scratching of the itch". Variability creates craving (dopamine hit).

**Types of Rewards:**
1.  **Tribe:** Social rewards (Leaderboards, "Verified Investor" badge).
2.  **Hunt:** Material/Info rewards (Coins, Unlockable content, Hidden scenarios).
3.  **Self:** Intrinsic rewards (Mastery, Streak completion).

**Codebase Implementation:**
- **Service:** `GamificationService`
- **Modules:** `apps/api/src/modules/gamification`
- **Patterns:**
  - `RewardEngine`: Randomizes reward magnitude (e.g., 10-50 coins).
  - `MysteryBox`: Unlocks random scenarios.

**Usage Example:**
```typescript
// Distributing variable reward
const reward = await gamificationService.calculateVariableReward({
  actionCheck: 'LESSON_COMPLETE',
  streakMultiplier: user.streakCount
});
// Result: { type: 'COINS', amount: 45, bonus: 'RARE_BADGE' }
```

## 4. Investment (Đầu tư)
**Concept:** User does work to increase the product's value (stored value). Loads the next trigger.

**Forms of Investment:**
- **Data:** Connecting bank accounts, setting goals.
- **Content:** Answering quizzes, journaling.
- **Reputation:** Building a streak.

**Codebase Implementation:**
- **Service:** `PortfolioService`, `GoalService`
- **Modules:** `apps/api/src/modules/portfolio`
- **Logic:** "The more you use it, the better the AI personalized advice becomes."
