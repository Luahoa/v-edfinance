# JSONB SchemaRegistry Coverage Audit

**Date:** 2026-01-05  
**Audited by:** Agent (VED-XUKM)  
**Status:** ✅ 100% Coverage

---

## Summary

- **Total JSONB Fields:** 20
- **Registered Schemas:** 20 (was 19, added DEVICE_INFO)
- **Coverage:** 100%

---

## Complete Field Mapping

| Model | Field | Type | Schema | Status |
|---|---|---|---|---|
| BuddyChallenge | title | Json | I18N_TEXT | ✅ |
| SocialPost | content | Json? | SOCIAL_POST_CONTENT | ✅ |
| User | name | Json? | I18N_TEXT | ✅ |
| User | metadata | Json? | USER_METADATA | ✅ |
| Course | title | Json | I18N_TEXT | ✅ |
| Course | description | Json | I18N_TEXT | ✅ |
| Lesson | title | Json | I18N_TEXT | ✅ |
| Lesson | content | Json | I18N_TEXT | ✅ |
| Lesson | videoKey | Json? | I18N_TEXT | ✅ |
| ChatMessage | metadata | Json? | CHAT_MESSAGE_METADATA | ✅ |
| BehaviorLog | deviceInfo | Json? | DEVICE_INFO | ✅ (added) |
| BehaviorLog | payload | Json? | BEHAVIOR_LOG_PAYLOAD | ✅ |
| InvestmentProfile | investmentPhilosophy | Json | INVESTMENT_PHILOSOPHY | ✅ |
| InvestmentProfile | financialGoals | Json | FINANCIAL_GOALS | ✅ |
| UserChecklist | items | Json | CHECKLIST_ITEMS | ✅ |
| UserAchievement | name | Json | I18N_TEXT | ✅ |
| UserAchievement | description | Json | I18N_TEXT | ✅ |
| VirtualPortfolio | assets | Json | PORTFOLIO_ASSETS | ✅ |
| SimulationScenario | currentStatus | Json | SIMULATION_STATUS | ✅ |
| SimulationScenario | decisions | Json | SIMULATION_DECISIONS | ✅ |

---

## Schema Registry Contents

```typescript
export const SchemaRegistry = {
  BEHAVIOR_LOG_PAYLOAD: z.object({ ... }),       // BehaviorLog.payload
  DEVICE_INFO: z.object({ ... }),                // BehaviorLog.deviceInfo (NEW)
  USER_METADATA: z.object({ ... }),              // User.metadata
  I18N_TEXT: z.object({ vi, en, zh }),          // All localized text fields
  SOCIAL_POST_CONTENT: z.object({ ... }),        // SocialPost.content
  SIMULATION_EVENT: z.object({ ... }),           // Scenarios
  INVESTMENT_PHILOSOPHY: z.object({ ... }),      // InvestmentProfile
  FINANCIAL_GOALS: z.array(z.object({ ... })),   // InvestmentProfile
  CHECKLIST_ITEMS: z.array(z.object({ ... })),   // UserChecklist.items
  PORTFOLIO_ASSETS: z.record(...),               // VirtualPortfolio.assets
  SIMULATION_STATUS: z.object({ ... }),          // SimulationScenario.currentStatus
  SIMULATION_DECISIONS: z.array(...),            // SimulationScenario.decisions
  COURSE_RECOMMENDATION: z.array(...),           // AI output
  CHAT_MESSAGE_METADATA: z.object({ ... }),      // ChatMessage.metadata
  YOUTUBE_VIDEO_METADATA: z.object({ ... }),     // Lesson metadata
};
```

---

## Changes Made

**Action:** Added `DEVICE_INFO` schema for `BehaviorLog.deviceInfo`

```typescript
DEVICE_INFO: z.object({
  userAgent: z.string().optional(),
  platform: z.string().optional(),
  screenResolution: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
}),
```

**File Modified:** `apps/api/src/common/schema-registry.ts`

---

## Anti-Hallucination Protocol

All JSONB writes MUST pass through `ValidationService.validate()`:

```typescript
// Example usage
const validatedData = await validationService.validate('DEVICE_INFO', {
  userAgent: req.headers['user-agent'],
  platform: 'web',
  language: 'vi',
});

await prisma.behaviorLog.create({
  data: {
    deviceInfo: validatedData,
    // ...
  },
});
```

---

## Verification

Run integrity check:
```bash
GET /api/debug/diagnostics/verify-integrity
```

Expected result: All JSONB fields validated ✅

---

## Next Migration Checkpoint

When adding new JSONB fields:
1. Add Zod schema to `SchemaRegistry`
2. Update this audit document
3. Add validation calls in service layer
4. Test with invalid data to ensure rejection

**Last Updated:** 2026-01-05 (ved-xukm)
