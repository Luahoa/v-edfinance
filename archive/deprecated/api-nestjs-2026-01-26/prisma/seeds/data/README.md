# Seed Data Templates

This directory contains JSON data templates used by seed factories for realistic data generation.

## Files

### courses.json
Template courses for Vietnamese financial education:
- **BEGINNER**: Personal finance basics, smart saving
- **INTERMEDIATE**: Stock market, technical analysis
- **ADVANCED**: Risk management, portfolio optimization

All content is multilingual (vi/en/zh).

### achievements.json
Gamification achievements for behavioral nudges:
- **LEARNING**: First lesson, course completion
- **STREAK**: Daily/weekly streaks
- **SOCIAL**: Group joining, forum participation
- **SIMULATION**: Investment simulation scores
- **MILESTONE**: Major accomplishments

### locales.json
i18n strings for seed data generation:
- Consistent terminology across seeds
- Supports vi (default), en, zh

## Usage

```typescript
import coursesData from './data/courses.json';
import achievementsData from './data/achievements.json';

// Used by factories to generate realistic test data
const course = createCourseFromTemplate(coursesData[0]);
```

## Principles

1. **Realistic Content**: All data reflects actual edtech use cases
2. **Multilingual**: Full vi/en/zh support from day 1
3. **Behavioral Context**: Aligned with Nudge & Hooked theories
4. **Market-Specific**: Vietnamese financial education focus
