# GitHub Actions: Database Tools Workflow

**Status:** Template Ready (Implementation deferred - infrastructure required)  
**Priority:** P1 (but requires GitHub repository setup)

## Workflow Purpose

Automate database tools integration in CI/CD pipeline:
1. Generate ERD on schema changes
2. Validate Kysely types are in sync
3. Run seed tests for data integrity
4. Benchmark performance on main branch

## Implementation Template

```yaml
name: Database Tools

on:
  pull_request:
    paths:
      - 'apps/api/prisma/**'
      - '.github/workflows/database-tools.yml'
  push:
    branches:
      - main
    paths:
      - 'apps/api/prisma/**'

jobs:
  erd-generation:
    name: Generate ERD
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Generate Prisma Client & ERD
        run: |
          cd apps/api
          pnpm db:generate
      
      - name: Upload ERD
        uses: actions/upload-artifact@v4
        with:
          name: erd-diagram
          path: apps/api/docs/erd.md
      
      - name: Comment ERD link on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.name,
              body: '📊 ERD updated! [View artifact](../actions/runs/${{ github.run_id }})'
            })

  kysely-type-check:
    name: Verify Kysely Types
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Generate Kysely types
        run: |
          cd apps/api
          pnpm db:generate
      
      - name: Check for type drift
        run: |
          cd apps/api
          git diff --exit-code src/database/types.ts src/database/enums.ts || \
          (echo "❌ Kysely types out of sync! Run 'pnpm db:generate' locally." && exit 1)

  seed-test:
    name: Test Seed Data
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: v_edfinance_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run migrations
        run: |
          cd apps/api
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/v_edfinance_test
      
      - name: Seed test data
        run: |
          cd apps/api
          pnpm db:seed:test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/v_edfinance_test
      
      - name: Verify data integrity
        run: |
          cd apps/api
          npx prisma db execute --stdin <<SQL
            SELECT COUNT(*) as user_count FROM "User";
            SELECT COUNT(*) as course_count FROM "Course";
            SELECT COUNT(*) as behavior_count FROM "BehaviorLog";
          SQL
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/v_edfinance_test

  benchmark:
    name: Benchmark Performance
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: benchmark
          POSTGRES_DB: v_edfinance_bench
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run migrations
        run: |
          cd apps/api
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:benchmark@localhost:5432/v_edfinance_bench
      
      - name: Run benchmark seed (10k users)
        run: |
          cd apps/api
          time pnpm db:seed:benchmark
        env:
          DATABASE_URL: postgresql://postgres:benchmark@localhost:5432/v_edfinance_bench
      
      - name: Query performance test
        run: |
          cd apps/api
          npx ts-node <<'SCRIPT'
          import { PrismaClient } from '@prisma/client';
          const prisma = new PrismaClient();
          
          async function benchmark() {
            console.time('DAU Query');
            await prisma.$queryRaw`
              SELECT DATE("timestamp") as date, COUNT(DISTINCT "userId") as dau
              FROM "BehaviorLog"
              WHERE "timestamp" >= NOW() - INTERVAL '30 days'
              GROUP BY DATE("timestamp")
            `;
            console.timeEnd('DAU Query');
            
            console.time('Leaderboard Query');
            await prisma.$queryRaw`
              SELECT u.id, u.name, u.points, 
                     COALESCE(us."currentStreak", 0) as streak,
                     ROW_NUMBER() OVER (ORDER BY u.points DESC) as rank
              FROM "User" u
              LEFT JOIN "UserStreak" us ON u.id = us."userId"
              WHERE u.role = 'STUDENT'
              ORDER BY u.points DESC
              LIMIT 50
            `;
            console.timeEnd('Leaderboard Query');
          }
          
          benchmark().then(() => process.exit(0));
          SCRIPT
        env:
          DATABASE_URL: postgresql://postgres:benchmark@localhost:5432/v_edfinance_bench
```

## Triggers

- **PR**: Any change to `apps/api/prisma/**`
- **Main Push**: Benchmark job only runs on main branch

## Success Criteria

- ERD artifact uploaded on every PR
- Kysely types match schema (no drift)
- Seed test completes <30s
- Benchmark seed completes <5min (10k users)
- Query p95 <500ms

## Dependencies

- GitHub repository with Actions enabled
- PostgreSQL 16 service in workflow
- Prisma migrations in `apps/api/prisma/migrations/`

## Next Steps

1. Push repository to GitHub
2. Enable GitHub Actions
3. Create workflow file at `.github/workflows/database-tools.yml`
4. Test with a sample PR changing schema

---

*Created: 2025-12-22 during ved-hyv epic*  
*Status: Template ready for deployment*
