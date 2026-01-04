# Phase 1 Implementation Beads - Track 1: Quiz System
# Agent: BlueLake
# File Scope: apps/api/src/modules/quiz/**, apps/web/src/components/quiz/**

## ved-quiz-schema - Add Quiz Models to Prisma Schema
**Type:** task
**Priority:** 0
**Estimate:** 240
**Dependencies:** discovered-from:ved-ahar

Add Quiz, QuizQuestion, QuizAttempt models to Prisma schema.
Follow JSONB pattern for localized content (vi/en/zh).

### Spike Learnings (ved-ahar)
✅ Custom quiz with Zustand validated
📊 4 question types needed: multiple-choice, true/false, short-answer, matching
⚠️ Must support user-specific state (userId in quiz attempts)

### Schema Requirements
```prisma
model Quiz {
  id          String         @id @default(uuid())
  lessonId    String
  title       Json           // { vi: "...", en: "...", zh: "..." }
  description Json?
  published   Boolean        @default(false)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  lesson      Lesson         @relation(fields: [lessonId], references: [id])
  questions   QuizQuestion[]
  attempts    QuizAttempt[]
}

model QuizQuestion {
  id            String       @id @default(uuid())
  quizId        String
  type          QuestionType // enum: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, MATCHING
  question      Json         // Localized
  options       Json?        // For multiple-choice, matching
  correctAnswer Json         // Can be string or array
  points        Int          @default(1)
  order         Int
  quiz          Quiz         @relation(fields: [quizId], references: [id], onDelete: Cascade)
  
  @@unique([quizId, order])
  @@index([quizId])
}

model QuizAttempt {
  id         String   @id @default(uuid())
  userId     String
  quizId     String
  answers    Json     // { questionId: answer }
  score      Int
  percentage Float
  startedAt  DateTime @default(now())
  completedAt DateTime?
  user       User     @relation(fields: [userId], references: [id])
  quiz       Quiz     @relation(fields: [quizId], references: [id])
  
  @@index([userId, quizId])
  @@index([quizId])
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
  MATCHING
}
```

### Acceptance Criteria
- [ ] Models added to schema.prisma
- [ ] Migration created: `npx prisma migrate dev --name add-quiz-models`
- [ ] Types generated: `npx prisma generate`
- [ ] API build passes: `pnpm --filter api build`

---

## ved-quiz-backend - Create Quiz CRUD API
**Type:** task
**Priority:** 0
**Estimate:** 360
**Dependencies:** ved-quiz-schema

Implement NestJS module for Quiz CRUD operations using Drizzle ORM.

### Spike Learnings
✅ Use Drizzle for CRUD (65% faster than Prisma)
📁 Pattern: See existing modules (courses, lessons)

### Files to Create
- `apps/api/src/modules/quiz/quiz.module.ts`
- `apps/api/src/modules/quiz/quiz.controller.ts`
- `apps/api/src/modules/quiz/quiz.service.ts`
- `apps/api/src/modules/quiz/dto/create-quiz.dto.ts`
- `apps/api/src/modules/quiz/dto/update-quiz.dto.ts`

### Endpoints Required
```typescript
// Teacher endpoints
POST   /api/quiz                    // Create quiz
GET    /api/quiz/:id                // Get quiz by ID
PUT    /api/quiz/:id                // Update quiz
DELETE /api/quiz/:id                // Delete quiz
GET    /api/quiz/lesson/:lessonId   // Get quizzes by lesson

// Student endpoints  
GET    /api/quiz/:id/attempt         // Get quiz for attempt (no answers)
POST   /api/quiz/:id/submit          // Submit quiz attempt
GET    /api/quiz/:id/results/:attemptId // Get attempt results
```

### Acceptance Criteria
- [ ] CRUD endpoints implemented
- [ ] Drizzle ORM used for database operations
- [ ] DTOs with validation (class-validator)
- [ ] Auth guards applied (JwtAuthGuard)
- [ ] Role guards (Teacher for create/update/delete)
- [ ] API build passes
- [ ] Postman/Insomnia tests pass

---

## ved-quiz-store - Frontend Zustand Store
**Type:** task
**Priority:** 0
**Estimate:** 180
**Dependencies:** ved-quiz-backend

Create production Zustand store based on spike pattern.

### Spike Pattern
📁 `.spikes/phase1-mvp/quiz-spike/store-pattern.ts`

### File to Create
`apps/web/src/stores/quizStore.ts`

### Changes from Spike
1. Add userId to localStorage key: `quiz-storage-${userId}`
2. Integrate with API (fetch quiz, submit attempt)
3. Add error handling (network failures)
4. Add loading states (skeleton UI)
5. Add retry logic (failed submissions)

### Acceptance Criteria
- [ ] Store created with persist middleware
- [ ] API integration (fetch + submit)
- [ ] localStorage key includes userId
- [ ] Error states handled
- [ ] Reset logic implemented (after submission)
- [ ] TypeScript types from Prisma
- [ ] Web build passes

---

## ved-quiz-components - Quiz UI Components
**Type:** task
**Priority:** 1
**Estimate:** 480
**Dependencies:** ved-quiz-store

Build quiz player components using spike prototype as reference.

### Spike Prototype
📁 `.spikes/phase1-mvp/quiz-spike/prototype/QuizPlayer.tsx`

### Components to Create
```
apps/web/src/components/quiz/
├── QuizPlayer.tsx          // Main container
├── QuestionRenderer.tsx    // Type-based rendering
├── QuizNavigation.tsx      // Previous/Next/Submit
├── QuizResults.tsx         // Score display
├── QuizProgress.tsx        // Progress bar
└── question-types/
    ├── MultipleChoice.tsx
    ├── TrueFalse.tsx
    ├── ShortAnswer.tsx
    └── Matching.tsx
```

### Acceptance Criteria
- [ ] All 4 question types render correctly
- [ ] Navigation working (prev/next/submit)
- [ ] Progress bar shows current question
- [ ] Results screen displays score + time
- [ ] Responsive design (mobile + desktop)
- [ ] i18n integrated (useTranslations)
- [ ] Performance <50ms re-render (spike validated)
- [ ] Accessibility (ARIA labels, keyboard nav)

---

## ved-quiz-builder - Teacher Quiz Builder UI
**Type:** task
**Priority:** 1
**Estimate:** 600
**Dependencies:** ved-quiz-backend

Create teacher interface for building quizzes.

### Pattern
Follow existing lesson builder patterns.

### Components
```
apps/web/src/app/[locale]/teacher/quiz/
├── create/page.tsx         // Quiz creation
├── [id]/edit/page.tsx      // Quiz editing
└── components/
    ├── QuizBuilderForm.tsx
    ├── QuestionEditor.tsx
    └── QuestionList.tsx
```

### Features
- [ ] Drag-and-drop question ordering
- [ ] Question type selector (4 types)
- [ ] Rich text editor for questions
- [ ] Multi-language input (vi/en/zh tabs)
- [ ] Answer validation
- [ ] Preview mode
- [ ] Save draft + Publish

### Acceptance Criteria
- [ ] Can create quiz with all question types
- [ ] Can edit existing quizzes
- [ ] Can reorder questions (drag-drop)
- [ ] Multi-language support working
- [ ] Preview shows student view
- [ ] Validation prevents invalid quizzes
- [ ] Auto-save draft every 30 seconds

---

## ved-quiz-grading - Auto-Grading Logic
**Type:** task
**Priority:** 1
**Estimate:** 240
**Dependencies:** ved-quiz-backend

Implement server-side auto-grading for quiz submissions.

### Spike Pattern
✅ Validated: JSON.stringify comparison works for all question types

### File to Update
`apps/api/src/modules/quiz/quiz.service.ts`

### Grading Logic
```typescript
async gradeQuizAttempt(
  quizId: string,
  userId: string,
  answers: Record<string, any>
): Promise<QuizAttempt> {
  const quiz = await this.getQuizWithQuestions(quizId);
  
  let correct = 0;
  let totalPoints = 0;
  
  quiz.questions.forEach(question => {
    totalPoints += question.points;
    const userAnswer = answers[question.id];
    const correctAnswer = question.correctAnswer;
    
    // Normalize for comparison
    if (this.answersMatch(userAnswer, correctAnswer, question.type)) {
      correct += question.points;
    }
  });
  
  const percentage = (correct / totalPoints) * 100;
  
  return await this.db.quizAttempt.create({
    userId,
    quizId,
    answers,
    score: correct,
    percentage,
    completedAt: new Date()
  });
}

private answersMatch(user: any, correct: any, type: QuestionType): boolean {
  // Type-specific comparison logic
  switch(type) {
    case 'SHORT_ANSWER':
      return user?.toLowerCase().trim() === correct?.toLowerCase().trim();
    case 'MATCHING':
      // Array comparison (order doesn't matter)
      return JSON.stringify(user?.sort()) === JSON.stringify(correct?.sort());
    default:
      return JSON.stringify(user) === JSON.stringify(correct);
  }
}
```

### Acceptance Criteria
- [ ] All question types graded correctly
- [ ] Short answers: case-insensitive, trimmed
- [ ] Matching: order-independent comparison
- [ ] Points calculated correctly
- [ ] Percentage rounded to 2 decimals
- [ ] Attempt saved to database
- [ ] Unit tests written (Jest)
- [ ] Edge cases handled (empty answers, invalid quiz)

---

## ved-quiz-tests - E2E Quiz Tests
**Type:** task
**Priority:** 1
**Estimate:** 240
**Dependencies:** ved-quiz-grading

Write E2E tests for complete quiz flow.

### Test Cases
```
tests/e2e/quiz/
├── teacher-create-quiz.test  // Teacher creates quiz
├── student-take-quiz.test    // Student takes quiz
├── quiz-grading.test         // Auto-grading works
└── quiz-persistence.test     // State persists on refresh
```

### Using E2E Test Agent
```bash
# Natural language test files
echo "Teacher creates quiz, student takes it, score is correct" > tests/e2e/quiz/complete-flow.test
npx tsx run-e2e-tests.ts
```

### Acceptance Criteria
- [ ] Teacher can create quiz (all 4 question types)
- [ ] Student can take quiz
- [ ] Answers persist on page refresh
- [ ] Submission works
- [ ] Score calculated correctly
- [ ] Results display correctly
- [ ] All tests pass (95%+ pass rate)
- [ ] Tests run <3 minutes

---

## Track 1 Summary

**Total Beads:** 7
**Total Estimate:** 2,340 minutes (39 hours ~ 1.5 weeks)
**Agent:** BlueLake
**File Scope:** `apps/api/src/modules/quiz/**, apps/web/src/components/quiz/**`

**Dependencies:**
```
ved-quiz-schema (start)
  → ved-quiz-backend
    → ved-quiz-store
      → ved-quiz-components
    → ved-quiz-builder
    → ved-quiz-grading
      → ved-quiz-tests
```

**Parallel Work:** ved-quiz-builder can start after ved-quiz-backend (independent of store)

**Success Criteria:**
- ✅ All 7 beads closed
- ✅ Quiz system fully functional (create + take + grade)
- ✅ All 4 question types working
- ✅ E2E tests passing
- ✅ Multi-language support (vi/en/zh)
- ✅ Performance validated (<50ms from spike)
