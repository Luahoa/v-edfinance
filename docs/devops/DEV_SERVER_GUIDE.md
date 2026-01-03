# 🚀 V-EDFINANCE - DEV SERVER GUIDE

## Prerequisites ✅

1. ✅ Docker Desktop running
2. ✅ PostgreSQL container ready (port 5433)
3. ✅ Environment files configured

---

## Quick Start (Recommended)

### Option A: Run Everything with Turborepo

```bash
# From project root
npm run dev
```

This will start:
- **Backend API** on http://localhost:3001
- **Frontend Web** on http://localhost:3000

---

## Manual Start (If Turborepo fails)

### Step 1: Start PostgreSQL

```bash
docker-compose up -d postgres
```

Verify:
```bash
docker ps
# Should see: vedfinance-postgres running on 5433:5432
```

### Step 2: Start Backend API

```bash
cd apps/api
npm run start:dev
```

Expected output:
```
[Nest] ... LOG [NestApplication] Nest application successfully started
[Nest] ... LOG Listening on port 3001
```

API Health Check: http://localhost:3001/status

### Step 3: Start Frontend (New Terminal)

```bash
cd apps/web
npm run dev
```

Expected output:
```
▲ Next.js 16.0.10
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

---

## 🧪 Testing the UI

### 1. Home Page
Navigate to: http://localhost:3000

Should redirect to: http://localhost:3000/vi (default locale)

### 2. Test i18n (Internationalization)

- Vietnamese: http://localhost:3000/vi
- English: http://localhost:3000/en
- Chinese: http://localhost:3000/zh

### 3. Login Page
Navigate to: http://localhost:3000/vi/login

**Test with these credentials** (if you created seed data):
- Email: `test@example.com`
- Password: `password123`

### 4. Courses Page
Navigate to: http://localhost:3000/vi/courses

Should display:
- Empty state if no courses: "Chưa có khóa học nào"
- Or course list if backend has data

### 5. Protected Routes
Try accessing: http://localhost:3000/vi/dashboard

Should redirect to login if not authenticated.

---

## 🔍 Troubleshooting

### Backend won't start
```bash
# Check if migration is applied
cd apps/api
npx prisma migrate status

# If needed, apply migration
npx prisma migrate deploy
```

### Port already in use
```bash
# Find process on port 3000/3001
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process (use PID from above)
taskkill /PID <PID> /F
```

### Database connection error
```bash
# Restart PostgreSQL container
docker-compose restart postgres

# Check logs
docker logs vedfinance-postgres
```

---

## 📊 Expected Behavior

### ✅ What Should Work:
1. **i18n Routing**: URL changes when switching languages
2. **Login UI**: Form displays with proper translations
3. **Courses Page**: Displays translated "All Courses" title
4. **Auth Redirect**: Protected routes redirect to login

### ⚠️ What Won't Work Yet (Normal):
1. **Actual Login**: Backend might not have users yet
2. **Course Data**: Backend needs seed data
3. **Dashboard Page**: Not created yet
4. **Profile Page**: Not created yet

---

## 🎯 Next Steps After Dev Server Running

1. **Create seed data** for backend (users, courses)
2. **Test login flow** end-to-end
3. **Build Dashboard page**
4. **Build Profile page**
5. **Connect all API endpoints**

---

## 🛑 Stop Servers

### Stop Turborepo dev mode:
Press `Ctrl + C` in terminal

### Stop PostgreSQL:
```bash
docker-compose down
```

---

## 📝 Environment Variables Reference

### Backend (apps/api/.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/vedfinance
JWT_SECRET=your-secret-key-here
GEMINI_API_KEY=your-gemini-key-here
AWS_S3_BUCKET=vedfinance-storage
```

### Frontend (apps/web/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
