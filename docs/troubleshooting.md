---
title: "Troubleshooting Guide"
description: "Common issues and solutions for V-EdFinance development"
category: "operations"
lastUpdated: 2026-01-09
version: "1.0.0"
---

# Troubleshooting Guide

> Quick solutions for common development and deployment issues.

## Table of Contents
- [Build Errors](#build-errors)
- [Database Issues](#database-issues)
- [Docker/Deployment](#dockerdeployment)
- [SSH/VPS Access](#sshvps-access)
- [Development Server](#development-server)

---

## Build Errors

### `Module not found` in Next.js

**Symptoms:** Build fails with `Cannot find module '@/components/...'`

**Solutions:**
1. Clear Next.js cache:
   ```bash
   rm -rf apps/web/.next
   pnpm --filter web build
   ```
2. Verify import path matches file location
3. Check `tsconfig.json` path aliases

### TypeScript `any` Type Errors

**Symptoms:** Lint fails with `@typescript-eslint/no-explicit-any`

**Solution:** Replace `any` with proper types:
```typescript
// ❌ Bad
function process(data: any) {}

// ✅ Good
function process(data: unknown) {}
// or
function process(data: Record<string, string>) {}
```

### Prisma Client Not Generated

**Symptoms:** `PrismaClient is not a constructor` or missing types

**Solution:**
```bash
cd apps/api
npx prisma generate
```

---

## Database Issues

### Connection Refused

**Symptoms:** `ECONNREFUSED` when connecting to PostgreSQL

**Solutions:**
1. Check if PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```
2. Verify connection string in `.env`:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/v_edfinance
   ```
3. Start database:
   ```bash
   docker-compose -f docker-compose.postgres.yml up -d
   ```

### Migration Failed

**Symptoms:** `prisma migrate dev` fails with schema conflict

**Solutions:**
1. Reset database (development only):
   ```bash
   npx prisma migrate reset
   ```
2. For production, see [Migration Guide](database/migration-guide.md)

### JSONB Schema Drift

**Symptoms:** Validation errors for JSONB fields

**Solution:** All JSONB writes must pass through `ValidationService`:
```typescript
// Always validate JSONB before saving
await this.validationService.validateSchema(data, 'BehaviorMetadata');
```

---

## Docker/Deployment

### VPS Unresponsive

**Symptoms:** SSH connects but commands timeout

**Root Cause:** Usually Docker build consuming all resources

**Solutions:**
1. **From Dokploy UI** (http://103.54.153.248:3000):
   - Stop all running builds
   - Restart Docker service

2. **Manual reboot** (via hosting provider panel):
   - Reboot VPS
   - Wait 2-3 minutes
   - Reconnect

3. **Prevention:** Use `scripts/vps-toolkit/free-resources.js` to stop non-essential containers before builds

### Docker Image Push Failed

**Symptoms:** `unauthorized: incorrect username or password`

**Solution:** Regenerate Docker Hub token:
1. Go to https://hub.docker.com/settings/security
2. Create new Access Token
3. Update GitHub secret `DOCKERHUB_TOKEN`

### Container Health Check Failing

**Symptoms:** Service stuck in `starting` state

**Check logs:**
```bash
docker logs <container-name> --tail 100
```

**Common fixes:**
- API: Verify `DATABASE_URL` is correct
- Web: Ensure API is healthy first
- Nginx: Check upstream services are running

---

## SSH/VPS Access

### Permission Denied (publickey)

**Symptoms:** `Permission denied (publickey)` when SSH'ing

**Solutions:**
1. Verify SSH key path:
   ```bash
   ssh -i "C:\Users\luaho\.ssh\vps_new_key" root@103.54.153.248
   ```

2. Check key permissions (Windows):
   - Right-click key file → Properties → Security
   - Remove all users except your account
   - Set your account to Full Control

3. Generate new key if needed:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/vps_new_key
   ```

See [SSH Config Guide](devops/ssh-auth-troubleshooting.md) for full setup.

### Bitvise SSH Alternative

If `ssh` command fails, use Bitvise CLI:
```cmd
"C:\Program Files (x86)\Bitvise SSH Client\sexec.exe" ^
  -host=103.54.153.248 ^
  -user=root ^
  -keypairFile="C:\Users\luaho\.ssh\vps_new_key" ^
  -cmd="docker ps"
```

---

## Development Server

### Port Already in Use

**Symptoms:** `EADDRINUSE: address already in use :::3000`

**Solution (Windows):**
```cmd
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

**Solution (Unix):**
```bash
lsof -i :3000
kill -9 <pid>
```

### Hot Reload Not Working

**Symptoms:** Changes not reflected in browser

**Solutions:**
1. Clear Next.js cache:
   ```bash
   rm -rf apps/web/.next
   ```
2. Restart dev server:
   ```bash
   pnpm dev
   ```
3. Check for file watcher limits (Linux):
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### Environment Variables Not Loading

**Symptoms:** `process.env.VARIABLE` is undefined

**Check:**
1. File is named correctly: `.env.local` (not `.env.development.local`)
2. Variable has `NEXT_PUBLIC_` prefix for client-side access
3. Restart dev server after adding new variables

---

## Getting Help

If these solutions don't work:

1. **Search existing beads:**
   ```bash
   bd list | grep "error keyword"
   ```

2. **Check recent threads:**
   ```bash
   find_thread "error description" after:7d
   ```

3. **Create a new bead:**
   ```bash
   bd create "Bug: Description of issue" -t bug -p 0
   ```
