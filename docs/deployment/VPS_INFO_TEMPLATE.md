# 📋 VPS Information Template - V-EdFinance
## Điền Thông Tin Để Bắt Đầu Setup

> **Mục đích:** Template này giúp bạn tổ chức thông tin cần thiết trước khi setup VPS  
> **Lưu ý:** ⚠️ File này chứa thông tin nhạy cảm - KHÔNG commit lên GitHub!

---

## 🖥️ 1. VPS Information

```yaml
Provider: Hetzner Cloud
Plan: CPX31
Location: _____________ (Helsinki / Singapore / Ashburn)

Access Information:
  IP Address: ___.___.___.___ 
  Root Password: _________________ (hoặc để trống nếu dùng SSH key)
  SSH Port: 22 (default)
  
Server Specifications:
  RAM: 8 GB
  CPU: 4 vCPU
  Disk: 160 GB SSD
  Bandwidth: 20 TB/month
  
Created Date: _______________
Monthly Cost: €11.90
```

### SSH Key (nếu sử dụng)

```
SSH Public Key Location: C:\Users\<username>\.ssh\id_ed25519.pub
SSH Private Key Location: C:\Users\<username>\.ssh\id_ed25519

Hoặc tạo mới:
ssh-keygen -t ed25519 -C "v-edfinance-vps"
```

---

## 🌐 2. Domain Information

```yaml
Domain Name: ___________________ (ví dụ: v-edfinance.com)
Registrar: _____________________ (Cloudflare / Namecheap / Google Domains)
DNS Provider: Cloudflare (recommended)

Cloudflare Account:
  Email: _____________________
  API Token: _________________ (optional, cho automation)
```

### DNS Records (sẽ cấu hình sau khi có VPS IP)

```
Type    Name            Target IP       Status
────────────────────────────────────────────────
A       @               ___.___.___.___  [ ] Done
A       www             ___.___.___.___  [ ] Done
A       api             ___.___.___.___  [ ] Done
A       dokploy         ___.___.___.___  [ ] Done
A       staging         ___.___.___.___  [ ] Done
A       api-staging     ___.___.___.___  [ ] Done
A       dev             ___.___.___.___  [ ] Done
A       api-dev         ___.___.___.___  [ ] Done
A       monitoring      ___.___.___.___  [ ] Done

All set to "Proxied" (orange cloud) ✅
```

---

## 🔐 3. GitHub Information

```yaml
Repository URL: https://github.com/_______________/v-edfinance

Branches:
  Production: main
  Staging: staging
  Development: develop
  
GitHub Personal Access Token:
  Create at: https://github.com/settings/tokens
  Token: ghp_________________________
  
  Required Scopes:
  ✅ repo (Full control of private repositories)
  ✅ workflow (Update GitHub Action workflows)
  ✅ read:org (Read org and team membership)
  
  Expiration: No expiration (or 1 year)
  Note: "Dokploy V-EdFinance Deployment"
```

---

## 🔑 4. Environment Variables & Secrets

### 4.1. Database Credentials

```bash
# PostgreSQL (sẽ tạo trong Dokploy)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=_________________________

# Generated Database URLs (sau khi tạo DB):
DATABASE_URL_PROD=postgresql://postgres:<password>@postgres-main:5432/vedfinance_prod
DATABASE_URL_STAGING=postgresql://postgres:<password>@postgres-main:5432/vedfinance_staging
DATABASE_URL_DEV=postgresql://postgres:<password>@postgres-main:5432/vedfinance_dev
```

**Generate strong password:**
```bash
# Method 1: OpenSSL
openssl rand -base64 24

# Method 2: Online
# https://www.random.org/passwords/?num=1&len=24&format=plain
```

### 4.2. JWT Secrets

```bash
# Generate với openssl rand -base64 32
JWT_SECRET=_________________________________
JWT_REFRESH_SECRET=_________________________
```

### 4.3. Redis

```bash
REDIS_URL=redis://redis-main:6379
REDIS_PASSWORD= (để trống hoặc tạo nếu muốn)
```

### 4.4. Cloudflare R2 Storage

```bash
R2_ACCOUNT_ID=_________________________
R2_ACCESS_KEY_ID=__________________
R2_SECRET_ACCESS_KEY=____________________________
R2_BUCKET_NAME=v-edfinance-uploads

# Tạo R2 credentials tại:
# Cloudflare Dashboard → R2 → Manage R2 API Tokens
```

### 4.5. Google AI API

```bash
GOOGLE_AI_API_KEY=_________________________

# Tạo tại:
# https://makersuite.google.com/app/apikey
# hoặc
# https://console.cloud.google.com/apis/credentials
```

### 4.6. Email Service (Optional)

```bash
# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=_________________________@gmail.com
SMTP_PASSWORD=_________________________  # App Password
SMTP_FROM=noreply@v-edfinance.com

# Hoặc SendGrid
SENDGRID_API_KEY=SG._________________________
SENDGRID_FROM_EMAIL=noreply@v-edfinance.com

# Hoặc AWS SES
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=_________________________
AWS_SES_SECRET_ACCESS_KEY=_________________________
```

### 4.7. Application Settings

```bash
NODE_ENV=production
PORT=3000

# Frontend URLs
NEXT_PUBLIC_API_URL=https://api.v-edfinance.com
NEXT_PUBLIC_CDN_URL=https://cdn.v-edfinance.com
NEXT_PUBLIC_APP_URL=https://v-edfinance.com

# API CORS Origins (comma-separated)
CORS_ORIGINS=https://v-edfinance.com,https://www.v-edfinance.com,https://staging.v-edfinance.com

# Cookie Domain
COOKIE_DOMAIN=.v-edfinance.com
```

---

## 📊 5. Monitoring & Alerts

### 5.1. Uptime Kuma

```yaml
Admin Email: _________________________
Admin Password: _________________________

# Notification Channels:
Email: _________________________
Discord Webhook (optional): https://discord.com/api/webhooks/...
Telegram Bot Token (optional): _________________________
```

### 5.2. Sentry (Error Tracking - Optional)

```bash
SENTRY_DSN=https://_______________@sentry.io/_______________

# Tạo tại:
# https://sentry.io → Create Project → Node.js
```

### 5.3. Analytics (Optional)

```bash
# Google Analytics
NEXT_PUBLIC_GA_ID=G-_______________

# Cloudflare Web Analytics (no config needed, free)
# Enable tại Cloudflare Dashboard → Web Analytics
```

---

## 🎯 6. Dokploy Admin Account

```yaml
# Sẽ tạo khi lần đầu truy cập Dokploy Dashboard
Admin Email: _________________________
Admin Password: _________________________
Admin Name: _________________________

⚠️ LƯU VÀO PASSWORD MANAGER!
```

---

## 📝 7. Deployment Checklist

### Pre-Deployment
- [ ] VPS created & accessible via SSH
- [ ] Domain purchased & DNS pointed to Cloudflare
- [ ] GitHub repository ready with correct branches
- [ ] All secrets generated and saved securely
- [ ] Cloudflare R2 bucket created
- [ ] Google AI API key obtained

### During Setup
- [ ] SSH into VPS successfully
- [ ] Setup script completed without errors
- [ ] Dokploy accessible at http://VPS-IP:3000
- [ ] DNS records configured in Cloudflare
- [ ] Dokploy admin account created
- [ ] GitHub connected to Dokploy
- [ ] PostgreSQL database created
- [ ] Redis instance created
- [ ] Secret group created in Dokploy
- [ ] SSL certificates generated for dokploy domain

### Application Deployment
- [ ] Production API deployed
- [ ] Database migrations ran successfully
- [ ] Production Frontend deployed
- [ ] Staging environment deployed
- [ ] Development environment deployed
- [ ] Uptime Kuma monitoring configured
- [ ] Notifications setup (email/Discord)

### Post-Deployment
- [ ] API health check returns 200 OK
- [ ] Frontend loads correctly
- [ ] User can register and login
- [ ] File upload to R2 works
- [ ] AI features working (if applicable)
- [ ] Email sending works (if configured)
- [ ] Monitoring alerts tested
- [ ] Backup schedule configured
- [ ] Team members have access
- [ ] Documentation updated with final URLs

---

## 🔗 8. Final URLs (After Deployment)

```yaml
Production:
  Frontend: https://v-edfinance.com
  API: https://api.v-edfinance.com
  API Health: https://api.v-edfinance.com/api/health
  
Staging:
  Frontend: https://staging.v-edfinance.com
  API: https://api-staging.v-edfinance.com
  
Development:
  Frontend: https://dev.v-edfinance.com
  API: https://api-dev.v-edfinance.com

Management:
  Dokploy: https://dokploy.v-edfinance.com
  Monitoring: https://monitoring.v-edfinance.com
  
SSH Access:
  Command: ssh root@___.___.___.___ 
```

---

## 💾 9. Backup Information

```yaml
Hetzner Automated Backups:
  Enabled: [ ] Yes / [ ] No
  Schedule: Daily @ 3 AM UTC
  Retention: 7 days
  Cost: €2.38/month (+20% of server cost)

Manual Backups to R2:
  Script: ~/backup-to-r2.sh (will be created)
  Schedule: Daily @ 4 AM UTC (cron)
  Retention: 30 days
  Cost: ~€0.50/month (estimate)
  
Database Dumps:
  PostgreSQL: Weekly full + Daily incremental
  Location: /backups/postgres/
  Retention: 30 days
```

---

## 📞 10. Emergency Contacts

```yaml
VPS Provider Support:
  Hetzner: https://console.hetzner.cloud/support
  Email: support@hetzner.com
  
Domain/DNS:
  Cloudflare Support: https://dash.cloudflare.com/support
  
Development Team:
  Lead Developer: _________________________
  DevOps: _________________________
  Emergency Phone: _________________________
```

---

## ⚠️ SECURITY NOTES

```yaml
🔒 This file contains SENSITIVE information!

Security Checklist:
✅ Add to .gitignore (prevent commit to GitHub)
✅ Store in password manager (1Password, Bitwarden, LastPass)
✅ Share securely (encrypted, not plain email)
✅ Rotate secrets quarterly
✅ Use different passwords for each service
✅ Enable 2FA where possible

.gitignore addition:
  VPS_INFO_TEMPLATE.md
  *.credentials
  *.secrets
  .env.local
  .env.production.local
```

---

## 📅 Maintenance Schedule

```yaml
Daily:
  - [ ] Check uptime monitor status
  - [ ] Review error logs (if any alerts)
  
Weekly:
  - [ ] Review resource usage (RAM, CPU, Disk)
  - [ ] Check backup success
  - [ ] Review application logs
  
Monthly:
  - [ ] Update Docker images
  - [ ] Review and optimize database
  - [ ] Check SSL certificate expiry
  - [ ] Security audit
  - [ ] Cost review
  
Quarterly:
  - [ ] Rotate secrets & passwords
  - [ ] Full system backup test
  - [ ] Disaster recovery drill
  - [ ] Review and update documentation
```

---

## ✅ Sign-off

```yaml
Setup Completed By: _________________________
Date: _______________
Verified By: _________________________
Production Launch Date: _______________

Notes:
________________________________________
________________________________________
________________________________________
```

---

**Next Steps:**
1. Fill out this template completely
2. Save securely in password manager
3. Share encrypted copy with team (if needed)
4. Follow VPS_SETUP_GUIDE.md for deployment
5. Update this document as you deploy

**DO NOT COMMIT THIS FILE TO GIT!** 🚫
