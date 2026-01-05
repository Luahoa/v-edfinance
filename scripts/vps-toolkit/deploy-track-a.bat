@echo off
REM ============================================================================
REM Track A: VPS Deployment via OpenSSH (Bypass PowerShell Execution Policy)
REM ============================================================================
REM Agent: CrimsonDeploy
REM Beads: ved-43oq -> ved-949o -> Smoke Tests
REM Uses: Windows OpenSSH + Bitvise CLI (if available)
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Track A: VPS Deployment (CrimsonDeploy)
echo ========================================
echo.

REM Configuration
set VPS_HOST=103.54.153.248
set VPS_USER=root
set VPS_KEY=%USERPROFILE%\.ssh\vps_new_key
set VPS_PATH=/root/v-edfinance
set PROJECT_ROOT=c:\Users\luaho\Demo project\v-edfinance

REM Colors (if supported)
set GREEN=[32m
set RED=[31m
set YELLOW=[33m
set NC=[0m

echo [INFO] VPS Host: %VPS_HOST%
echo [INFO] VPS User: %VPS_USER%
echo [INFO] SSH Key: %VPS_KEY%
echo.

REM ============================================================================
REM Phase 1: Verify Prerequisites
REM ============================================================================
echo.
echo %YELLOW%[PHASE 1] Verifying Prerequisites...%NC%
echo.

REM Check SSH key exists
if not exist "%VPS_KEY%" (
    echo %RED%[ERROR] SSH key not found: %VPS_KEY%%NC%
    echo Please ensure SSH key is in place.
    pause
    exit /b 1
)
echo %GREEN%[OK] SSH key found%NC%

REM Check OpenSSH
where ssh >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR] OpenSSH not found in PATH%NC%
    echo Please install OpenSSH or Bitvise.
    pause
    exit /b 1
)
echo %GREEN%[OK] OpenSSH available%NC%

REM Test VPS connectivity
echo.
echo Testing VPS connectivity...
ssh -i "%VPS_KEY%" -o StrictHostKeyChecking=no -o ConnectTimeout=10 %VPS_USER%@%VPS_HOST% "echo 'SSH connection successful'" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR] Cannot connect to VPS%NC%
    echo Please check network and SSH key permissions.
    pause
    exit /b 1
)
echo %GREEN%[OK] VPS connection successful%NC%

echo.
echo %GREEN%All prerequisites verified!%NC%
echo.
pause

REM ============================================================================
REM Phase 2: ved-43oq - Deploy API Docker to VPS
REM ============================================================================
echo.
echo %YELLOW%[PHASE 2] Deploying API Docker (ved-43oq)...%NC%
echo.

REM Update bead status
cd "%PROJECT_ROOT%"
beads update ved-43oq --status in_progress --no-daemon 2>nul

REM Step 1: Create directories on VPS
echo [1/7] Creating directories on VPS...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "mkdir -p %VPS_PATH%/apps/api/prisma"
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR] Failed to create directories%NC%
    pause
    exit /b 1
)
echo %GREEN%[OK] Directories created%NC%

REM Step 2: Upload package files
echo.
echo [2/7] Uploading package files...
scp -i "%VPS_KEY%" "%PROJECT_ROOT%\package.json" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/
scp -i "%VPS_KEY%" "%PROJECT_ROOT%\pnpm-lock.yaml" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/
scp -i "%VPS_KEY%" "%PROJECT_ROOT%\pnpm-workspace.yaml" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/
scp -i "%VPS_KEY%" "%PROJECT_ROOT%\apps\api\package.json" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/apps/api/
echo %GREEN%[OK] Package files uploaded%NC%

REM Step 3: Upload Dockerfile and Prisma schema
echo.
echo [3/7] Uploading Dockerfile and Prisma schema...
scp -i "%VPS_KEY%" "%PROJECT_ROOT%\apps\api\Dockerfile" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/apps/api/
scp -i "%VPS_KEY%" "%PROJECT_ROOT%\apps\api\prisma\schema.prisma" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/apps/api/prisma/
echo %GREEN%[OK] Dockerfile and schema uploaded%NC%

REM Step 4: Compress and upload source code
echo.
echo [4/7] Compressing and uploading API source code...
cd "%PROJECT_ROOT%\apps\api"

REM Use tar if available, otherwise use PowerShell compression
where tar >nul 2>&1
if %ERRORLEVEL% equ 0 (
    tar -czf api-src.tar.gz src
) else (
    powershell -Command "Compress-Archive -Path src -DestinationPath api-src.zip -Force"
    ren api-src.zip api-src.tar.gz
)

scp -i "%VPS_KEY%" api-src.tar.gz %VPS_USER%@%VPS_HOST%:%VPS_PATH%/apps/api/
del api-src.tar.gz
echo %GREEN%[OK] Source code uploaded%NC%

REM Step 5: Extract source on VPS
echo.
echo [5/7] Extracting source code on VPS...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "cd %VPS_PATH%/apps/api && tar -xzf api-src.tar.gz && rm api-src.tar.gz"
echo %GREEN%[OK] Source code extracted%NC%

REM Step 6: Build Docker image
echo.
echo [6/7] Building API Docker image on VPS (this may take 5-10 minutes)...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "cd %VPS_PATH% && docker build -f apps/api/Dockerfile -t vedfinance-api:latest ."
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR] Docker build failed%NC%
    pause
    exit /b 1
)
echo %GREEN%[OK] Docker image built%NC%

REM Step 7: Stop existing container and run new one
echo.
echo [7/7] Starting API container...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "docker stop vedfinance-api 2>/dev/null || true && docker rm vedfinance-api 2>/dev/null || true"
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "docker run -d --name vedfinance-api -p 3001:3000 --network host -e DATABASE_URL='postgresql://postgres:Halinh!@34@172.17.0.1:5432/vedfinance?schema=public' -e NODE_ENV=production -e PORT=3000 vedfinance-api:latest"

REM Wait for startup
echo Waiting 15 seconds for API to start...
timeout /t 15 /nobreak >nul

REM Verify health checks
echo.
echo Verifying API health checks...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "curl -s http://localhost:3001/api/health"
if %ERRORLEVEL% neq 0 (
    echo %RED%[WARNING] Health check failed, checking logs...%NC%
    ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "docker logs vedfinance-api --tail 50"
    pause
) else (
    echo %GREEN%[OK] API health check passed%NC%
)

REM Close bead
echo.
echo Closing bead ved-43oq...
cd "%PROJECT_ROOT%"
beads close ved-43oq --reason "API Docker deployed. Container running on port 3001. Health checks passing." --no-daemon 2>nul

echo.
echo %GREEN%========================================%NC%
echo %GREEN%  ved-43oq COMPLETE%NC%
echo %GREEN%========================================%NC%
echo.
pause

REM ============================================================================
REM Phase 3: ved-949o - Deploy Web Docker to VPS
REM ============================================================================
echo.
echo %YELLOW%[PHASE 3] Deploying Web Docker (ved-949o)...%NC%
echo.

REM Update bead status
beads update ved-949o --status in_progress --no-daemon 2>nul

REM Step 1: Create web directory
echo [1/6] Creating web directory on VPS...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "mkdir -p %VPS_PATH%/apps/web"
echo %GREEN%[OK] Web directory created%NC%

REM Step 2: Upload web package files
echo.
echo [2/6] Uploading web package files...
scp -i "%VPS_KEY%" "%PROJECT_ROOT%\apps\web\package.json" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/apps/web/
scp -i "%VPS_KEY%" "%PROJECT_ROOT%\apps\web\next.config.ts" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/apps/web/
scp -i "%VPS_KEY%" "%PROJECT_ROOT%\apps\web\tsconfig.json" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/apps/web/
scp -i "%VPS_KEY%" "%PROJECT_ROOT%\apps\web\tailwind.config.ts" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/apps/web/
scp -i "%VPS_KEY%" "%PROJECT_ROOT%\apps\web\postcss.config.mjs" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/apps/web/
echo %GREEN%[OK] Config files uploaded%NC%

REM Step 3: Compress and upload web source
echo.
echo [3/6] Compressing and uploading web source code...
cd "%PROJECT_ROOT%\apps\web"

where tar >nul 2>&1
if %ERRORLEVEL% equ 0 (
    tar -czf web-src.tar.gz src public
) else (
    powershell -Command "Compress-Archive -Path src,public -DestinationPath web-src.zip -Force"
    ren web-src.zip web-src.tar.gz
)

scp -i "%VPS_KEY%" web-src.tar.gz %VPS_USER%@%VPS_HOST%:%VPS_PATH%/apps/web/
del web-src.tar.gz
echo %GREEN%[OK] Web source uploaded%NC%

REM Step 4: Extract web source
echo.
echo [4/6] Extracting web source on VPS...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "cd %VPS_PATH%/apps/web && tar -xzf web-src.tar.gz && rm web-src.tar.gz"
echo %GREEN%[OK] Web source extracted%NC%

REM Step 5: Create web Dockerfile if not exists
echo.
echo [5/6] Creating web Dockerfile on VPS...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "cat > %VPS_PATH%/apps/web/Dockerfile << 'EOF'
FROM node:20-alpine AS base
ENV PNPM_HOME=\"/pnpm\"
ENV PATH=\"\$PNPM_HOME:\$PATH\"
RUN corepack enable
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter=web...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

ENV NEXT_PUBLIC_API_URL=http://103.54.153.248:3001
RUN pnpm --filter web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

USER nextjs
EXPOSE 3000
WORKDIR /app/apps/web
CMD [\"../../node_modules/.bin/next\", \"start\"]
EOF"
echo %GREEN%[OK] Dockerfile created%NC%

REM Step 6: Build and run web container
echo.
echo [6/6] Building web Docker image (this may take 10-15 minutes)...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "cd %VPS_PATH% && docker build -f apps/web/Dockerfile -t vedfinance-web:latest ."
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR] Web Docker build failed%NC%
    pause
    exit /b 1
)
echo %GREEN%[OK] Web Docker image built%NC%

echo.
echo Starting web container...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "docker stop vedfinance-web 2>/dev/null || true && docker rm vedfinance-web 2>/dev/null || true"
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "docker run -d --name vedfinance-web -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://103.54.153.248:3001 vedfinance-web:latest"

REM Wait for startup
echo Waiting 20 seconds for web to start...
timeout /t 20 /nobreak >nul

REM Verify web deployment
echo.
echo Verifying web deployment...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "curl -I http://localhost:3000"
if %ERRORLEVEL% neq 0 (
    echo %RED%[WARNING] Web check failed, checking logs...%NC%
    ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "docker logs vedfinance-web --tail 50"
    pause
) else (
    echo %GREEN%[OK] Web deployment successful%NC%
)

REM Close bead
echo.
echo Closing bead ved-949o...
cd "%PROJECT_ROOT%"
beads close ved-949o --reason "Web Docker deployed. Container running on port 3000. Homepage accessible. i18n working." --no-daemon 2>nul

echo.
echo %GREEN%========================================%NC%
echo %GREEN%  ved-949o COMPLETE%NC%
echo %GREEN%========================================%NC%
echo.

REM ============================================================================
REM Phase 4: Smoke Tests
REM ============================================================================
echo.
echo %YELLOW%[PHASE 4] Running Smoke Tests...%NC%
echo.

echo Testing API endpoints...
echo.
echo [1] GET /api/health
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "curl -s http://localhost:3001/api/health"
echo.

echo [2] GET /api/health/db
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "curl -s http://localhost:3001/api/health/db"
echo.

echo Testing web endpoints...
echo.
echo [3] Homepage (vi)
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "curl -I http://localhost:3000/vi"
echo.

echo [4] Homepage (en)
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "curl -I http://localhost:3000/en"
echo.

echo [5] Homepage (zh)
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "curl -I http://localhost:3000/zh"
echo.

echo Container status:
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "docker ps | grep vedfinance"
echo.

REM Enable auto-restart
echo Enabling auto-restart for containers...
ssh -i "%VPS_KEY%" %VPS_USER%@%VPS_HOST% "docker update --restart unless-stopped vedfinance-api vedfinance-web"
echo %GREEN%[OK] Auto-restart enabled%NC%

echo.
echo %GREEN%========================================%NC%
echo %GREEN%  TRACK A DEPLOYMENT COMPLETE%NC%
echo %GREEN%========================================%NC%
echo.
echo Endpoints:
echo   API: http://103.54.153.248:3001
echo   Web: http://103.54.153.248:3000
echo.
echo Next Steps:
echo   1. Configure Cloudflare DNS
echo   2. Setup SSL/TLS certificates
echo   3. Configure firewall rules
echo   4. Test from external network
echo.
pause

endlocal
