# Installation Guide

Complete installation instructions for V-EdFinance.

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 11+, or Linux (Ubuntu 20.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 2GB free space
- **Internet**: Required for package installation

### Required Software

#### 1. Node.js (18.x or higher)

**Windows/macOS**:
- Download from [nodejs.org](https://nodejs.org/)
- Install LTS version (18.x or 20.x)

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify**:
```bash
node --version  # Should show v18.x or higher
```

#### 2. pnpm (8.x or higher)

```bash
npm install -g pnpm
pnpm --version  # Should show 8.x or higher
```

#### 3. PostgreSQL (14.x or higher)

**Windows**:
- Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- Use installer, remember your password

**macOS** (via Homebrew):
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Verify**:
```bash
psql --version  # Should show 14.x or higher
```

#### 4. Git

**Windows**: [git-scm.com](https://git-scm.com/download/win)  
**macOS**: `brew install git`  
**Linux**: `sudo apt install git`

---

## Installation Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/Luahoa/v-edfinance.git
cd v-edfinance
```

### Step 2: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# This will install dependencies for:
# - Root workspace
# - Frontend (apps/web)
# - Backend (apps/api)
```

**Expected output**:
```
Packages: +2000
Progress: resolved 2157, reused 2000, downloaded 157
Done in 45s
```

### Step 3: Set Up Environment Variables

```bash
# Copy example environment file
cp .env.example .env
```

**Edit `.env` with your configuration**:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/v_edfinance"
DIRECT_URL="postgresql://postgres:password@localhost:5432/v_edfinance"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="your-jwt-secret-here"
SESSION_SECRET="your-session-secret-here"

# Stripe (use test keys)
STRIPE_SECRET_KEY="sk_test_your_test_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_test_key"

# Google AI (optional for development)
GOOGLE_AI_API_KEY="your_api_key_here"
```

### Step 4: Create Database

```bash
# Create database
createdb v_edfinance

# Or via psql
psql -U postgres
CREATE DATABASE v_edfinance;
\q
```

### Step 5: Run Database Migrations

```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

**Expected output**:
```
✔ Generated Prisma Client
The following migration(s) have been applied:
migrations/
  └─ 20251218130010_init_fresh
```

### Step 6: Seed Database (Optional)

```bash
# Seed with sample data
npx prisma db seed
```

This adds:
- Sample users
- Sample courses
- Sample gamification data

### Step 7: Start Development Servers

```bash
# Start all services
pnpm dev
```

**Or start individually**:
```bash
# Frontend only
pnpm --filter web dev

# Backend only  
pnpm --filter api dev
```

---

## Verification

### Check Frontend

Open http://localhost:3000

You should see:
- ✅ V-EdFinance homepage
- ✅ Navigation menu
- ✅ Login/Register links

### Check Backend API

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-05T..."
}
```

### Check Database Connection

```bash
npx prisma studio
```

Opens Prisma Studio at http://localhost:5555 to browse database.

---

## Troubleshooting

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill
```

### Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
1. Check PostgreSQL is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Verify DATABASE_URL in `.env`
3. Test connection:
   ```bash
   psql -U postgres -d v_edfinance
   ```

### Prisma Migration Failed

**Error**: `Migration failed to apply`

**Solution**:
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Or create fresh database
dropdb v_edfinance
createdb v_edfinance
npx prisma migrate dev
```

### Module Not Found

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
# Regenerate Prisma Client
npx prisma generate

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

---

## Next Steps

✅ Installation complete!

**Continue to**:
- [Development Workflow](development.md) - Learn how to develop
- [First Contribution](first-contribution.md) - Make your first PR
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Code standards

---

**Need help?** Ask in [GitHub Discussions](https://github.com/Luahoa/v-edfinance/discussions)
