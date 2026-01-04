# Quiz E2E Tests

## Overview
End-to-end tests for the Quiz System (Track 1 - Phase 1 MVP).

## Test Files
1. **1-teacher-create-quiz.test** - Teacher creates quiz with multiple question types
2. **2-student-take-quiz.test** - Student takes quiz and gets perfect score
3. **3-quiz-grading-validation.test** - Auto-grading with mixed correct/incorrect answers
4. **4-quiz-state-persistence.test** - Quiz state persists on page refresh

## Running Tests

### Using e2e-test-agent (Gemini-powered)
```bash
# Run all quiz tests
npx tsx run-e2e-tests.ts tests/e2e/quiz/

# Run specific test
npx tsx run-e2e-tests.ts tests/e2e/quiz/1-teacher-create-quiz.test
```

### Using Playwright (manual)
```bash
# Run with Playwright
pnpm playwright test tests/e2e/quiz/

# Run with UI mode
pnpm playwright test tests/e2e/quiz/ --ui

# Run specific test
pnpm playwright test tests/e2e/quiz/2-student-take-quiz
```

## Test Coverage

### Teacher Flow
- ✅ Create quiz with title/description
- ✅ Add multiple question types (Multiple Choice, True/False, Short Answer)
- ✅ Set correct answers and points
- ✅ Save and publish quiz

### Student Flow
- ✅ Take quiz (all question types)
- ✅ Navigate between questions
- ✅ Submit quiz
- ✅ View results immediately

### Auto-Grading
- ✅ Correct answers marked correctly
- ✅ Incorrect answers marked incorrectly
- ✅ Score calculated accurately
- ✅ Percentage displayed correctly

### State Persistence
- ✅ Answers saved to localStorage
- ✅ State persists on page refresh
- ✅ Can continue quiz from where left off
- ✅ Progress bar maintains position

## Expected Results
- All tests should pass (95%+ pass rate)
- Total execution time: <3 minutes
- Zero critical errors

## Configuration
Tests use the e2e-test-agent with:
- **AI Model**: Google Gemini 2.0 Flash (FREE tier)
- **Browser**: Chromium (Playwright)
- **Viewport**: 1280x720
- **Timeout**: 30s per action

## Notes
- Tests are written in natural language (not TypeScript/JavaScript)
- Gemini AI agent interprets and executes test steps
- Requires `.env.testing` with GEMINI_API_KEY
- Tests run against local dev server (http://localhost:3002)

## Dependencies
- e2e-test-agent
- Playwright MCP
- Google Gemini API (free tier: 1500 requests/day)

## Related Beads
- ved-wzt0: Quiz E2E Tests - Complete Flow (this)
- ved-8alp: E2E Quiz Flow - Quiz Creation and Taking (merged)
