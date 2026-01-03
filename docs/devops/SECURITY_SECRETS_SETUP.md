# 🔐 Security Secrets Setup Guide

> **CRITICAL:** This guide is for setting up production secrets after V-SEC-001 security fix.

---

## 🚨 URGENT: Generate Production Secrets

### Step 1: Generate JWT Secrets

Run these commands to generate cryptographically secure secrets:

```bash
# Generate JWT_SECRET (128 characters)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET (128 characters - MUST be different)
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

**Example Output:**
```
JWT_SECRET=113042bb1d50adbc59853db0a50dc82b80a77eaa56625e2d344c40af1c59a758a2d644cbd06aa18c67db5ca015dac518db896466a86f51c9c634aaa30fc41456
JWT_REFRESH_SECRET=c5e1b590cfeb1fd497c1d7dbf240dddc3fc6d081addbf2b5c4c5583d020d571f95dd7a1128802c17e6d3304c1454e6db015a31cbeb9b8300e1a7747e51dfdc0d
```

---

## 📝 Step 2: Update Environment Files

### Development (.env)

1. Copy `.env.example` to `.env`:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

2. Replace the placeholders with your generated secrets:
   ```bash
   JWT_SECRET=<paste-your-generated-secret-1>
   JWT_REFRESH_SECRET=<paste-your-generated-secret-2>
   ```

### Production (VPS/Docker)

**For VPS Deployment (Dokploy):**
1. Log into Dokploy dashboard: http://103.54.153.248:3000
2. Navigate to your project environment variables
3. Add/Update:
   - `JWT_SECRET` = (your generated secret 1)
   - `JWT_REFRESH_SECRET` = (your generated secret 2)

**For Docker Deployment:**
```bash
# Set as environment variables
export JWT_SECRET="your-generated-secret-1"
export JWT_REFRESH_SECRET="your-generated-secret-2"
```

**For GitHub Actions (CI/CD):**
1. Go to: Settings → Secrets and variables → Actions
2. Add secrets:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`

---

## ✅ Step 3: Verify Configuration

### Test Locally

```bash
# Start the API server
cd apps/api
pnpm dev

# Expected: Server starts successfully
# If you see: "CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required"
# → Your .env file is missing or JWT_SECRET is not set
```

### Test Production

```bash
# SSH into VPS
ssh root@103.54.153.248

# Check if secrets are loaded
echo $JWT_SECRET  # Should show your secret

# Restart the application
dokploy restart <your-project>
```

---

## 🔒 Security Best Practices

### ✅ DO
- **Generate unique secrets** for each environment (dev, staging, prod)
- **Use different secrets** for JWT_SECRET and JWT_REFRESH_SECRET
- **Store secrets in secure vaults** (HashiCorp Vault, AWS Secrets Manager)
- **Rotate secrets** every 90 days (fintech compliance)
- **Use environment variables** - NEVER commit secrets to git

### ❌ DON'T
- DON'T use the example secrets from this guide in production
- DON'T commit `.env` files to git (already in `.gitignore`)
- DON'T share secrets in Slack/email/Discord
- DON'T reuse secrets across environments
- DON'T use weak secrets like "secret123" or "password"

---

## 🛡️ Secret Rotation (Recommended Every 90 Days)

### When to Rotate
- Every 90 days (PCI DSS requirement)
- After suspected security breach
- When team member with access leaves
- After public code repository exposure

### How to Rotate

1. **Generate new secrets** (same commands as Step 1)
2. **Deploy to staging first** to verify no issues
3. **Update production secrets** during low-traffic window
4. **Monitor error logs** for authentication failures
5. **Invalidate old refresh tokens** (users will need to re-login)

```sql
-- Invalidate all existing refresh tokens (forces re-login)
UPDATE "RefreshToken" SET "revoked" = true;
```

---

## 🚨 Emergency: Secrets Compromised

If you suspect secrets have been compromised:

1. **IMMEDIATELY generate and deploy new secrets**
2. **Revoke all tokens:**
   ```sql
   UPDATE "RefreshToken" SET "revoked" = true;
   ```
3. **Force all users to re-login**
4. **Audit access logs** for suspicious activity
5. **Notify security team/management**
6. **Document incident** for compliance

---

## 📋 Checklist

Before deploying to production, verify:

- [ ] Generated unique JWT_SECRET (128 characters)
- [ ] Generated unique JWT_REFRESH_SECRET (128 characters)
- [ ] Updated `.env` for local development
- [ ] Updated VPS/Dokploy environment variables
- [ ] Updated CI/CD secrets (GitHub Actions)
- [ ] Tested application starts successfully
- [ ] Verified `.env` is in `.gitignore`
- [ ] Documented secrets in password manager (1Password, LastPass)
- [ ] Scheduled secret rotation (90 days)

---

## 📚 Related Security Fixes

This guide is part of the V-SEC-001 security fix:
- See: [SECURITY_AUDIT_REPORT_2025-12-23.md](SECURITY_AUDIT_REPORT_2025-12-23.md)
- Beads Task: ved-ys0

Other security improvements:
- V-SEC-002: Middleware auth bypass fix
- V-SEC-003: JWT type safety fix
- V-SEC-004: Input validation on name field
- V-SEC-005: Strong password policy (12+ chars)

---

## 🆘 Troubleshooting

### Error: "CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required"

**Solution:** 
1. Check `.env` file exists in `apps/api/`
2. Verify `JWT_SECRET` is set and not empty
3. Restart the dev server

### Error: "Invalid token signature"

**Solution:**
1. Verify JWT_SECRET matches between frontend and backend
2. Clear browser cookies and re-login
3. Check for secret typos (no extra spaces/newlines)

### Users can't login after secret rotation

**Expected behavior:** Users must re-login after JWT secret changes.
**Solution:** 
1. Communicate planned maintenance to users
2. Revoke all refresh tokens before deploying new secret
3. Display friendly "Please login again" message

---

**Status:** ✅ Setup complete  
**Next Steps:** Run security tests with `pnpm --filter api test`
