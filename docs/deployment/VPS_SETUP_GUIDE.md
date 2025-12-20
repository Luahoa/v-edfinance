# 🚀 Hướng Dẫn Setup VPS - V-EdFinance
## Cài Đặt Tự Động Dokploy trên Ubuntu 22.04

> **Timeline:** 30-45 phút  
> **Skill Level:** Beginner-friendly  
> **Cost:** €11.90/tháng (VPS CPX31)

---

## 📋 Checklist: Thông Tin Cần Chuẩn Bị

Trước khi bắt đầu, hãy chuẩn bị các thông tin sau:

### ✅ Bước 1: Thông Tin VPS

```yaml
VPS Provider: Hetzner Cloud (hoặc tương tự)
Server Type:  CPX31 (8GB RAM, 4 vCPU)
OS:          Ubuntu 22.04 LTS
Location:    Helsinki (EU) hoặc Singapore (Asia)

Thông tin cần lưu:
  ├─ IP Address:     ___.___.___.___ (sẽ có sau khi tạo VPS)
  ├─ Root Password:  ________________ (hoặc SSH Key)
  └─ Hostname:       vedfinance-prod
```

### ✅ Bước 2: Thông Tin Domain

```yaml
Domain Name: v-edfinance.com (hoặc domain của bạn)

DNS Records (sẽ cấu hình sau):
  ├─ @                → <VPS-IP>  (v-edfinance.com)
  ├─ www              → <VPS-IP>  (www.v-edfinance.com)
  ├─ api              → <VPS-IP>  (api.v-edfinance.com)
  ├─ dokploy          → <VPS-IP>  (dokploy.v-edfinance.com)
  ├─ staging          → <VPS-IP>  (staging.v-edfinance.com)
  └─ api-staging      → <VPS-IP>  (api-staging.v-edfinance.com)
```

### ✅ Bước 3: Thông Tin GitHub

```yaml
GitHub Repository: https://github.com/<username>/v-edfinance
Branch Strategy:
  ├─ main     → Production
  ├─ staging  → Staging
  └─ develop  → Development

Personal Access Token: (tạo tại https://github.com/settings/tokens)
  Permissions cần thiết:
  ✅ repo (full control)
  ✅ read:org
  ✅ workflow
```

### ✅ Bước 4: Environment Variables

```bash
# Database (sẽ tạo trong Dokploy)
DATABASE_URL=postgresql://postgres:<password>@postgres-main:5432/vedfinance_prod

# JWT Secrets (tạo mới)
JWT_SECRET=<generate-random-32-chars>
JWT_REFRESH_SECRET=<generate-random-32-chars>

# Redis
REDIS_URL=redis://redis-main:6379

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=v-edfinance-uploads

# Google AI
GOOGLE_AI_API_KEY=your-google-ai-api-key

# App Settings
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://api.v-edfinance.com
```

**Tạo JWT Secrets:**
```bash
# Cách 1: OpenSSL (trên máy local)
openssl rand -base64 32

# Cách 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Cách 3: Online generator
# https://generate-random.org/api-key-generator
```

---

## 🎯 Phương Án Cài Đặt

### Option A: Tự Động 100% (Recommended) ⭐

**Ưu điểm:** Nhanh nhất, không cần kiến thức kỹ thuật  
**Thời gian:** 15-20 phút  
**Phù hợp:** Người mới bắt đầu

### Option B: Từng Bước Manual

**Ưu điểm:** Hiểu rõ từng bước, tùy chỉnh được  
**Thời gian:** 45-60 phút  
**Phù hợp:** Muốn học DevOps

---

## 🚀 Option A: Cài Đặt Tự Động

### Step 1: Tạo VPS trên Hetzner

1. **Đăng nhập Hetzner Cloud Console**
   - Truy cập: https://console.hetzner.cloud
   - Đăng nhập hoặc tạo tài khoản mới

2. **Tạo Project mới**
   ```
   Project Name: v-edfinance-production
   ```

3. **Tạo Server**
   ```
   Click: "+ ADD SERVER"
   
   Location: 
   ✅ Helsinki, Finland (EU) - Tốt cho EU/VN
   ⚪ Ashburn, VA (US) - Tốt cho US
   
   Image:
   ✅ Ubuntu 22.04
   
   Type:
   ✅ Shared vCPU
   ✅ CPX31 - €11.90/month
      • 4 vCPU
      • 8 GB RAM
      • 160 GB SSD
      • 20 TB traffic
   
   Networking:
   ✅ Public IPv4
   ⚪ Private Network (không cần lúc này)
   
   SSH Keys:
   ✅ Add your SSH key (recommended)
      OR
   ⚪ Root password (sẽ gửi qua email)
   
   Volumes: (không cần)
   
   Firewalls: (cấu hình sau)
   
   Backups:
   ⚪ Enable backups (+20% = €2.38/mo) - Optional
   
   Placement Groups: (không cần)
   
   Labels: (optional)
   ✅ env: production
   ✅ app: v-edfinance
   
   Cloud Config: (để trống)
   
   Server Name: vedfinance-prod
   
   Click: "CREATE & BUY NOW"
   ```

4. **Lưu thông tin Server**
   ```
   IP Address: xxx.xxx.xxx.xxx (hiển thị sau khi tạo)
   Root Password: (nếu không dùng SSH key, check email)
   ```

### Step 2: SSH vào VPS

```bash
# Từ máy local (Windows PowerShell hoặc WSL)

# Nếu dùng SSH Key:
ssh root@xxx.xxx.xxx.xxx

# Nếu dùng Password:
ssh root@xxx.xxx.xxx.xxx
# Nhập password khi được hỏi
```

**Lần đầu tiên sẽ hỏi:**
```
The authenticity of host 'xxx.xxx.xxx.xxx' can't be established.
Are you sure you want to continue connecting (yes/no)?
```
→ Gõ `yes` và Enter

### Step 3: Chạy Script Tự Động

**Cách 1: Chạy trực tiếp từ web (dễ nhất)**
```bash
curl -sSL https://raw.githubusercontent.com/<your-repo>/v-edfinance/main/docs/deployment/scripts/setup-vps.sh | bash
```

**Cách 2: Download về rồi chạy (an toàn hơn)**
```bash
# Download script
wget https://raw.githubusercontent.com/<your-repo>/v-edfinance/main/docs/deployment/scripts/setup-vps.sh

# Kiểm tra nội dung (xem script làm gì)
cat setup-vps.sh

# Cho phép thực thi
chmod +x setup-vps.sh

# Chạy script
./setup-vps.sh
```

**Cách 3: Copy-paste thủ công**
```bash
# 1. Tạo file
nano setup-vps.sh

# 2. Copy toàn bộ nội dung từ file scripts/setup-vps.sh
# Paste vào nano (Right-click hoặc Ctrl+Shift+V)

# 3. Lưu file
# Ctrl+X → Y → Enter

# 4. Chạy
chmod +x setup-vps.sh
./setup-vps.sh
```

### Step 4: Đợi Script Hoàn Thành

Script sẽ tự động:
- ✅ Update hệ thống
- ✅ Cài đặt các công cụ cần thiết
- ✅ Cấu hình firewall (UFW)
- ✅ Cài đặt Fail2Ban (bảo mật)
- ✅ Bật automatic security updates
- ✅ Tối ưu hóa hệ thống
- ✅ Cài đặt Docker
- ✅ Cài đặt Dokploy
- ✅ Tạo swap file (2GB)
- ✅ Set timezone Vietnam

**Timeline:**
```
[1/10] System info          (5s)
[2/10] Update packages       (2-3 mins)
[3/10] Install tools         (1 min)
[4/10] Configure firewall    (10s)
[5/10] Configure Fail2Ban    (10s)
[6/10] Auto-updates          (5s)
[7/10] System optimization   (5s)
[8/10] Install Docker        (1-2 mins)
[9/10] Install Dokploy       (3-5 mins) ⏳
[10/10] Final config         (30s)

Total: ~10-15 phút
```

### Step 5: Truy Cập Dokploy Dashboard

Sau khi script hoàn thành, bạn sẽ thấy:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ V-EdFinance VPS Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Access Information:
   • Server IP: xxx.xxx.xxx.xxx
   • Dokploy Dashboard: http://xxx.xxx.xxx.xxx:3000
   • SSH: ssh root@xxx.xxx.xxx.xxx

⚡ Next Steps:
   1. Access Dokploy dashboard: http://xxx.xxx.xxx.xxx:3000
   2. Create admin account
   3. Configure DNS for your domain
   4. Deploy V-EdFinance application
```

**Truy cập Dokploy:**
1. Mở trình duyệt
2. Truy cập: `http://xxx.xxx.xxx.xxx:3000`
3. Đợi 2-3 phút nếu trang chưa load (Dokploy đang khởi động)
4. Tạo tài khoản admin:
   ```
   Email:    admin@v-edfinance.com
   Password: <create-strong-password>
   
   ⚠️ Lưu password vào password manager!
   ```

---

## 🌐 Step 6: Cấu Hình DNS (Cloudflare)

### Thêm DNS Records

Đăng nhập Cloudflare → Chọn domain → DNS → Records

```
Thêm các records sau (click "Add record"):

Type: A
Name: @
IPv4: xxx.xxx.xxx.xxx (VPS IP)
Proxy: ✅ Proxied (mây cam)
TTL: Auto

Type: A
Name: www
IPv4: xxx.xxx.xxx.xxx
Proxy: ✅ Proxied

Type: A
Name: api
IPv4: xxx.xxx.xxx.xxx
Proxy: ✅ Proxied

Type: A
Name: dokploy
IPv4: xxx.xxx.xxx.xxx
Proxy: ✅ Proxied

Type: A
Name: staging
IPv4: xxx.xxx.xxx.xxx
Proxy: ✅ Proxied

Type: A
Name: api-staging
IPv4: xxx.xxx.xxx.xxx
Proxy: ✅ Proxied

Type: A
Name: dev
IPv4: xxx.xxx.xxx.xxx
Proxy: ✅ Proxied

Type: A
Name: api-dev
IPv4: xxx.xxx.xxx.xxx
Proxy: ✅ Proxied
```

**Đợi 5-10 phút** để DNS propagate.

**Kiểm tra DNS:**
```bash
# Trên máy local
nslookup dokploy.v-edfinance.com
# Nên trả về IP của VPS
```

---

## 🔧 Step 7: Cấu Hình Dokploy

### 7.1: Truy cập qua Domain

Sau khi DNS propagate:
```
http://dokploy.v-edfinance.com:3000
```

### 7.2: Thêm Custom Domain cho Dokploy

Trong Dokploy Dashboard:
```
Settings → General → Server Domain
Domain: dokploy.v-edfinance.com
Port: 3000
Click "Save"

Settings → SSL
Enable Let's Encrypt
Email: admin@v-edfinance.com
Click "Generate Certificate"

Đợi 2-3 phút...
```

Giờ bạn có thể truy cập qua HTTPS:
```
https://dokploy.v-edfinance.com ✅
```

### 7.3: Connect GitHub

```
Settings → Integrations → GitHub
Click "Connect GitHub"
→ Authorize Dokploy app
→ Grant access to repository
```

### 7.4: Tạo PostgreSQL Database

```
Databases → Add Database → PostgreSQL

Name: postgres-main
Version: 15-alpine
Memory Limit: 1536 MB (1.5GB)
CPU Shares: 512

Environment Variables:
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<generate-strong-password>

Advanced:
Port: 5432 (Internal only - không expose ra ngoài)
Volume: /var/lib/postgresql/data → 20GB

Click "Create"
```

**Đợi 1-2 phút để PostgreSQL khởi động.**

**Tạo 3 databases:**
```
Databases → postgres-main → Console

Chạy các lệnh SQL sau:

CREATE DATABASE vedfinance_prod;
CREATE DATABASE vedfinance_staging;
CREATE DATABASE vedfinance_dev;

\l -- List databases để verify
```

**Lưu Connection String:**
```
DATABASE_URL_PROD=postgresql://postgres:<password>@postgres-main:5432/vedfinance_prod
DATABASE_URL_STAGING=postgresql://postgres:<password>@postgres-main:5432/vedfinance_staging
DATABASE_URL_DEV=postgresql://postgres:<password>@postgres-main:5432/vedfinance_dev
```

### 7.5: Tạo Redis

```
Databases → Add Database → Redis

Name: redis-main
Version: 7-alpine
Memory Limit: 256 MB

Advanced:
Port: 6379 (Internal)
Enable Persistence: Yes
Eviction Policy: allkeys-lru

Click "Create"
```

**Connection String:**
```
REDIS_URL=redis://redis-main:6379
```

### 7.6: Tạo Secret Groups

```
Secrets → Create Group

Group Name: v-edfinance-prod

Add Secrets: (Click "Add Secret" cho từng cái)

Key: DATABASE_URL
Value: postgresql://postgres:<password>@postgres-main:5432/vedfinance_prod

Key: REDIS_URL
Value: redis://redis-main:6379

Key: JWT_SECRET
Value: <your-generated-secret>

Key: JWT_REFRESH_SECRET
Value: <your-generated-refresh-secret>

Key: R2_ACCOUNT_ID
Value: <your-cloudflare-account-id>

Key: R2_ACCESS_KEY_ID
Value: <your-r2-access-key>

Key: R2_SECRET_ACCESS_KEY
Value: <your-r2-secret-key>

Key: R2_BUCKET_NAME
Value: v-edfinance-uploads

Key: GOOGLE_AI_API_KEY
Value: <your-google-ai-key>

Click "Save Group"
```

---

## 🚢 Step 8: Deploy V-EdFinance Application

### 8.1: Deploy Production API

```
Applications → Create Application

Basic Info:
Name: api-production
Type: GitHub

Source:
Repository: <your-github>/v-edfinance
Branch: main
Auto Deploy: ✅ Yes (deploy on push)

Build:
Build Type: Dockerfile
Dockerfile Path: apps/api/Dockerfile
Context: . (root directory)
Build Args: (empty)

Resources:
Memory Limit: 1536 MB (1.5GB)
CPU Shares: 1024
Restart Policy: unless-stopped

Environment Variables:
(Chọn Secret Group: v-edfinance-prod)

Thêm thủ công:
NODE_ENV=production
PORT=3000

Domains:
Domain: api.v-edfinance.com
SSL: ✅ Let's Encrypt (auto)
Certificate Email: admin@v-edfinance.com

Health Check:
Path: /api/health
Port: 3000
Interval: 30s
Timeout: 10s
Retries: 3

Click "Create & Deploy"
```

**Monitor Logs:**
```
Applications → api-production → Logs (real-time)

Đợi 5-10 phút cho build + deploy lần đầu
```

### 8.2: Run Database Migrations

Sau khi API deploy xong:

```
Applications → api-production → Terminal

Chạy:
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

npx prisma db seed
```

### 8.3: Deploy Production Frontend

```
Applications → Create Application

Name: web-production
Repository: <your-github>/v-edfinance
Branch: main

Build:
Dockerfile: apps/web/Dockerfile
Context: .

Resources:
Memory: 1536 MB
CPU: 1024

Environment:
(Secret Group: v-edfinance-prod)

NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.v-edfinance.com
NEXT_PUBLIC_CDN_URL=https://cdn.v-edfinance.com

Domains:
Domain 1: v-edfinance.com (SSL: auto)
Domain 2: www.v-edfinance.com (SSL: auto)

Health Check:
Path: /
Port: 3000

Click "Create & Deploy"
```

---

## ✅ Step 9: Verification

### Test API

```bash
# Health check
curl https://api.v-edfinance.com/api/health

# Expected:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

### Test Frontend

Mở trình duyệt:
```
https://v-edfinance.com
```

Should see the landing page! 🎉

---

## 📊 Step 10: Setup Monitoring

### Install Uptime Kuma

```
Applications → Create Application

Name: uptime-kuma
Type: Docker Image
Image: louislam/uptime-kuma:1

Port Mapping:
Container Port: 3001
Host Port: 3001

Memory: 256 MB

Domain: monitoring.v-edfinance.com
SSL: ✅ Auto

Volume:
/app/data → 5GB

Click "Create"
```

### Configure Monitors

1. Truy cập: `https://monitoring.v-edfinance.com`
2. Tạo admin account
3. Add Monitors:

```
Monitor 1:
Name: Production API Health
Type: HTTP(s)
URL: https://api.v-edfinance.com/api/health
Interval: 60 seconds
Expected Status Code: 200

Monitor 2:
Name: Production Web
Type: HTTP(s)
URL: https://v-edfinance.com
Interval: 60 seconds

Monitor 3:
Name: Database Health
Type: HTTP(s)
URL: https://api.v-edfinance.com/api/health/db
Interval: 120 seconds
```

### Setup Notifications

```
Settings → Notifications

Add Notification:
Type: Email hoặc Discord Webhook
Name: Admin Alerts
Email: your-email@gmail.com

Default Enabled: ✅ Yes
Apply to existing monitors: ✅ Yes
```

---

## 🎉 Hoàn Thành!

Bạn đã có:

- ✅ VPS Ubuntu 22.04 với Dokploy
- ✅ PostgreSQL + Redis
- ✅ Production API deployed
- ✅ Production Frontend deployed
- ✅ SSL certificates (HTTPS)
- ✅ Monitoring với Uptime Kuma
- ✅ Auto-deployment từ GitHub
- ✅ Security hardening (Firewall, Fail2Ban)
- ✅ Automatic security updates

---

## 📝 Thông Tin Đã Lưu

Hãy lưu các thông tin sau vào **biến môi trường an toàn** (password manager):

```yaml
Server Info:
  IP: xxx.xxx.xxx.xxx
  SSH: ssh root@xxx.xxx.xxx.xxx
  
Dokploy:
  URL: https://dokploy.v-edfinance.com
  Email: admin@v-edfinance.com
  Password: <your-admin-password>

Database:
  Host: postgres-main (internal)
  User: postgres
  Password: <your-db-password>
  Databases:
    - vedfinance_prod
    - vedfinance_staging
    - vedfinance_dev

Redis:
  URL: redis://redis-main:6379

Monitoring:
  URL: https://monitoring.v-edfinance.com
  Admin: <your-credentials>
```

---

## 🆘 Troubleshooting

### Problem: Dokploy không khởi động

```bash
# Check logs
docker logs -f dokploy

# Restart Dokploy
docker restart dokploy
```

### Problem: SSL certificate không tạo được

```bash
# Kiểm tra DNS đã propagate chưa
nslookup api.v-edfinance.com

# Kiểm tra port 80, 443 mở
sudo ufw status

# Retry certificate trong Dokploy UI
Settings → SSL → Regenerate
```

### Problem: Application không build

```bash
# Check logs trong Dokploy
Applications → <app-name> → Logs → Build Logs

# Common issues:
# - Dockerfile path sai
# - Build context sai
# - Environment variables thiếu
```

### Problem: Database connection failed

```bash
# Verify PostgreSQL running
docker ps | grep postgres

# Test connection
docker exec -it <postgres-container> psql -U postgres

# Check connection string
echo $DATABASE_URL
```

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, cung cấp:

1. Server IP: xxx.xxx.xxx.xxx
2. Screenshot lỗi
3. Logs từ Dokploy
4. Bước đang thực hiện

Tôi sẽ hỗ trợ debug! 🚀
