@echo off
echo ================================
echo Phase 4: Benchmark Testing
echo ================================
echo.

cd /d "c:\Users\luaho\Demo project\v-edfinance\apps\api"

echo [Phase 4.1] Benchmark Seed Performance Test
echo ================================================
echo.

echo Resetting database for benchmark...
call pnpm exec npx prisma migrate reset --force --skip-seed
if %errorlevel% neq 0 (
    echo ERROR: Migration reset failed
    pause
    exit /b 1
)

echo.
echo Starting benchmark seed...
echo Expected: 10,000 users, 100 courses, 90 days of logs
echo This may take 3-5 minutes...
echo.

set START_TIME=%time%
call pnpm exec ts-node prisma/seeds/index.ts benchmark
set END_TIME=%time%

if %errorlevel% neq 0 (
    echo ERROR: Benchmark seed failed
    pause
    exit /b 1
)

echo.
echo ================================================
echo Benchmark Seed Completed!
echo ================================================
echo Start Time: %START_TIME%
echo End Time: %END_TIME%
echo.

echo Verifying benchmark data scale...
echo.

echo Query 1: Total row counts
psql %DATABASE_URL% -c "SELECT table_name, n_live_tup as row_count FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY n_live_tup DESC;"

echo.
echo Query 2: Database size
psql %DATABASE_URL% -c "SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;"

echo.
echo Query 3: User distribution by role
psql %DATABASE_URL% -c "SELECT role, COUNT(*) FROM \"User\" GROUP BY role;"

echo.
echo Query 4: Course count
psql %DATABASE_URL% -c "SELECT COUNT(*) as course_count FROM \"Course\";"

echo.
echo Query 5: Behavior log statistics
psql %DATABASE_URL% -c "SELECT COUNT(*) as total_logs, MIN(\"createdAt\") as earliest, MAX(\"createdAt\") as latest FROM \"BehaviorLog\";"

echo.
echo Query 6: Average lessons per course
psql %DATABASE_URL% -c "SELECT AVG(lesson_count)::numeric(10,2) as avg_lessons FROM (SELECT \"courseId\", COUNT(*) as lesson_count FROM \"Lesson\" GROUP BY \"courseId\") sub;"

echo.
echo ================================================
echo [Phase 4.2] Database Architect Agent Performance
echo ================================================
echo.

echo Testing Database Architect Agent on benchmark dataset...
echo Expected: Analysis completes in < 2 minutes
echo.

set AGENT_START=%time%

echo Sending analyze request to agent...
curl -X POST http://localhost:3001/api/database/architect/analyze -H "Content-Type: application/json" -o agent_analysis.json

set AGENT_END=%time%

if %errorlevel% equ 0 (
    echo.
    echo Agent Analysis Complete!
    echo Start Time: %AGENT_START%
    echo End Time: %AGENT_END%
    echo.
    echo Results saved to: agent_analysis.json
    echo.
    type agent_analysis.json | more
) else (
    echo.
    echo WARNING: Agent analysis endpoint not available
    echo Make sure API server is running: pnpm --filter api start
)

echo.
echo ================================================
echo [Phase 4.3] Query Performance Benchmarks
echo ================================================
echo.

echo Running query performance tests...
echo.

echo Test 1: Simple SELECT (cold cache)
psql %DATABASE_URL% -c "EXPLAIN ANALYZE SELECT * FROM \"User\" LIMIT 100;" | findstr "Execution Time"

echo.
echo Test 2: JOIN with aggregation
psql %DATABASE_URL% -c "EXPLAIN ANALYZE SELECT u.role, COUNT(bl.id) FROM \"User\" u LEFT JOIN \"BehaviorLog\" bl ON u.id = bl.\"userId\" GROUP BY u.role;" | findstr "Execution Time"

echo.
echo Test 3: JSONB query
psql %DATABASE_URL% -c "EXPLAIN ANALYZE SELECT title->>'vi' FROM \"Course\" WHERE (title->>'vi') LIKE '%%Tài%%' LIMIT 10;" | findstr "Execution Time"

echo.
echo Test 4: Complex analytics query
psql %DATABASE_URL% -c "EXPLAIN ANALYZE SELECT DATE(bl.\"createdAt\") as day, COUNT(*) FROM \"BehaviorLog\" bl GROUP BY DATE(bl.\"createdAt\") ORDER BY day DESC LIMIT 30;" | findstr "Execution Time"

echo.
echo ================================================
echo [Phase 4.4] Memory & Storage Analysis
echo ================================================
echo.

echo Database memory usage:
psql %DATABASE_URL% -c "SELECT pg_size_pretty(sum(pg_total_relation_size(table_name::text))) as total_size FROM information_schema.tables WHERE table_schema = 'public';"

echo.
echo Top 10 largest tables:
psql %DATABASE_URL% -c "SELECT table_name, pg_size_pretty(pg_total_relation_size(table_name::text)) as size FROM information_schema.tables WHERE table_schema = 'public' ORDER BY pg_total_relation_size(table_name::text) DESC LIMIT 10;"

echo.
echo Index usage statistics:
psql %DATABASE_URL% -c "SELECT schemaname, tablename, indexname, idx_scan as scans FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan DESC LIMIT 10;"

echo.
echo ================================================
echo Phase 4 Complete!
echo ================================================
echo.
echo Summary:
echo - Benchmark seed completed (%START_TIME% to %END_TIME%)
echo - Database size verified (should be < 2GB)
echo - Agent performance tested
echo - Query benchmarks recorded
echo.
echo Next steps:
echo - Review performance metrics
echo - Compare against baseline
echo - Optimize slow queries if needed
echo.
pause
