# R2 Auto Setup - Quick Start

## 🚀 One-Click Setup

**Double-click:** `R2_AUTO_SETUP.bat`

This will automatically:
1. ✅ Install `@aws-sdk/client-s3` and `unstorage`
2. ✅ Create `.env` file with R2 credentials
3. ✅ Start backend server (new window)
4. ✅ Test file upload to R2
5. ✅ Display R2 URL

**Total time:** ~2 minutes

---

## 📋 What It Does

### Step 1: Install Dependencies
```bash
npx pnpm add @aws-sdk/client-s3 unstorage
```

### Step 2: Configure .env
Creates `apps/api/.env` with:
- R2 credentials (from your API tokens)
- Database URL (default PostgreSQL)
- JWT secret (auto-generated)

### Step 3: Start Backend
Opens new terminal window running:
```bash
npm run start:dev
```

### Step 4: Test Upload
Uploads `test-upload.txt` and displays R2 URL

---

## ✅ Success Indicators

**You'll see:**
```
✓ Dependencies installed
✓ .env file created
✓ Test file created
✓ Backend starting...

{
  "success": true,
  "url": "https://pub-b8dc3c47c48a4816b7856fe61c0b2.r2.dev/vedfinance-prod/uploads/..."
}
```

**Then:**
1. Copy URL from response
2. Open in browser
3. Should see "Hello from V-EdFinance R2 Auto Setup!"

---

## 🔧 If Something Fails

### Issue 1: Dependencies fail to install
**Fix:** Run manually:
```bash
cd apps\api
npx pnpm add @aws-sdk/client-s3 unstorage
```

### Issue 2: Backend won't start
**Check:**
- PostgreSQL running?
- Port 3001 available?

**Fix:**
```bash
# Check if port is in use
netstat -ano | findstr :3001

# Kill process if needed
taskkill /PID <process-id> /F
```

### Issue 3: Upload returns 404
**Cause:** Storage controller missing

**Fix:** Create `apps/api/src/storage/storage.controller.ts`

---

## 📝 Manual Steps (If Needed)

If auto-setup fails, run manually:

```bash
# 1. Install dependencies
cd apps\api
npx pnpm add @aws-sdk/client-s3 unstorage

# 2. Copy .env
copy .env.example .env
# Then edit .env with credentials

# 3. Start backend
npm run start:dev

# 4. Test upload
curl -X POST http://localhost:3001/api/storage/upload -F "file=@test.txt"
```

---

## 🎯 After Setup

**Verify in Cloudflare:**
1. Go to R2 → vedfinance-prod → Objects
2. Should see `uploads/test-upload.txt`
3. Click file → Copy URL → Open in browser

**Next steps:**
- Create upload controller (if 404)
- Add file validation
- Implement presigned URLs
- Create frontend Uppy component

---

**Ready?** Double-click `R2_AUTO_SETUP.bat` and watch the magic! ✨
