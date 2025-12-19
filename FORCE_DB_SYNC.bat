@echo off
set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%apps\api"

echo [1/4] Cleaning old migrations...
if exist prisma\migrations (
    rmdir /s /q prisma\migrations
)

echo [2/4] Force generating Prisma client...
call npx prisma generate

echo [3/4] Creating Fresh Migration (Port 5433)...
set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/vedfinance?schema=public
call npx prisma migrate dev --name init_fresh

echo [4/4] Seeding data...
call npx prisma db seed

pause
