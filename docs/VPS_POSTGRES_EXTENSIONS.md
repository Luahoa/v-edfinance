# 🔧 VPS PostgreSQL Extensions Setup

**Status:** 🟡 In Progress (VED-6YB)  
**VPS IP:** 103.54.153.248  
**Date:** 2025-12-22

---

## Required Extensions

### 1. pgvector (Vector Similarity Search)
**Purpose:** Store and query vector embeddings (384 dimensions) for AI Database Architect  
**Task:** VED-6YB  
**Priority:** P0 - Blocks Database Optimization Phase 2

**Installation Commands:**

```bash
# SSH to VPS
ssh root@103.54.153.248

# Find PostgreSQL container
CONTAINER_ID=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.ID}}" | head -n 1)
echo "PostgreSQL Container: $CONTAINER_ID"

# Enable pgvector on all databases
docker exec $CONTAINER_ID psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec $CONTAINER_ID psql -U postgres -d vedfinance_prod -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec $CONTAINER_ID psql -U postgres -d vedfinance_staging -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec $CONTAINER_ID psql -U postgres -d vedfinance_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Verify installation
docker exec $CONTAINER_ID psql -U postgres -d v_edfinance -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
```

**Expected Output:**
```
 extname | extversion 
---------+------------
 vector  | 0.5.1
```

---

### 2. pg_stat_statements (Query Performance Monitoring)
**Purpose:** Track query execution statistics for AI optimization agent  
**Task:** VED-Y1U  
**Priority:** P0

**Installation Commands:**

```bash
# Add to postgresql.conf
docker exec $CONTAINER_ID sh -c "echo 'shared_preload_libraries = '\''pg_stat_statements'\''' >> /var/lib/postgresql/data/postgresql.conf"

# Restart PostgreSQL container
docker restart $CONTAINER_ID

# Enable extension on all databases
docker exec $CONTAINER_ID psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
docker exec $CONTAINER_ID psql -U postgres -d vedfinance_prod -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
docker exec $CONTAINER_ID psql -U postgres -d vedfinance_staging -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# Verify
docker exec $CONTAINER_ID psql -U postgres -d v_edfinance -c "SELECT * FROM pg_stat_statements LIMIT 5;"
```

---

## Database Configuration

**Databases on VPS:**
- `v_edfinance` (primary, local dev)
- `vedfinance_prod` (production)
- `vedfinance_staging` (staging)
- `vedfinance_dev` (development)

**Connection Details:**
- Host: `103.54.153.248`
- Port: `5432` (internal), exposed via Dokploy
- User: `postgres`
- Password: Stored in Dokploy secrets

---

## Troubleshooting

### Extension not found
```bash
# Check if PostgreSQL image has pgvector
docker exec $CONTAINER_ID psql -U postgres -c "SELECT * FROM pg_available_extensions WHERE name = 'vector';"

# If not available, rebuild with pgvector-enabled image
# Alternative: Use ankane/pgvector:latest or timescale/timescaledb:latest-pg15
```

### Permission denied
```bash
# Ensure running as postgres superuser
docker exec $CONTAINER_ID psql -U postgres -c "SELECT current_user, usesuper FROM pg_user WHERE usename = current_user;"
```

---

## Verification Checklist

After installation:

- [ ] pgvector extension enabled on all 4 databases
- [ ] Test vector column creation: `CREATE TABLE test (id serial, embedding vector(384));`
- [ ] Query works: `SELECT embedding <-> '[0,1,2...]'::vector FROM test;`
- [ ] pg_stat_statements tracking queries
- [ ] Restart PostgreSQL container (verify persistence)

---

## Next Steps

1. **VED-6YB** ✅ - Enable pgvector
2. **VED-Y1U** ⏳ - Enable pg_stat_statements
3. **VED-B7M** ✅ - OptimizationLog table created (already has vector column)
4. **VED-WF9** ⏳ - Implement PgvectorService (use vector operations)

---

**Documentation:** This file tracks VPS PostgreSQL extension setup  
**Owner:** Database Optimization Team  
**Last Updated:** 2025-12-22
