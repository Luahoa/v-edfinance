# Database Documentation

Database architecture, schema management, and migration guides for V-EdFinance.

## Contents

### Architecture
- [Architecture](architecture.md) - Database design and patterns
- [ERD](erd.md) - Entity Relationship Diagram
- [Connection Pool](connection-pool.md) - Pooling configuration

### Schema Management
- [JSONB Schema Audit](jsonb-schema-audit.md) - Multi-lingual field validation
- [Schema Drift Audit Plan](schema-drift-audit-plan.md) - Drift detection strategy
- [Schema Fix Guide](schema-fix-guide.md) - Common schema issues and fixes

### Migrations
- [Migration Guide: Payment System](migration-guide-payment-system.md) - Payment schema migrations
- [Manual Migration: Add Integration Models](manual-migration-add-integration-models.md) - Integration model setup
- [Migration Dry Run Checklist](migration-dry-run-checklist.md) - Pre-migration validation

### Operations
- [Production Master Plan](production-master-plan.md) - Production database setup

## Common Commands

```bash
npx prisma migrate dev     # Run migrations
npx prisma generate        # Generate Prisma client
npx prisma studio          # Open Prisma Studio
```

## Tech Stack

- **PostgreSQL** - Primary database
- **Prisma** - ORM and migrations
- **JSONB** - Localized content storage (vi, en, zh)
