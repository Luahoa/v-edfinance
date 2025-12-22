---
description: Implement Behavioral Economics (Hooked Model, Nudge Theory) features
author: V-EdFinance Team
version: 1.0.0
---

# Behavioral Economics Skill

This skill provides expert knowledge and workflows for implementing **Behavioral Economics** principles into the V-EdFinance platform. It covers the **Hooked Model** (Trigger, Action, Reward, Investment) and **Nudge Theory** (Framing, Defaults, Social Proof).

## When to use
Use this skill when:
- Designing new features to increase user engagement.
- Writing copy for notifications or UI text (Framing).
- Implementing gamification logic.
- Analyzing user churn or low retention.

## Core Workflows

### 1. Design a Habit Loop (Hooked Model)
**Command:** `@behavioral design-loop`
**Steps:**
1.  **Define Internal Trigger:** What emotion drives the user? (Boredom, Fear, Hope?)
2.  **Define External Trigger:** How do we notify them? (Push, Email, In-app?)
3.  **Simplify Action:** What is the simplest step they can take? (One-click?)
4.  **Design Variable Reward:** What do they get? Is it predictable? (Make it variable!)
5.  **Ask for Investment:** What data/effort do they put in for future benefit?

### 2. Apply Nudge to UI
**Command:** `@behavioral apply-nudge`
**Steps:**
1.  **Identify Decision:** What choice is the user making?
2.  **Select Nudge Type:**
    - *Default:* Set the best option as pre-selected.
    - *Social Proof:* Show what others are doing.
    - *Framing:* Highlight loss vs gain.
3.  **Generate Copy:** Write 3 variations of the text emphasizing the nudge.

## Code integration
- **Services:** `FramingService`, `GamificationService`, `NotificationService`.
- **Knowledge Base:**
  - [Hooked Model](file:.shared/behavioral-economics-skill/knowledge/hooked-model.md)
  - [Nudge Theory](file:.shared/behavioral-economics-skill/knowledge/nudge-theory.md)
