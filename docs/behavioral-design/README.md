# Behavioral Design Documentation

AI-powered behavioral psychology integration for V-EdFinance using **Nudge Theory** (Richard Thaler) and **Hooked Framework** (Nir Eyal).

## Overview

V-EdFinance uses behavioral science to create sticky, engaging financial education experiences that drive real behavior change.

## Core Frameworks

### 1. Nudge Orchestration (Richard Thaler)

**Engine Design**: Centralized service to calculate and deliver psychological triggers.

**Key Tactics**:
- **Social Proof**: "X% of users like you chose this."
- **Loss Aversion**: "Don't lose your X-day streak."
- **Framing**: Present choices as gains rather than losses.
- **Mapping**: Convert abstract numbers into real-world value (e.g., $ = Coffee).

### 2. Hooked Loop Implementation (Nir Eyal)

**The Hook Model**:
1. **Trigger**: External (Notifications/Nudges) and Internal (Curiosity/Achievement)
2. **Action**: Simplify the most important user action (Single-click decisions)
3. **Variable Reward**: Use AI to generate unpredictable story outcomes or rewards
4. **Investment**: Ask users to put in effort (Locking funds/Building a persona) to increase "stickiness"

## AI-Powered Features

### Persona Modeling
Analyzing `BehaviorLog` to identify psychological profiles and tailor interventions.

### Adaptive Difficulty
Dynamically adjusting content complexity based on user success rate (Flow State).

### Predictive Scenarios
Using LLMs to simulate long-term consequences of short-term decisions.

### Market Simulation
High-scale localized traffic simulation (VI/EN/ZH) to verify sharding integrity.

## Implementation

### Nudge Service
Located at: `apps/api/src/modules/nudge/`

**Capabilities**:
- Real-time nudge calculation
- A/B testing framework
- Multi-lingual message templates
- Trigger timing optimization

### Behavior Tracking
Located at: `apps/api/src/modules/analytics/`

**Metrics**:
- User engagement patterns
- Decision-making timelines
- Streak maintenance
- Social interaction frequency

### AI Integration
Located at: `apps/api/src/modules/ai/`

**Features**:
- Personalized scenario generation
- Mentor response adaptation
- Reward unpredictability

## Design Principles

1. **Ethical First**: Never manipulate for harm - only positive behavior change
2. **Transparency**: Users understand why they receive certain nudges
3. **Control**: Users can adjust or disable behavioral features
4. **Privacy**: All behavioral data is anonymized and encrypted

## Related Documentation

- [Nudge Implementation Guide](nudge-implementation.md) - Technical setup
- [Hooked Loop Patterns](hooked-patterns.md) - Design patterns
- [A/B Testing Results](ab-testing-results.md) - Experiment outcomes
- [Ethics Guidelines](ethics.md) - Behavioral design ethics

## References

- Thaler, R. H., & Sunstein, C. R. (2008). *Nudge: Improving Decisions About Health, Wealth, and Happiness*.
- Eyal, N. (2014). *Hooked: How to Build Habit-Forming Products*.

---

**See [AGENTS.md](../../AGENTS.md) Section "Nudge Orchestration" and "Hooked Loop Implementation" for detailed agent instructions.**
