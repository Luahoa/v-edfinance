@echo off
echo ================================
echo Database Seed Testing Suite
echo ================================
echo.

cd /d "c:\Users\luaho\Demo project\v-edfinance\apps\api"

echo [Phase 1] T1.1: Basic Seed Integrity Test
echo ==========================================
echo.

echo Step 1: Reset database and run basic seed...
call pnpm exec npx prisma migrate reset --force --skip-seed
if %errorlevel% neq 0 (
    echo ERROR: Migration reset failed
    pause
    exit /b 1
)

echo.
echo Step 2: Running basic seed...
call pnpm exec ts-node prisma/seed.ts
if %errorlevel% neq 0 (
    echo ERROR: Basic seed failed
    pause
    exit /b 1
)

echo.
echo Step 3: Verifying seeded data...
echo Running SQL verification queries...
echo.

echo Query 1: Count Users
psql %DATABASE_URL% -c "SELECT COUNT(*) as user_count FROM \"User\";"

echo.
echo Query 2: Count Courses
psql %DATABASE_URL% -c "SELECT COUNT(*) as course_count FROM \"Course\";"

echo.
echo Query 3: Count Lessons
psql %DATABASE_URL% -c "SELECT COUNT(*) as lesson_count FROM \"Lesson\";"

echo.
echo Query 4: Count Checklists
psql %DATABASE_URL% -c "SELECT COUNT(*) as checklist_count FROM \"UserChecklist\";"

echo.
echo Query 5: Verify Admin User
psql %DATABASE_URL% -c "SELECT email, role FROM \"User\" WHERE role = 'ADMIN';"

echo.
echo ==========================================
echo [Phase 1] T1.2: Dev Scenario Validation
echo ==========================================
echo.

echo Resetting database for dev scenario...
call pnpm exec npx prisma migrate reset --force --skip-seed

echo.
echo Running dev seed scenario...
call pnpm exec ts-node prisma/seeds/index.ts dev
if %errorlevel% neq 0 (
    echo ERROR: Dev seed failed
    pause
    exit /b 1
)

echo.
echo Verifying dev scenario data scale...
echo.

echo Query 1: User count by role
psql %DATABASE_URL% -c "SELECT role, COUNT(*) FROM \"User\" GROUP BY role;"

echo.
echo Query 2: Course count
psql %DATABASE_URL% -c "SELECT COUNT(*) as course_count FROM \"Course\";"

echo.
echo Query 3: Lesson count
psql %DATABASE_URL% -c "SELECT COUNT(*) as lesson_count FROM \"Lesson\";"

echo.
echo Query 4: Behavior log count
psql %DATABASE_URL% -c "SELECT COUNT(*) as log_count FROM \"BehaviorLog\";"

echo.
echo Query 5: Buddy group count
psql %DATABASE_URL% -c "SELECT COUNT(*) as group_count FROM \"BuddyGroup\";"

echo.
echo ==========================================
echo [Phase 1] T1.3: JSONB Schema Validation
echo ==========================================
echo.

echo Verifying JSONB structure integrity...
echo.

echo Query 1: Course titles (multi-lingual)
psql %DATABASE_URL% -c "SELECT slug, title->>'vi' as title_vi, title->>'en' as title_en, title->>'zh' as title_zh FROM \"Course\" LIMIT 5;"

echo.
echo Query 2: User metadata
psql %DATABASE_URL% -c "SELECT email, metadata->>'displayName' as display_name, \"preferredLocale\" FROM \"User\" WHERE role = 'STUDENT' LIMIT 5;"

echo.
echo Query 3: Lesson content
psql %DATABASE_URL% -c "SELECT title->>'vi' as title, type, published FROM \"Lesson\" WHERE published = true LIMIT 5;"

echo.
echo Query 4: Check NULL violations in i18n fields
psql %DATABASE_URL% -c "SELECT COUNT(*) as null_count FROM \"Course\" WHERE title->>'vi' IS NULL OR title->>'en' IS NULL OR title->>'zh' IS NULL;"

echo.
echo ==========================================
echo Database Table Statistics
echo ==========================================
psql %DATABASE_URL% -c "SELECT table_name, n_live_tup as row_count FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY n_live_tup DESC;"

echo.
echo ==========================================
echo Phase 1 Testing Complete!
echo ==========================================
echo.
echo Next steps:
echo - Review results above
echo - Check for any errors or unexpected counts
echo - Proceed to Phase 2 (Triple-ORM Verification)
echo.
pause
