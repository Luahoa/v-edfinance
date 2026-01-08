## Description

<!-- Briefly describe what this PR changes -->

Fixes #(issue number)

## Type of Change

<!-- Check all that apply -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test addition or update
- [ ] 🔧 Configuration change
- [ ] 🎨 UI/UX improvement

## Changes Made

<!-- List the main changes -->

- 
- 
- 

## Testing

<!-- Describe how you tested this PR -->

### Manual Testing

- [ ] Tested locally on `localhost:3000` (frontend)
- [ ] Tested locally on `localhost:3001` (backend)
- [ ] Tested all affected pages/endpoints
- [ ] Tested error scenarios

### Automated Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] All tests pass: `pnpm test`

### Screenshots (if UI changes)

<!-- Add screenshots or videos here -->

## Code Quality Checklist

- [ ] Code follows the [style guide](CONTRIBUTING.md#code-style-guide)
- [ ] No TypeScript errors: `pnpm --filter <package> build`
- [ ] Linter passes: `pnpm --filter <package> lint`
- [ ] No `console.log()` or `debugger` statements
- [ ] All functions have proper TypeScript types
- [ ] No `any` types used (unless absolutely necessary with comment)

## Internationalization (i18n)

<!-- If this PR adds/modifies user-facing text -->

- [ ] Translations added to `vi.json`
- [ ] Translations added to `en.json`
- [ ] Translations added to `zh.json`
- [ ] No hardcoded strings in UI

## Database Changes

<!-- If this PR modifies the database schema -->

- [ ] Prisma schema updated
- [ ] Migration created: `npx prisma migrate dev --name <name>`
- [ ] Migration tested locally
- [ ] Seed data updated (if needed)

## Security

- [ ] No secrets/API keys in code
- [ ] Input validation implemented
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (React auto-escaping)
- [ ] Authentication/authorization checks added (if applicable)

## Documentation

- [ ] README updated (if needed)
- [ ] API documentation updated (if backend changes)
- [ ] Architecture docs updated (if architectural changes)
- [ ] Code comments added for complex logic

## Deployment Notes

<!-- Any special instructions for deployment -->

- [ ] No special deployment steps required
- [ ] OR: Deployment instructions:

```
(Add instructions here)
```

## Reviewer Checklist

<!-- For reviewers -->

- [ ] Code reviewed for logic and correctness
- [ ] Security implications reviewed
- [ ] Performance implications reviewed
- [ ] All CI checks passed
- [ ] Documentation adequate

---

## Additional Notes

<!-- Any other context or information -->
