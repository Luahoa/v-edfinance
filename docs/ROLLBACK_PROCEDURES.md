# V-EdFinance Rollback Procedures

## Database Rollback

### Scenario 1: Rollback Latest Migration
```bash
# SSH to VPS
ssh root@103.54.153.248

# Navigate to project
cd /var/www/v-edfinance/apps/api

# Rollback last migration
npx prisma migrate resolve --rolled-back <migration_name>

# Verify database state
npx prisma db pull
```

### Scenario 2: Restore from Backup
```bash
# Stop API service
pm2 stop api

# Restore from latest backup
pg_restore -h localhost -U postgres -d v_edfinance /backups/latest.dump

# Restart API
pm2 start api
```

## Code Rollback

### Scenario 1: Rollback via Git
```bash
# SSH to VPS
ssh root@103.54.153.248

# Navigate to project
cd /var/www/v-edfinance

# Find last working commit
git log --oneline -10

# Rollback to commit
git reset --hard <commit_hash>

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build

# Restart services
pm2 restart all
```

### Scenario 2: Redeploy Previous Version
```bash
# From local machine
git revert <bad_commit_hash>
git push origin main

# On VPS (auto-deploy via webhook)
# Or manual:
git pull
pnpm install
pnpm build
pm2 restart all
```

## Rollback Checklist

Before rollback:
- [ ] Identify root cause of issue
- [ ] Backup current state (database + code)
- [ ] Notify team of rollback
- [ ] Document incident

During rollback:
- [ ] Follow procedures above
- [ ] Verify services restart successfully
- [ ] Run smoke tests
- [ ] Monitor logs for errors

After rollback:
- [ ] Verify production is stable
- [ ] Update incident report
- [ ] Plan fix for next deployment

## Emergency Contacts
- VPS Provider: [Support info]
- Database Admin: [Contact]
- DevOps Lead: [Contact]
