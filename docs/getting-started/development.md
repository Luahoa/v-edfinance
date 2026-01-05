# Development Workflow

Learn how to develop features and fix bugs in V-EdFinance.

## Daily Development

### Start Development

```bash
# Start all services
pnpm dev

# Or use Windows script
scripts/development/START_DEV.bat
```

This starts:
- **Frontend** (Next.js): http://localhost:3000
- **Backend** (NestJS): http://localhost:3001
- **Hot reload** enabled for both

### Development Tools

**Prisma Studio** (Database GUI):
```bash
npx prisma studio
# Opens at http://localhost:5555
```

---

## Code Structure

### Frontend (`apps/web/`)

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router
│   │   └── [locale]/     # Internationalized routes
│   ├── components/       # React components
│   │   ├── atoms/       # Basic components (Button, Input)
│   │   ├── molecules/   # Composite components (Card, Form)
│   │   └── organisms/   # Complex components (Header, Footer)
│   ├── lib/             # Utilities
│   ├── i18n/            # Translations (vi/en/zh)
│   └── store/           # Zustand state management
```

### Backend (`apps/api/`)

```
apps/api/
├── src/
│   ├── modules/         # Feature modules
│   │   ├── auth/       # Authentication
│   │   ├── courses/    # Course management
│   │   ├── users/      # User management
│   │   └── ...
│   ├── common/         # Shared utilities
│   └── prisma/         # Database schema
```

---

## Making Changes

### 1. Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/ved-xxx-description
```

**Branch naming**:
- `feature/ved-xxx-add-something` - New features
- `fix/ved-xxx-fix-something` - Bug fixes
- `docs/ved-xxx-update-docs` - Documentation

### 2. Make Code Changes

**Example: Add a new component**

```bash
# Create component file
touch apps/web/src/components/atoms/NewButton.tsx
```

```tsx
// apps/web/src/components/atoms/NewButton.tsx
interface NewButtonProps {
  label: string;
  onClick: () => void;
}

export default function NewButton({ label, onClick }: NewButtonProps) {
  return (
    <button onClick={onClick} className="px-4 py-2 bg-blue-500 text-white">
      {label}
    </button>
  );
}
```

### 3. Add Translations (if UI changes)

```bash
# Edit all locale files
code apps/web/src/i18n/locales/vi.json
code apps/web/src/i18n/locales/en.json  
code apps/web/src/i18n/locales/zh.json
```

```json
// Add to each file
{
  "button": {
    "new": "New Button"
  }
}
```

### 4. Write Tests

```bash
# Create test file
touch apps/web/src/components/atoms/NewButton.test.tsx
```

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import NewButton from './NewButton';

describe('NewButton', () => {
  it('renders with label', () => {
    render(<NewButton label="Click Me" onClick={() => {}} />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<NewButton label="Click" onClick={handleClick} />);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

---

## Running Tests

### All Tests

```bash
pnpm test
```

### Frontend Tests

```bash
pnpm --filter web test
pnpm --filter web test:watch  # Watch mode
```

### Backend Tests

```bash
pnpm --filter api test
pnpm --filter api test:watch
```

### E2E Tests

```bash
pnpm --filter web test:e2e
pnpm --filter web test:e2e:ui  # With Playwright UI
```

---

## Code Quality

### Linting

```bash
# Lint all
pnpm lint

# Lint specific package
pnpm --filter web lint
pnpm --filter api lint

# Auto-fix
pnpm --filter web lint --fix
```

### Type Checking

```bash
# Build (includes type check)
pnpm --filter web build
pnpm --filter api build
```

### Format Code

```bash
# Format with Prettier (if configured)
pnpm format
```

---

## Database Changes

### Create Migration

```bash
# 1. Modify prisma/schema.prisma
code prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_new_field

# 3. Migration file created in prisma/migrations/
```

### Reset Database

```bash
# ⚠️ Deletes all data
npx prisma migrate reset

# Runs migrations + seed
```

### Seed Database

```bash
npx prisma db seed
```

---

## Debugging

### Frontend Debugging

**VS Code**:
1. Set breakpoint in code
2. Press F5 or Run → Start Debugging
3. Choose "Next.js: debug full stack"

**Browser DevTools**:
- React DevTools extension
- Network tab for API calls
- Console for errors

### Backend Debugging

**VS Code**:
1. Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach NestJS",
  "port": 9229
}
```

2. Start API in debug mode:
```bash
pnpm --filter api dev:debug
```

3. Attach debugger (F5)

**Logs**:
```typescript
// Use built-in logger
import { Logger } from '@nestjs/common';

const logger = new Logger('MyModule');
logger.log('Info message');
logger.error('Error message');
```

---

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (.env)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
```

**Never commit `.env` files!**

---

## Common Tasks

### Add New API Endpoint

1. Create service method:
```typescript
// apps/api/src/modules/users/users.service.ts
async findByEmail(email: string) {
  return this.prisma.user.findUnique({ where: { email } });
}
```

2. Add controller endpoint:
```typescript
// apps/api/src/modules/users/users.controller.ts
@Get(':email')
async getUserByEmail(@Param('email') email: string) {
  return this.usersService.findByEmail(email);
}
```

3. Test it:
```bash
curl http://localhost:3001/users/test@example.com
```

### Add New Frontend Page

```bash
# Create page file (App Router)
touch apps/web/src/app/[locale]/new-page/page.tsx
```

```tsx
export default function NewPage() {
  return <div>New Page Content</div>;
}
```

Visit: http://localhost:3000/en/new-page

---

## Git Workflow

### Before Committing

```bash
# Run quality checks
pnpm --filter web lint
pnpm --filter web build
pnpm test
```

### Commit Changes

```bash
git add .
git commit -m "feat(scope): description

- Detail 1
- Detail 2

Refs: ved-xxx"
```

### Push and Create PR

```bash
git push origin feature/ved-xxx-description
```

Then create Pull Request on GitHub.

---

## Troubleshooting

### Hot Reload Not Working

```bash
# Restart dev server
# Ctrl+C to stop
pnpm dev
```

### Port Conflict

```bash
# Change ports in package.json scripts
"dev": "next dev -p 3002"  # Use port 3002
```

### Cache Issues

```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Clear node_modules
rm -rf node_modules
pnpm install
```

---

## Next Steps

- **Read [CONTRIBUTING.md](../../CONTRIBUTING.md)** for code standards
- **Check [First Contribution](first-contribution.md)** guide
- **Explore [Architecture](../architecture/)** docs

---

**Questions?** Ask in [GitHub Discussions](https://github.com/Luahoa/v-edfinance/discussions)
