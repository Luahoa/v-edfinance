# Security Policy

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability in V-EdFinance, please report it responsibly.

### How to Report

**Email**: [Your security contact email]  
**Response Time**: Within 24 hours  
**Disclosure Policy**: Coordinated disclosure

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to Expect

1. **Acknowledgment**: We'll confirm receipt within 24 hours
2. **Assessment**: We'll evaluate severity and impact within 48 hours
3. **Fix**: Critical issues will be patched within 7 days
4. **Disclosure**: We'll coordinate public disclosure with you

---

## Security Best Practices

### For Developers

#### Never Commit Secrets

**Prohibited in version control**:
- API keys (Stripe, Google AI, Cloudflare, etc.)
- Database credentials
- SSH private keys
- JWT secrets
- OAuth client secrets
- Environment files (`.env`, `.env.local`, etc.)

**Use environment variables**:
```bash
# .env (NEVER commit this file)
DATABASE_URL=postgresql://user:password@host:5432/dbname
STRIPE_SECRET_KEY=sk_live_your_key_here
JWT_SECRET=your-jwt-secret-min-32-chars
```

#### SSH Key Management

**Best practices**:
- Store SSH keys in `~/.ssh/` directory only
- Use `ed25519` keys (stronger than RSA)
- Set proper permissions: `chmod 600 ~/.ssh/private_key`
- Never commit private keys to git
- Rotate keys immediately if compromised

**Example key generation**:
```bash
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/vps_key
```

#### Git Security

**Before every commit**:
- Review `git diff` for secrets
- Use `.gitignore` to exclude sensitive files
- Enable pre-commit hooks to scan for secrets

**If you accidentally commit secrets**:
1. **DO NOT** just delete the file - it's still in git history
2. Remove from history: Use BFG Repo-Cleaner or `git filter-repo`
3. Rotate the compromised secret immediately
4. Force push the cleaned history
5. Document the incident in `SECRETS_ROTATION.md`

---

## Incident Response

### If Secrets Are Compromised

**Immediate Actions** (within 1 hour):

1. **Assess Impact**
   - What secret was exposed?
   - How long was it exposed?
   - Who had access?

2. **Rotate Secrets**
   - Generate new credentials
   - Deploy to production
   - Revoke old credentials
   - Test that services still work

3. **Remove from Git History**
   ```bash
   # Using git-filter-repo
   pip install git-filter-repo
   git filter-repo --path sensitive_file.txt --invert-paths
   git push origin --force --all
   ```

4. **Document**
   - Log incident in `SECRETS_ROTATION.md`
   - Update team on actions taken
   - Review how it happened and prevent recurrence

### Secret Rotation Checklist

- [ ] New secret generated
- [ ] New secret deployed to production
- [ ] Services tested and working
- [ ] Old secret revoked/deactivated
- [ ] Old secret removed from git history
- [ ] Force push completed
- [ ] Team notified
- [ ] Incident documented

---

## Security Patterns in .gitignore

Our `.gitignore` includes comprehensive security patterns to prevent accidental commits:

```gitignore
# Environment files (ALL VARIANTS)
.env
.env.*
*.env
.env.local
.env.development
.env.production

# SSH Keys (ALL PATTERNS)
*.pem
*.key
*.ppk
id_rsa
id_ed25519
id_dsa
*_rsa
*_ed25519
*_dsa
*.pub (except in docs/)

# API Keys & Secrets
*secret*
*token*
*credentials*
*password*
secrets.json
secrets.yml

# Database dumps
*.sql
*.dump
*.backup

# Certificates
*.crt
*.p12
*.pfx
*.cer
```

---

## Secure Development Guidelines

### Code Review Requirements

All code changes must:
- [ ] Pass automated security scans
- [ ] Have no hardcoded secrets
- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Validate and sanitize user input
- [ ] Implement proper authentication/authorization
- [ ] Use HTTPS for all external communications

### Dependency Management

- Keep dependencies up to date
- Review security advisories regularly
- Use `npm audit` / `pnpm audit` to check for vulnerabilities
- Enable Dependabot alerts on GitHub

### Production Deployment

**Pre-deployment checklist**:
- [ ] All secrets in environment variables
- [ ] SSL/TLS certificates valid
- [ ] Database backups configured
- [ ] Monitoring and alerts set up
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] Error messages don't leak sensitive info

---

## Security Contacts

**Security Team**: [Your team email]  
**Emergency Contact**: [24/7 contact]  
**PGP Key**: [Link to PGP key for encrypted communication]

---

## Recent Security Incidents

See [SECRETS_ROTATION.md](./SECRETS_ROTATION.md) for history of secret rotations and security incidents.

---

## Compliance

- **Data Protection**: GDPR compliant
- **Payment Security**: PCI-DSS compliant (via Stripe)
- **Encryption**: AES-256 for data at rest, TLS 1.3 for data in transit

---

**Last Updated**: 2026-01-05  
**Version**: 1.0  
**Review Cycle**: Quarterly
