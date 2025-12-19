# V-EdFinance Skills & Templates System

**Purpose:** Reusable skills and templates for rapid edtech platform development.

---

## 📁 Structure

```
.agents/
  skills/                    # AI-readable skill guides
    ├── nextjs-i18n-setup.md            # Next.js 15 + next-intl i18n
    ├── edtech-monorepo-init.md         # Turborepo setup
    ├── prisma-edtech-schema.md         # Database schemas
    └── ai-integration-gemini.md        # Gemini AI patterns

templates/
  components/                # Frontend component templates
    ├── Button.tsx                      # Atom: Basic button
    ├── CourseCard.tsx                  # Molecule: Course display
    ├── LessonPlayer.tsx                # Organism: Lesson viewer
    └── DashboardLayout.tsx             # Template: Layout wrapper
  api/                       # Backend API templates
    ├── auth.controller.ts              # Authentication endpoints
    ├── base.service.ts                 # Base service class
    └── localized.dto.ts                # Localized field DTOs

AGENTS.md                    # AI agent instructions
ARCHITECTURE.md              # Architecture decision records
SPEC.md                      # Full project specification
```

---

## 🚀 How to Use Skills

### For AI Agents (like Amp)
Skills are designed to be loaded by AI agents when starting similar projects:

```
User: "Start a new edtech platform with Next.js and i18n support"
Agent: [Loads .agents/skills/nextjs-i18n-setup.md]
       [Executes step-by-step setup]
```

### For Developers
Each skill is a complete, executable guide:

1. **Read the skill** (e.g., `nextjs-i18n-setup.md`)
2. **Follow step-by-step instructions**
3. **Copy-paste code snippets**
4. **Verify using checklist**

---

## 📚 Available Skills

### 1. Next.js 15 + next-intl i18n Setup
**File:** `nextjs-i18n-setup.md`  
**Use when:** Starting a new multilingual Next.js app  
**Covers:**
- Root layout setup (mandatory!)
- Locale routing (`/vi`, `/en`, `/zh`)
- Translation file structure
- Middleware configuration
- Common pitfalls & verification

**Tech Stack:**
- Next.js 15.1.2
- React 18.3.1
- next-intl 3.26.3

---

### 2. Edtech Monorepo Initialization
**File:** `edtech-monorepo-init.md`  
**Use when:** Bootstrap full-stack edtech platform  
**Covers:**
- Turborepo setup
- Next.js frontend (apps/web)
- NestJS backend (apps/api)
- Shared packages structure
- Docker PostgreSQL setup
- Development scripts

**Tech Stack:**
- Turborepo
- pnpm workspaces
- Docker Compose

---

### 3. Prisma Edtech Schema Templates
**File:** `prisma-edtech-schema.md`  
**Use when:** Setting up database for learning platforms  
**Covers:**
- User management & authentication
- Course/Lesson models (localized with JSONB)
- Progress tracking
- Gamification (badges, points)
- Behavioral analytics
- Investment profiles (fintech)
- Migration commands
- Seed data examples

**Tech Stack:**
- Prisma 5.x
- PostgreSQL 16

---

### 4. Google Gemini AI Integration
**File:** `ai-integration-gemini.md`  
**Use when:** Adding AI features to edtech platform  
**Covers:**
- Gemini API setup
- NestJS service implementation
- AI-powered Q&A
- Quiz generation
- Content translation
- Behavior analysis
- Rate limiting & caching
- Cost optimization

**Tech Stack:**
- Google Gemini 1.5 Pro
- @google/generative-ai SDK

---

## 🧩 Component Templates

### Frontend (React/Next.js)

**Atoms:**
- `Button.tsx` - Reusable button with variants

**Molecules:**
- `CourseCard.tsx` - Course display with localized content

**Organisms:**
- `LessonPlayer.tsx` - Video/reading lesson player

**Templates:**
- `DashboardLayout.tsx` - Standard dashboard layout

### Backend (NestJS)

- `auth.controller.ts` - Authentication endpoints
- `base.service.ts` - Base CRUD service
- `localized.dto.ts` - DTOs for JSONB localized fields

---

## 🎯 Quick Start Examples

### Scenario 1: New Edtech Project from Scratch

```bash
# 1. Initialize monorepo
[Follow edtech-monorepo-init.md]

# 2. Setup i18n
[Follow nextjs-i18n-setup.md]

# 3. Create database schema
[Copy from prisma-edtech-schema.md]

# 4. Add AI features
[Follow ai-integration-gemini.md]
```

### Scenario 2: Add i18n to Existing Next.js App

```bash
# Just follow nextjs-i18n-setup.md
# Copy translation patterns from templates/
```

### Scenario 3: Clone Component Pattern

```bash
# Copy from templates/components/
# Adapt to your use case
cp templates/components/CourseCard.tsx apps/web/src/components/molecules/
```

---

## 📖 Additional Documentation

### AGENTS.md
- Frequently used commands
- Code style preferences
- Project structure guide
- i18n guidelines
- Quality checklist

### ARCHITECTURE.md
- ADR-001: Why Next.js 15 (not 16)
- ADR-002: Turborepo choice
- ADR-003: JSONB for localization
- ADR-004: Cloudflare + Dokploy deployment
- ADR-005: Zustand state management
- ADR-006: Prisma over TypeORM
- ADR-007: Atomic Design structure
- ADR-008: Google Gemini for AI

### SPEC.md
- Full technical specification
- System architecture
- Database schema (complete)
- API standards
- Quality assurance protocols
- i18n strategy

---

## 🔧 Customization Guide

### Adapting for Different Domains

**E-commerce:**
- Replace `Course` with `Product`
- Replace `Lesson` with `ProductVariant`
- Keep: User, Progress, Behavioral tracking

**Healthcare:**
- Replace `Course` with `Treatment`
- Replace `Lesson` with `Exercise`
- Add: MedicalRecord, Appointment models

**Corporate Training:**
- Keep: Course, Lesson structure as-is
- Add: Team, Organization models
- Modify: Badges → Certifications

---

## 🚨 Common Pitfalls to Avoid

### 1. Missing Root Layout (Next.js 15+)
**Symptom:** Routes return 404, empty build manifests  
**Fix:** Ensure `apps/web/src/app/layout.tsx` exists  
**Reference:** ADR-001 in ARCHITECTURE.md

### 2. JSONB Locale Fallbacks
**Symptom:** Missing translations show `undefined`  
**Fix:** Always fallback to default locale:
```typescript
const title = content.title[locale] || content.title['vi'];
```

### 3. Prisma Client Not Generated
**Symptom:** Import errors for `@prisma/client`  
**Fix:** Run `npx prisma generate` after schema changes

### 4. Monorepo Dependency Issues
**Symptom:** "Module not found" across packages  
**Fix:** Run `pnpm install` at root, not in individual apps

---

## 📊 Metrics & Success Criteria

### Skill Effectiveness
- **Time to scaffold new project:** < 30 minutes
- **Time to add i18n:** < 15 minutes
- **Time to setup database:** < 20 minutes

### Template Reusability
- **Component copy-paste rate:** > 80%
- **API template usage:** > 70%

---

## 🤝 Contributing

### Adding New Skills

1. Create `.agents/skills/new-skill-name.md`
2. Follow existing structure:
   - Purpose & When to use
   - Prerequisites
   - Step-by-step execution
   - Code examples
   - Verification checklist
   - Common pitfalls
   - References
3. Update this README
4. Add ADR if architectural decision

### Adding Templates

1. Create in `templates/components/` or `templates/api/`
2. Use TypeScript strict mode
3. Include JSDoc comments
4. Add to this README

---

## 📞 Support

- **Documentation:** See SPEC.md for full spec
- **Decisions:** See ARCHITECTURE.md for ADRs
- **Commands:** See AGENTS.md for common tasks

---

**Last Updated:** December 2025  
**Version:** 1.0.0  
**Maintainer:** V-EdFinance Team
