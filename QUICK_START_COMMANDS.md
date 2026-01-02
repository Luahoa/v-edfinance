# Quick Start Commands - Copy & Paste vào Terminal

## ✅ Bước 1: Navigate đến project directory
```cmd
cd "C:\Users\luaho\Demo project\v-edfinance"
```

## ✅ Bước 2: Navigate vào API folder
```cmd
cd apps\api
```

## ✅ Bước 3: Install dependencies (nếu chưa)
```cmd
pnpm install
```

## ✅ Bước 4: Generate Prisma Client
```cmd
npx prisma generate
```

## ✅ Bước 5: Reset database và run migrations
```cmd
npx prisma migrate reset --force --skip-seed
```

## ✅ Bước 6: Run basic seed
```cmd
npx ts-node prisma/seed.ts
```

## ✅ Bước 7: Verify data
```cmd
npx prisma studio
```
Hoặc kết nối PostgreSQL:
```cmd
psql "YOUR_DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"
```

---

## 🚀 Option Tự Động: Chạy tất cả trong 1 lần

### Cách 1: Batch File (RECOMMENDED)
**Double-click file này:**
```
AUTO_SEED_COMPLETE.bat
```

### Cách 2: PowerShell One-Liner
```powershell
cd "C:\Users\luaho\Demo project\v-edfinance\apps\api"; pnpm install; npx prisma generate; npx ts-node prisma/seed.ts
```

---

## ⚠️ Nếu gặp lỗi DATABASE_URL

**Bước 1: Check .env file**
```cmd
cd "C:\Users\luaho\Demo project\v-edfinance\apps\api"
type .env | findstr DATABASE_URL
```

**Bước 2: Nếu thiếu, tạo file .env**
```cmd
echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/v_edfinance" > .env
```
*(Thay `yourpassword` bằng password PostgreSQL thực tế)*

**Bước 3: Test connection**
```cmd
npx prisma db execute --stdin < nul
```

---

## 📋 Verification Checklist

Sau khi chạy seed thành công, verify:

```sql
-- Mở psql hoặc pgAdmin và chạy:
SELECT 'Users' as table_name, COUNT(*) FROM "User"
UNION ALL
SELECT 'Courses', COUNT(*) FROM "Course"
UNION ALL
SELECT 'Lessons', COUNT(*) FROM "Lesson"
UNION ALL
SELECT 'Checklists', COUNT(*) FROM "UserChecklist";
```

**Expected Results:**
- Users: 2 (1 admin, 1 student)
- Courses: 1
- Lessons: 2
- Checklists: 1

---

## 🎯 Full Testing Workflow

```cmd
# 1. Navigate
cd "C:\Users\luaho\Demo project\v-edfinance\apps\api"

# 2. Setup
pnpm install
npx prisma generate

# 3. Basic seed
npx prisma migrate reset --force --skip-seed
npx ts-node prisma/seed.ts

# 4. Dev scenario (50 users, 10 courses)
npx prisma migrate reset --force --skip-seed
npx ts-node prisma/seeds/index.ts dev

# 5. Run tests
pnpm test database.service.seed.spec.ts
pnpm test ai-agent-data.spec.ts

# 6. Benchmark (optional - takes 5+ minutes)
npx prisma migrate reset --force --skip-seed
npx ts-node prisma/seeds/index.ts benchmark
```

---

## 🆘 Common Errors & Solutions

### Error: "Could not find Prisma Schema"
**Reason:** Đang ở sai folder  
**Fix:** 
```cmd
cd "C:\Users\luaho\Demo project\v-edfinance\apps\api"
dir prisma\schema.prisma
```

### Error: "ts-node: command not found"
**Fix:**
```cmd
pnpm add -D ts-node typescript @types/node
```

### Error: "P1001: Can't reach database server"
**Fix:**
```cmd
# Check if PostgreSQL is running
net start | findstr postgres

# Or start manually
net start postgresql-x64-16
```

### Error: "Environment variable not found: DATABASE_URL"
**Fix:**
```cmd
# Create .env in apps/api folder
cd "C:\Users\luaho\Demo project\v-edfinance\apps\api"
echo DATABASE_URL="postgresql://postgres:password@localhost:5432/v_edfinance" > .env
```

---

**Recommended:** Chạy `AUTO_SEED_COMPLETE.bat` để tự động thực thi tất cả!
