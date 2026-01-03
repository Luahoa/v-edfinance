# VED-6YB: Manual Pgvector Enablement on VPS

## SSH Configuration Required

Your SSH public key is registered:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIQ9zzPL67+KHi9QcgDzVcyabkQDbx9+yuRqnKZsimFp
name: amp-agent
```

## Option 1: Manual SSH Execution

```bash
# Connect to VPS
ssh root@103.54.153.248

# Find PostgreSQL container
docker ps | grep postgres

# Enable pgvector on all databases
docker exec <CONTAINER_ID> psql -U postgres -d vedfinance_prod -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec <CONTAINER_ID> psql -U postgres -d vedfinance_staging -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec <CONTAINER_ID> psql -U postgres -d vedfinance_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec <CONTAINER_ID> psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Verify
docker exec <CONTAINER_ID> psql -U postgres -d vedfinance_prod -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
```

## Option 2: Use Dokploy Console

1. Access Dokploy Dashboard: http://103.54.153.248:3000
2. Open PostgreSQL container console
3. Run SQL commands directly

## After Enablement

```bash
./beads.exe close ved-6yb --reason "Enabled pgvector on VPS databases"
```
