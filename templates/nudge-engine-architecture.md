# EdTech Behavioral Engineering Template (Nudge Engine)

This template provides a production-ready **Nudge Engine** based on Behavioral Economics (Richard Thaler & Nir Eyal).

## Core Logic Components

### 1. Nudge Engine (NudgeEngineService)
- **Centralized Decision Hub**: Maps user actions to psychological triggers.
- **Persona Integration**: Tailors nudges based on user archetypes (e.g., HUNTER vs. SAVER).
- **Multi-Market I18n**: Pre-formatted JSONB structure for `vi`, `en`, `zh`.

### 2. Supported Psychological Triggers
- **Social Proof**: "X% of users like you chose this."
- **Loss Aversion**: Framing decisions as potential losses.
- **Goal Gradient**: Encouraging users when they are close to a milestone.
- **Salience**: Converting abstract numbers into real-world value (e.g., $ = Coffee).

## Implementation Pattern (NestJS)

```typescript
@Injectable()
export class NudgeEngineTemplate {
  async generate(userId: string, context: string, data: any) {
    const persona = await this.analytics.getPersona(userId);
    
    // Switch based on context (Investment, Learning, Saving)
    // Apply triggers based on persona
  }
}
```

## Performance Note
Optimized for high-concurrency environments (~150 EPS) with parallel DB logging and batched WS broadcasting.
