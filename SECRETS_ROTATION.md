# Secrets Rotation Plan

## Secrets Inventory

| Secret | Location | Rotation Frequency | Impact |
|--------|----------|-------------------|---------|
| JWT_SECRET | .env | Every 90 days | Invalidates all tokens |
| JWT_REFRESH_SECRET | .env | Every 90 days | Invalidates refresh tokens |
| DATABASE_URL | .env | When compromised | Database access |
| REDIS_URL | .env | When compromised | Cache/sessions |
| CLOUDFLARE_API_KEY | .env | Every 180 days | R2/Pages deploy |
| GEMINI_API_KEY | .env | Every 180 days | AI features |
| R2_ACCESS_KEY_ID | .env | Every 180 days | R2 storage access |
| R2_SECRET_ACCESS_KEY | .env | Every 180 days | R2 storage access |

## Rotation Procedures

### JWT_SECRET Rotation
```bash
# 1. Generate new secret
openssl rand -base64 32

# 2. Update .env on VPS
ssh root@103.54.153.248
cd /var/www/v-edfinance/apps/api
nano .env
# Update JWT_SECRET=<new_secret>

# 3. Restart API
pm2 restart api

# 4. IMPACT: All users must re-login
# 5. Notify users via email/notification
```

### DATABASE_URL Rotation
```bash
# 1. Create new database user
psql -U postgres
CREATE USER new_user WITH PASSWORD 'new_password';
GRANT ALL ON DATABASE v_edfinance TO new_user;

# 2. Update .env
DATABASE_URL=postgresql://new_user:new_password@localhost:5432/v_edfinance

# 3. Test connection
npx prisma db pull

# 4. Restart API
pm2 restart api

# 5. Revoke old user
DROP USER old_user;
```

### Cloudflare R2 Keys Rotation
```bash
# 1. Generate new R2 API token in Cloudflare dashboard
# Dashboard → R2 → Manage R2 API Tokens → Create API Token

# 2. Update .env on VPS
ssh root@103.54.153.248
cd /var/www/v-edfinance/apps/api
nano .env
# Update R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY

# 3. Test R2 connection
npm run test:r2-upload

# 4. Restart API
pm2 restart api

# 5. Revoke old token in Cloudflare dashboard
```

### GEMINI_API_KEY Rotation
```bash
# 1. Generate new API key in Google AI Studio
# https://aistudio.google.com/app/apikey

# 2. Update .env on VPS
ssh root@103.54.153.248
cd /var/www/v-edfinance/apps/api
nano .env
# Update GEMINI_API_KEY=<new_key>

# 3. Restart API
pm2 restart api

# 4. Delete old key in Google AI Studio
```

## Rotation Schedule

- **Monthly**: Review secrets inventory
- **Quarterly (90 days)**: Rotate JWT secrets
- **Semi-annually (180 days)**: Rotate API keys (Cloudflare, Gemini)
- **As-needed**: Rotate if compromised

## Emergency Rotation (If Compromised)

### Immediate Actions (0-15 minutes)
1. **Rotate compromised secret immediately**
2. **Restart affected services**
3. **Monitor error logs for unauthorized access**

### Short-term Actions (1 hour)
1. **Audit access logs** for suspicious activity
2. **Identify scope of compromise** (which systems accessed)
3. **Notify security team** (if applicable)

### Follow-up Actions (24 hours)
1. **Notify affected users** (if user data compromised)
2. **Document incident** in security log
3. **Review access controls** to prevent recurrence

### Post-incident (1 week)
1. **Post-incident review** with team
2. **Update security procedures** based on learnings
3. **Verify all related secrets** rotated

## Rotation Checklist

Before rotating:
- [ ] Backup current .env file
- [ ] Document current secret values (in secure location)
- [ ] Schedule maintenance window (if needed)
- [ ] Prepare rollback plan

During rotation:
- [ ] Generate new secret
- [ ] Update .env file
- [ ] Restart services
- [ ] Verify service health

After rotation:
- [ ] Test critical functionality
- [ ] Monitor logs for errors
- [ ] Document rotation in security log
- [ ] Schedule next rotation

## Best Practices

1. **Never commit secrets to git** - Use .env files (in .gitignore)
2. **Use different secrets per environment** (dev/staging/prod)
3. **Store secrets in secure password manager** (1Password, Bitwarden)
4. **Rotate on schedule** - Don't wait for compromise
5. **Test rotation procedure** in staging first
6. **Document all rotations** in security log

## Emergency Contacts
- Security Lead: [Contact]
- DevOps Lead: [Contact]
- VPS Provider Support: [Support info]
- Cloudflare Support: support.cloudflare.com
