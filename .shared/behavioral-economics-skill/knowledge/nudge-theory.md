# Nudge Theory - Implementation Guide
## Overview
Nudge Theory (Thaler & Sunstein) uses "Choice Architecture" to influence decision-making without restricting options. V-EdFinance uses this to encourage better financial habits.

## 1. Default Bias (Mặc định)
**Concept:** People tend to stick with pre-set options.
**Implementation:**
- **Smart Defaults:** Pre-fill investment allocations based on risk profile (but allow changes).
- **Auto-Enrollment:** Learning paths are auto-assigned based on initial assessment.

**Code:** `RecommendationService` applies smart defaults.

## 2. Framing Effect (Hiệu ứng khung)
**Concept:** How information is presented affects decisions (Loss Aversion vs. Gain).
**Implementation:**
- **Service:** `FramingService` (`apps/api/src/modules/nudge/framing.service.ts`)
- **Logic:**
  - **Loss Frame:** "You are missing out on $500 compound interest." (Stronger motivator)
  - **Gain Frame:** "Earn $500 by starting today."

**Usage Example:**
```typescript
const message = await framingService.applyFrame({
  content: "Start saving",
  targetBehavior: "SAVING",
  userProfile: { riskAversion: 'HIGH' } // Uses Loss Frame
});
```

## 3. Social Proof (Bằng chứng xã hội)
**Concept:** People follow the herd.
**Implementation:**
- **Service:** `SocialNudgeService`
- **UI:** "85% of users like you started this course."
- **Social Mode:** displaying anonymized peer performance.

## 4. Scarcity & Urgency
**Concept:** Fear of missing out (FOMO).
**Implementation:**
- **Time-limited Challenges:** "Weekend Challenge ends in 4h".
- **Limited Slots:** "Only 5 spots left for live AI mentorship".

## 5. Salience (Sự nổi bật)
**Concept:** Attention is drawn to what is novel or relevant.
**Implementation:**
- **Design System:** Use contrast colors for primary actions (Hooked Trigger).
- **Personalization:** Highlight insights relevant to recent transactions.
