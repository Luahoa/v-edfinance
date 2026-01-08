# Contributing to V-EdFinance

Thank you for your interest in contributing to V-EdFinance! This guide will help you get started.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Code Style Guide](#code-style-guide)
- [Git Workflow](#git-workflow)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Security Guidelines](#security-guidelines)

---

## Development Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher (`npm install -g pnpm`)
- **PostgreSQL**: 14.x or higher
- **Git**: 2.x or higher

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Luahoa/v-edfinance.git
   cd v-edfinance
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   # Or use: START_DEV.bat (Windows)
   ```

**For detailed setup instructions**: See [docs/getting-started/installation.md](docs/getting-started/installation.md)

---

## Code Style Guide

We follow strict TypeScript and code quality standards. See [AGENTS.md](AGENTS.md) for complete guidelines.

### TypeScript

- **Strict mode enabled** - No compromises
- **No `any` types** - Use proper typing or `unknown`
- **Prefer `interface` over `type`** for object shapes
- **Explicit return types** for all functions

```typescript
// ✅ Good
interface UserProps {
  id: string;
  name: string;
}

function getUser(id: string): Promise<UserProps> {
  // ...
}

// ❌ Bad
type UserProps = {  // Use interface
  id,  // Missing type
  name: string
}

function getUser(id) {  // Missing types
  // ...
}
```

### React/Next.js

- **Functional components only** - No class components
- **Server Components by default** - Use `'use client'` only when needed
- **Atomic Design pattern**: `atoms/`, `molecules/`, `organisms/`
- Props interfaces named with `Props` suffix

```tsx
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export default function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// ❌ Bad
export default function Button(props: any) {  // No any!
  return <button>{props.label}</button>;
}
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Files**: kebab-case (`format-date.ts`)
- **Variables/Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

---

## Git Workflow

We use **feature branch workflow** with pull requests.

### Branch Naming

```
feature/ved-xxx-description  # New features
fix/ved-xxx-description      # Bug fixes
docs/ved-xxx-description     # Documentation
chore/ved-xxx-description    # Maintenance
```

Example: `feature/ved-123-add-gamification`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance
- `security`: Security fixes

**Examples**:
```bash
feat(auth): add JWT authentication

- Implement login/logout endpoints
- Add JWT token generation
- Create auth middleware

Refs: ved-123

fix(ui): resolve button alignment issue

Closes: ved-456

docs: update API documentation

security: remove exposed API keys from git history
```

### Workflow

1. **Create feature branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/ved-xxx-description
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/ved-xxx-description
   # Create PR on GitHub
   ```

4. **After PR approval**
   ```bash
   # PR will be merged to main
   # Delete your branch
   git branch -d feature/ved-xxx-description
   ```

---

## Testing Requirements

All code changes must include appropriate tests.

### Run Tests

```bash
# All tests
pnpm test

# Frontend tests
pnpm --filter web test

# Backend tests
pnpm --filter api test

# E2E tests
pnpm --filter web test:e2e
```

### Test Coverage

- **Minimum coverage**: 70%
- **Critical paths**: 90%+ (auth, payments, data integrity)

### Writing Tests

```typescript
// Example unit test
describe('formatCurrency', () => {
  it('formats Vietnamese Dong correctly', () => {
    expect(formatCurrency(1000000, 'vi')).toBe('1.000.000 ₫');
  });

  it('formats US Dollar correctly', () => {
    expect(formatCurrency(1000, 'en')).toBe('$1,000.00');
  });
});
```

---

## Pull Request Process

### Before Creating PR

- [ ] Code passes linter: `pnpm --filter <package> lint`
- [ ] Code passes type check: `pnpm --filter <package> build`
- [ ] All tests pass: `pnpm test`
- [ ] No console.log() or debugger statements
- [ ] Documentation updated (if applicable)
- [ ] i18n translations added (if UI changes)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if UI changes)
[Add screenshots]

## Checklist
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] No security issues
- [ ] Documentation updated
```

### Review Process

1. **Automated checks**: Linter, tests, build
2. **Code review**: At least 1 approval required
3. **Conversation resolution**: All comments addressed
4. **Merge**: Squash and merge to main

---

## Security Guidelines

**Never commit secrets!** See [SECURITY.md](SECURITY.md) for full guidelines.

### Quick Checklist

- [ ] No API keys in code
- [ ] No passwords in code
- [ ] No SSH keys in code
- [ ] Use `.env` files (in .gitignore)
- [ ] Validate all user input
- [ ] Use parameterized queries (SQL injection prevention)
- [ ] Sanitize output (XSS prevention)

### If You Accidentally Commit Secrets

1. **DO NOT** just delete the file
2. Remove from git history (see [SECURITY.md](SECURITY.md#incident-response))
3. Rotate the compromised secret immediately
4. Report to security team

---

## Internationalization (i18n)

All user-facing strings must be translated.

### Add Translations

1. **Add to locale files**:
   ```json
   // apps/web/src/i18n/locales/en.json
   {
     "feature": {
       "title": "My Feature"
     }
   }
   ```

2. **Add to all locales**: `vi.json`, `en.json`, `zh.json`

3. **Use in components**:
   ```tsx
   import { useTranslations } from 'next-intl';

   export default function MyComponent() {
     const t = useTranslations('feature');
     return <h1>{t('title')}</h1>;
   }
   ```

---

## Code Review Guidelines

### As a Reviewer

- Be constructive and respectful
- Explain the "why" behind suggestions
- Approve when code meets standards
- Request changes if issues found

### As an Author

- Respond to all comments
- Be open to feedback
- Make requested changes or discuss alternatives
- Mark conversations as resolved when addressed

---

## Getting Help

- **Questions**: Create a [GitHub Discussion](https://github.com/Luahoa/v-edfinance/discussions)
- **Bugs**: Open an [Issue](https://github.com/Luahoa/v-edfinance/issues)
- **Security**: See [SECURITY.md](SECURITY.md)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to V-EdFinance!** 🎓💰
