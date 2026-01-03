@echo off
echo ================================
echo NUCLEAR OPTION: Complete Reset
echo ================================
echo.
echo This will:
echo - Stop all containers
echo - Delete all volumes
echo - Fresh database setup
echo - Run migrations from scratch
echo.
set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" exit /b

cd /d "C:\Users\luaho\Demo project\v-edfinance"

echo.
echo [1/7] Stopping all Docker containers...
docker-compose -f docker-compose.dev.yml down -v
docker volume rm v-edfinance_postgres_data 2>nul
echo.

echo [2/7] Starting fresh PostgreSQL...
docker-compose -f docker-compose.dev.yml up -d
timeout /t 15 /nobreak > nul
echo.

echo [3/7] Enabling pgvector extension...
docker exec v-edfinance-db psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS vector;"
echo.

cd apps\api

echo [4/7] Deleting migration history...
del /q prisma\migrations\migration_lock.toml 2>nul
docker exec v-edfinance-db psql -U postgres -d v_edfinance -c "DROP TABLE IF EXISTS \"_prisma_migrations\" CASCADE;"
echo.

echo [5/7] Pushing schema (without migrations)...
call npx prisma db push --force-reset --accept-data-loss

if %errorlevel% neq 0 (
    echo ERROR: Schema push failed
    pause
    exit /b 1
)
echo.

echo [6/7] Generating Prisma Client...
call npx prisma generate
echo.

echo [7/7] Running dev seed...
call npx ts-node prisma/seeds/index.ts dev

if %errorlevel% equ 0 (
    echo.
    echo ================================
    echo SUCCESS!
    echo ================================
    echo.
    echo Database seeded successfully!
    echo View data: npx prisma studio
    echo.
) else (
    echo.
    echo ================================  
    echo SEED FAILED
    echo ================================
    echo.
    echo Showing database tables:
    docker exec v-edfinance-db psql -U postgres -d v_edfinance -c "\dt"
    echo.
    echo Describing User table:
    docker exec v-edfinance-db psql -U postgres -d v_edfinance -c "\d \"User\""
)

pause
