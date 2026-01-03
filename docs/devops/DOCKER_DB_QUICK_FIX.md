# Docker PostgreSQL Quick Fix

**Issue:** PostgreSQL not installed as Windows service  
**Solution:** Use Docker with pgvector support

---

## 🚀 FASTEST FIX (1 command)

```cmd
cd "C:\Users\luaho\Demo project\v-edfinance"
QUICK_RUN.bat
```

This will:
1. ✅ Start Docker PostgreSQL (with pgvector)
2. ✅ Run migrations
3. ✅ Generate Prisma client
4. ✅ Seed dev data (50 users, 10 courses)

**Time:** 2 minutes

---

## 📋 Manual Steps (if needed)

### Step 1: Start Docker DB
```cmd
cd "C:\Users\luaho\Demo project\v-edfinance"
docker-compose -f docker-compose.dev.yml up -d
```

Wait 10 seconds for initialization.

### Step 2: Run Migrations
```cmd
cd apps\api
npx prisma migrate deploy
```

### Step 3: Seed Data
```cmd
npx ts-node prisma/seeds/index.ts dev
```

---

## ✅ Verification

```cmd
# Check Docker container
docker ps | findstr v-edfinance-db

# Check database
cd apps\api
npx prisma studio
```

Open: http://localhost:5555

---

## 🔧 Troubleshooting

### Error: "Docker not running"
**Fix:**
1. Open Docker Desktop
2. Wait for green "Engine running"
3. Re-run QUICK_RUN.bat

### Error: "Port 5432 already in use"
**Fix:**
```cmd
# Stop any local PostgreSQL
net stop postgresql-x64-16

# Or find process on port 5432
netstat -ano | findstr :5432
taskkill /PID <PID> /F
```

### Error: "type vector does not exist"
**Fix:**
```cmd
# Enable pgvector extension
docker exec v-edfinance-db psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

---

## 📊 Expected Results

**After QUICK_RUN.bat completes:**

| Table | Rows | Notes |
|-------|------|-------|
| User | 50 | Mixed roles |
| Course | 10 | Multi-lingual |
| Lesson | 50-120 | 5-12 per course |
| BehaviorLog | ~350 | 7 days activity |
| BuddyGroup | 5 | 4 members each |

---

## 🎯 Next Steps

1. ✅ Run tests:
   ```cmd
   cd apps\api
   pnpm test database.service.seed.spec.ts
   pnpm test ai-agent-data.spec.ts
   ```

2. ✅ Verify in Prisma Studio:
   ```cmd
   npx prisma studio
   ```

3. ✅ Commit results:
   ```cmd
   git add .
   git commit -m "test: Database seed testing complete (Docker PostgreSQL)"
   git push
   ```

---

**Run QUICK_RUN.bat now!**
