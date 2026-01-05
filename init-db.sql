-- =================================================================
-- PostgreSQL Initialization Script for V-EdFinance
-- =================================================================
-- Purpose: Auto-create databases and enable extensions on first run
-- Used by: dokploy.yaml (line 17) - mounted to /docker-entrypoint-initdb.d/
-- Databases: vedfinance_dev, vedfinance_staging, vedfinance_prod
-- Extensions: pgvector, pg_stat_statements
-- =================================================================

\echo '==================================================================='
\echo 'V-EdFinance Database Initialization'
\echo '==================================================================='

-- =================================================================
-- 1. Create Databases
-- =================================================================

\echo '[1/3] Creating databases...'

-- Drop if exists (for clean reinstall)
DROP DATABASE IF EXISTS vedfinance_dev;
DROP DATABASE IF EXISTS vedfinance_staging;
DROP DATABASE IF EXISTS vedfinance_prod;

-- Create databases
CREATE DATABASE vedfinance_dev;
CREATE DATABASE vedfinance_staging;
CREATE DATABASE vedfinance_prod;

\echo '✓ Databases created: vedfinance_dev, vedfinance_staging, vedfinance_prod'

-- =================================================================
-- 2. Enable Extensions (All Databases)
-- =================================================================

\echo '[2/3] Enabling extensions...'

-- Connect to vedfinance_dev
\c vedfinance_dev

CREATE EXTENSION IF NOT EXISTS pgvector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

\echo '✓ Extensions enabled for vedfinance_dev'

-- Connect to vedfinance_staging
\c vedfinance_staging

CREATE EXTENSION IF NOT EXISTS pgvector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

\echo '✓ Extensions enabled for vedfinance_staging'

-- Connect to vedfinance_prod
\c vedfinance_prod

CREATE EXTENSION IF NOT EXISTS pgvector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

\echo '✓ Extensions enabled for vedfinance_prod'

-- =================================================================
-- 3. Configure pg_stat_statements (Runtime Settings)
-- =================================================================

\echo '[3/3] Configuring pg_stat_statements...'

-- These settings apply cluster-wide
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;
ALTER SYSTEM SET pg_stat_statements.track_utility = 'on';

-- Note: Requires adding to postgresql.conf:
-- shared_preload_libraries = 'pg_stat_statements'
-- This is already done in pgvector/pgvector:pg17 image

\echo '✓ pg_stat_statements configured (track=all, max=10000)'

-- =================================================================
-- 4. Verification
-- =================================================================

\echo '==================================================================='
\echo 'Verification'
\echo '==================================================================='

-- Check extensions in staging
\c vedfinance_staging

SELECT 
  'vedfinance_staging' AS database,
  extname AS extension,
  extversion AS version
FROM pg_extension 
WHERE extname IN ('pgvector', 'pg_stat_statements');

-- Check pg_stat_statements is working
SELECT COUNT(*) AS statement_count 
FROM pg_stat_statements;

\echo '==================================================================='
\echo '✅ Initialization Complete!'
\echo '==================================================================='
\echo 'Databases ready:'
\echo '  - vedfinance_dev      (development)'
\echo '  - vedfinance_staging  (staging)'
\echo '  - vedfinance_prod     (production)'
\echo ''
\echo 'Extensions enabled:'
\echo '  - pgvector           (vector similarity search)'
\echo '  - pg_stat_statements (query performance tracking)'
\echo ''
\echo 'Next steps:'
\echo '  1. Run Prisma migrations: npx prisma migrate deploy'
\echo '  2. Verify pg_stat_statements: SELECT * FROM pg_stat_statements LIMIT 5;'
\echo '==================================================================='
