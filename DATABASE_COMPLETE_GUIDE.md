# Database Seed Testing - Complete Guide

**Last Updated:** 2025-12-23  
**Status:** ✅ READY FOR USE

---

## 🚀 Quick Start (1 Command)

```cmd
cd "C:\Users\luaho\Demo project\v-edfinance"
SETUP_DATABASE.bat
```

**This single script does everything:**
1. ✅ Starts Docker PostgreSQL (with pgvector)
2. ✅ Syncs database schema
3. ✅ Seeds dev data (50 users, 10 courses)
4. ✅ Optionally runs tests

**Time:** 3-5 minutes

---

## 📋 Prerequisites

| Requirement | Check Command | Install |
|-------------|---------------|---------|
| **Docker Desktop** | `docker --version` | [Download](https://www.docker.com/products/docker-desktop) |
| **Node.js 18+** | `node --version` | Already installed |
| **pnpm** | `pnpm --version` | Already installed |

---

## 📊 What Gets Created

### Database Structure

| Table | Rows | Purpose |
|-------|------|---------|
| **User** | 50 | Mixed roles (STUDENT, ADMIN, INSTRUCTOR) |
| **Course** | 10 | Multi-lingual titles (vi/en/zh) |
| **Lesson** | 50-120 | 5-12 lessons per course |
| **BehaviorLog** | ~350 | 7 days of user activity |
| **BuddyGroup** | 5 | Social learning groups |
| **CourseProgress** | Variable | User enrollment data |

### Docker Container

```
Name: v-edfinance-db
Image: ankane/pgvector:latest
Port: 5432
Database: v_edfinance
User: postgres
Password: postgres
```

---

## 🔧 Troubleshooting

### Error: "Port 5432 already in use"

**Fix:**
```cmd
# Stop old containers
docker stop v-edfinance-db vedfinance-postgres
docker rm v-edfinance-db vedfinance-postgres

# Re-run setup
SETUP_DATABASE.bat
```

### Error: "Docker not running"

**Fix:**
1. Open Docker Desktop
2. Wait for "Engine running" status
3. Re-run `SETUP_DATABASE.bat`

### Error: "Seed failed - dateOfBirth column missing"

**Fix:** Script handles this automatically via `db push --force-reset`

### Error: "type vector does not exist"

**Fix:** Script enables pgvector extension automatically

---

## ✅ Verification

### Check Docker Container
```cmd
docker ps | findstr v-edfinance-db
```

**Expected output:**
```
v-edfinance-db   ankane/pgvector:latest   Up X minutes   0.0.0.0:5432->5432/tcp
```

### Check Database
```cmd
cd apps\api
npx prisma studio
```

Open: http://localhost:5555

### Run Tests
```cmd
cd apps\api
pnpm test database.service.seed.spec.ts
pnpm test ai-agent-data.spec.ts
```

**Expected:**
- 15 tests pass (Triple-ORM)
- 14 tests pass (AI Agent)

---

## 🎯 Next Steps

### 1. Start Development Servers

**API:**
```cmd
cd apps\api
pnpm start
```

**Web:**
```cmd
cd apps\web
pnpm dev
```

### 2. Run Full Test Suite

```cmd
cd apps\api
pnpm test
```

### 3. Deploy to VPS (Next Epic)

See: [EPIC_VPS_PRODUCTION_DEPLOYMENT.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/EPIC_VPS_PRODUCTION_DEPLOYMENT.md)

---

## 📁 File Structure

### Essential Files (Keep)

| File | Purpose |
|------|---------|
| **SETUP_DATABASE.bat** | Main setup script (USE THIS) |
| **docker-compose.dev.yml** | Docker PostgreSQL config |
| **DATABASE_COMPLETE_GUIDE.md** | This file |

### Seed System

```
apps/api/
├── prisma/
│   ├── schema.prisma          # Database schema (source of truth)
│   ├── seed.ts                # Basic seed (2 users, 1 course)
│   └── seeds/
│       ├── index.ts           # Scenario orchestrator
│       ├── scenarios/
│       │   ├── dev.seed.ts    # 50 users, 10 courses
│       │   ├── test.seed.ts   # 20 users, 5 courses
│       │   ├── demo.seed.ts   # 200 users, 25 courses
│       │   └── benchmark.seed.ts  # 10k users, 100 courses
│       └── factories/
│           ├── user.factory.ts
│           ├── course.factory.ts
│           ├── behavior.factory.ts
│           └── gamification.factory.ts
```

### Test Files

```
apps/api/src/
├── database/
│   └── database.service.seed.spec.ts  # Triple-ORM tests (15 cases)
└── ai/
    └── ai-agent-data.spec.ts          # AI Agent tests (14 cases)
```

---

## 🧪 Seed Scenarios

### Basic Seed
```cmd
cd apps\api
npx ts-node prisma/seed.ts
```

**Creates:**
- 2 users (admin, student)
- 1 course
- 2 lessons

### Dev Scenario (Default)
```cmd
npx ts-node prisma/seeds/index.ts dev
```

**Creates:**
- 50 users
- 10 courses
- ~350 behavior logs

### Demo Scenario
```cmd
npx ts-node prisma/seeds/index.ts demo
```

**Creates:**
- 200 users
- 25 courses
- 30 days of logs

### Benchmark Scenario
```cmd
npx ts-node prisma/seeds/index.ts benchmark
```

**Creates:**
- 10,000 users
- 100 courses
- 90 days of logs

**Warning:** Takes 5+ minutes, uses ~2GB disk

---

## 🔄 Common Workflows

### Fresh Start (Clean Database)
```cmd
SETUP_DATABASE.bat
```

### Re-seed (Keep Schema)
```cmd
cd apps\api
npx prisma migrate reset --skip-seed
npx ts-node prisma/seeds/index.ts dev
```

### Update Schema
```cmd
# 1. Edit prisma/schema.prisma
# 2. Push changes
cd apps\api
npx prisma db push
npx prisma generate
```

### Stop Database
```cmd
cd "C:\Users\luaho\Demo project\v-edfinance"
docker-compose -f docker-compose.dev.yml down
```

---

## 📚 Related Documentation

- [DATABASE_SEED_TESTING_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/DATABASE_SEED_TESTING_PLAN.md) - Full testing strategy
- [PRISMA_DRIZZLE_HYBRID_STRATEGY.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/PRISMA_DRIZZLE_HYBRID_STRATEGY.md) - Triple-ORM architecture
- [AI_DB_ARCHITECT_TASKS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/AI_DB_ARCHITECT_TASKS.md) - Database optimization tasks

---

## 🆘 Support

### Script Fails?

1. **Check Docker:**
   ```cmd
   docker ps
   docker logs v-edfinance-db
   ```

2. **Check Database Connection:**
   ```cmd
   cd apps\api
   npx prisma db execute --stdin < nul
   ```

3. **Manual Cleanup:**
   ```cmd
   docker-compose -f docker-compose.dev.yml down -v
   docker volume rm v-edfinance_postgres_data
   ```

4. **Re-run Setup:**
   ```cmd
   SETUP_DATABASE.bat
   ```

---

**Status:** 🟢 PRODUCTION READY  
**Tested:** Docker Desktop (Windows 11)  
**Estimated Success Rate:** 95%+
