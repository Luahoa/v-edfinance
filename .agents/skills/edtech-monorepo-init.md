# Skill: Edtech Monorepo Initialization (Turborepo)

**Purpose:** Bootstrap a production-ready edtech monorepo with Next.js frontend, NestJS backend, and shared packages.

**When to use:** Starting a new full-stack edtech platform from scratch.

---

## Tech Stack

- **Monorepo:** Turborepo
- **Frontend:** Next.js 15.1.2 + React 18.3.1
- **Backend:** NestJS 10.x + Prisma 5.x
- **Database:** PostgreSQL 16
- **Package Manager:** pnpm

---

## Step-by-Step Execution

### 1. Initialize Monorepo

```bash
npx create-turbo@latest
# Select: pnpm
# Name: v-edfinance
```

### 2. Project Structure

```
v-edfinance/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # NestJS backend
├── packages/
│   ├── ui/               # Shared React components
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared configs (ESLint, TS)
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

### 3. Configure `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 4. Root `package.json`

```json
{
  "name": "v-edfinance",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "prettier": "^3.4.2"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

### 5. `turbo.json` Configuration

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### 6. Initialize Frontend (`apps/web`)

```bash
cd apps
npx create-next-app@15.1.2 web --typescript --app --tailwind --no-src-dir
cd web

# Install exact versions
pnpm add next@15.1.2 react@18.3.1 react-dom@18.3.1
pnpm add -D @types/react@^18.3.12 @types/react-dom@^18.3.1
pnpm add next-intl@3.26.3 zustand@^5.0.2
```

**`apps/web/package.json`:**
```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.1.2",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "next-intl": "3.26.3",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "eslint": "^9",
    "eslint-config-next": "15.1.2",
    "typescript": "^5"
  }
}
```

### 7. Initialize Backend (`apps/api`)

```bash
cd apps
npx @nestjs/cli new api
cd api

# Install Prisma
pnpm add @prisma/client
pnpm add -D prisma

# Initialize Prisma
npx prisma init
```

**`apps/api/package.json`:**
```json
{
  "name": "api",
  "version": "0.0.1",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/node": "^20.0.0",
    "prisma": "^5.0.0",
    "typescript": "^5.1.3"
  }
}
```

### 8. Database Setup (Docker)

**`docker-compose.yml` (root):**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: vedfinance
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: vedfinance_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**`.env` (apps/api):**
```env
DATABASE_URL="postgresql://vedfinance:dev_password@localhost:5432/vedfinance_dev?schema=public"
PORT=3001
```

### 9. Prisma Schema Template (`apps/api/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique
  passwordHash   String
  role           Role     @default(STUDENT)
  points         Int      @default(0)
  preferredLocale String  @default("vi")
  metadata       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum Role {
  STUDENT
  TEACHER
  ADMIN
}
```

### 10. Development Scripts

**`START_DEV.bat` (Windows):**
```batch
@echo off
start cmd /k "cd apps/web && pnpm dev"
start cmd /k "cd apps/api && pnpm dev"
echo Dev servers starting...
```

**`START_DEV.sh` (Unix):**
```bash
#!/bin/bash
cd apps/web && pnpm dev &
cd apps/api && pnpm dev &
echo "Dev servers starting..."
```

---

## Verification Checklist

- [ ] `pnpm install` completes without errors
- [ ] `docker-compose up -d` starts PostgreSQL
- [ ] `npx prisma migrate dev` (in apps/api) creates database
- [ ] `pnpm dev` starts both frontend and backend
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend accessible at http://localhost:3001
- [ ] `pnpm build` builds all apps successfully

---

## Post-Setup Tasks

1. **Configure CORS** (apps/api/src/main.ts):
```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

2. **Add Prisma Service** (apps/api/src/prisma/prisma.service.ts)
3. **Setup i18n** (use `nextjs-i18n-setup.md` skill)
4. **Configure ESLint & Prettier** shared configs

---

## Common Issues

- **Port conflicts:** Change ports in .env files
- **Prisma client not generated:** Run `npx prisma generate`
- **Database connection fails:** Check docker-compose logs
- **Turbo cache issues:** Run `turbo run dev --force`

---

## References

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
