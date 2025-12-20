# CLI Tools Installation Guide

## Installed CLI Tools

### ✅ Package Management & Build
1. **pnpm** (v9.15.0) - Fast package manager
   ```powershell
   pnpm --version
   ```

2. **turbo** - Monorepo build system
   ```powershell
   pnpm turbo --version
   ```

3. **biome** - Linter & formatter
   ```powershell
   pnpm biome --version
   ```

### ✅ Testing & Benchmarking
4. **vitest** - Unit testing
   ```powershell
   pnpm vitest --version
   ```

5. **ava** - Minimalist test runner
   ```powershell
   pnpm ava --version
   ```

6. **playwright** - E2E testing
   ```powershell
   pnpm playwright --version
   ```

7. **autocannon** - HTTP load testing
   ```powershell
   pnpm autocannon --help
   ```

### ✅ Task Management
8. **beads (bd)** (v0.30.7) - Git-backed issue tracker
   ```powershell
   bd version
   bd ready --json  # List ready tasks
   bd create "Task title" -p 1 -t feature
   ```

### ✅ Database
9. **prisma** - ORM & schema management
   ```powershell
   pnpm prisma --version
   pnpm prisma studio  # Open database GUI
   ```

### ✅ Storage & Sync
10. **rclone** (v1.68.2) - Cloud storage sync
    - **Installation location**: `C:\rclone\rclone.exe`
    - **Added to PATH**: Yes
    
    ```powershell
    rclone version
    rclone config  # Configure cloud storage
   rclone lsd r2:bucket-name  # List directories in R2
    ```

---

## Rclone Configuration for Cloudflare R2

### Step 1: Create Configuration

```powershell
rclone config
```

Follow these steps:
1. Select: `n` (New remote)
2. Name: `r2` (or your preferred name)
3. Storage type: `4` (Amazon S3)
4. Provider: `5` (Cloudflare R2)
5. Enter access key ID from your `.env` file
6. Enter secret access key from your `.env` file
7. Region: (leave blank)
8. Endpoint: `https://<account-id>.r2.cloudflarestorage.com`
9. Leave other options as default
10. Save and quit

### Step 2: Test Connection

```powershell
# List buckets
rclone lsd r2:

# List files in bucket
rclone ls r2:your-bucket-name

# Sync local to R2
rclone sync ./local-folder r2:bucket-name/folder --dry-run
```

### Step 3: Common Commands

```powershell
# Copy file to R2
rclone copy ./file.txt r2:bucket/path/

# Sync directory
rclone sync ./uploads r2:bucket/uploads

# Check differences
rclone check ./local r2:remote

# Mount R2 as drive (requires WinFsp)
rclone mount r2:bucket X: --vfs-cache-mode full
```

---

## Quick Verification

Run this to verify all CLI tools:

```powershell
# Package managers
pnpm --version

# Testing
pnpm vitest --version
pnpm playwright --version

# Task management
bd version

# Database
pnpm prisma --version

# Storage
C:\rclone\rclone.exe version
```

---

## Scripts Created

- **INSTALL_RCLONE.bat** - Install rclone (run as admin)
- **scripts/install-rclone.ps1** - PowerShell installation script

---

## Next Steps

1. ✅ All CLI tools installed
2. Configure rclone for R2 storage
3. Setup automated backups with rclone
4. Create monitoring management scripts
5. Document monitoring tools usage
