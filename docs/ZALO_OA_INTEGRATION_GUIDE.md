# Hướng Dẫn Tích Hợp Zalo OA với V-EdFinance

## 📋 Tổng Quan

Tài liệu này hướng dẫn setup đầy đủ để tích hợp Zalo Official Account (OA) vào hệ thống V-EdFinance, cho phép gửi tin nhắn tự động khi:
- Học viên đăng ký tài khoản mới
- Học viên đăng ký khóa học thành công

---

## 🎯 Kiến Trúc Tích Hợp

```
V-EdFinance Backend (NestJS)
    ↓ Webhook POST
n8n Workflows (Docker)
    ↓ HTTP Request
Zalo OA API
    ↓ Push Notification
Zalo App (User's Phone)
```

---

## 📝 Phần 1: Đăng Ký Zalo Official Account

### Bước 1: Tạo Zalo OA

1. Truy cập: https://oa.zalo.me/
2. Đăng nhập bằng tài khoản Zalo
3. Click **"Tạo Official Account"**
4. Chọn loại OA: **"Giáo dục"**
5. Điền thông tin:
   - Tên OA: `V-EdFinance`
   - Mô tả: `Nền tảng đào tạo tài chính trực tuyến`
   - Avatar: Logo V-EdFinance
   - Cover image: Banner website

### Bước 2: Xác Thực OA (Nếu Cần)

- **OA Personal** (Free): Không cần xác thực, giới hạn 1000 tin/ngày
- **OA Enterprise** (Trả phí): Cần xác thực giấy phép kinh doanh, không giới hạn tin nhắn

**Khuyến nghị**: Bắt đầu với OA Personal để test, sau đó nâng cấp lên Enterprise.

### Bước 3: Lấy App ID và Secret Key

1. Vào **Settings → Developer → App**
2. Click **"Create App"**
3. Điền thông tin app:
   - App Name: `V-EdFinance Automation`
   - Callback URL: `https://your-domain.com/zalo/callback` (tạm thời để localhost)
4. Copy **App ID** và **Secret Key** (lưu vào file `.env`)

### Bước 4: Cấu Hình Quyền (Permissions)

Vào **Settings → Permissions**, enable các quyền sau:
- ✅ `send_message_to_customer` - Gửi tin nhắn đến khách hàng
- ✅ `get_user_info` - Lấy thông tin user (optional)
- ✅ `manage_tag` - Quản lý tag khách hàng (optional)

---

## 🔑 Phần 2: Lấy Access Token

### Option A: Test Access Token (7 ngày, cho development)

1. Vào https://developers.zalo.me/tools/explorer
2. Chọn app `V-EdFinance Automation`
3. Chọn permissions: `send_message_to_customer`
4. Click **"Get Access Token"**
5. Copy **Access Token** (dạng: `abc123...xyz`)

**Lưu vào `.env`:**
```bash
ZALO_ACCESS_TOKEN=abc123...xyz
ZALO_APP_ID=your_app_id
ZALO_SECRET_KEY=your_secret_key
```

### Option B: Production Access Token (Refresh token tự động)

Để lấy access token tự động refresh trong production:

**1. Tạo OAuth Flow:**
```bash
# 1. User authorization URL
https://oauth.zalo.me/v4/permission?app_id={APP_ID}&redirect_uri={REDIRECT_URI}&state=random_string

# 2. Sau khi user approve, Zalo redirect về:
{REDIRECT_URI}?code=authorization_code&state=random_string

# 3. Exchange code for access token:
curl -X POST https://oauth.zalo.me/v4/access_token \
  -d "app_id={APP_ID}" \
  -d "app_secret={SECRET_KEY}" \
  -d "code={AUTHORIZATION_CODE}" \
  -d "grant_type=authorization_code"

# Response:
{
  "access_token": "your_access_token",
  "refresh_token": "your_refresh_token",
  "expires_in": 7776000  # 90 days
}
```

**2. Tạo Refresh Token Script:**

File: `scripts/zalo/refresh-token.ts`
```typescript
import axios from 'axios';
import * as fs from 'fs';

async function refreshZaloToken() {
  const response = await axios.post('https://oauth.zalo.me/v4/access_token', {
    app_id: process.env.ZALO_APP_ID,
    app_secret: process.env.ZALO_SECRET_KEY,
    refresh_token: process.env.ZALO_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });

  const { access_token, refresh_token, expires_in } = response.data;

  // Update .env file
  const envContent = fs.readFileSync('.env', 'utf-8');
  const updatedEnv = envContent
    .replace(/ZALO_ACCESS_TOKEN=.*/g, `ZALO_ACCESS_TOKEN=${access_token}`)
    .replace(/ZALO_REFRESH_TOKEN=.*/g, `ZALO_REFRESH_TOKEN=${refresh_token}`);

  fs.writeFileSync('.env', updatedEnv);
  console.log('✅ Zalo token refreshed successfully');
  console.log(`🕐 Expires in: ${expires_in / 86400} days`);
}

refreshZaloToken().catch(console.error);
```

**3. Setup Cron Job (Linux/Mac):**
```bash
# Refresh token mỗi 80 ngày (trước khi hết hạn 90 ngày)
crontab -e

# Add line:
0 0 */80 * * cd /path/to/v-edfinance && npx tsx scripts/zalo/refresh-token.ts
```

---

## 🐳 Phần 3: Setup n8n Workflows

### Bước 1: Start n8n Container

```bash
# File: docker-compose.n8n.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=vedfinance2025
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
    volumes:
      - n8n_data:/home/node/.n8n
      - ./scripts/n8n/workflows:/workflows

volumes:
  n8n_data:
```

**Start n8n:**
```bash
docker-compose -f docker-compose.n8n.yml up -d

# Truy cập: http://localhost:5678
# Login: admin / vedfinance2025
```

### Bước 2: Import Workflows vào n8n

**Option A: Import từ UI (Recommended):**
1. Mở http://localhost:5678
2. Click **"Workflows"** → **"Import from File"**
3. Chọn file:
   - `scripts/n8n/workflows/zalo-user-registered.json`
   - `scripts/n8n/workflows/zalo-course-enrolled.json`
4. Click **"Import"**

**Option B: Import qua CLI:**
```bash
docker exec -it n8n n8n import:workflow \
  --input=/workflows/zalo-user-registered.json

docker exec -it n8n n8n import:workflow \
  --input=/workflows/zalo-course-enrolled.json
```

### Bước 3: Cấu Hình Credentials trong n8n

1. Vào **Settings → Credentials**
2. Click **"New Credential"**
3. Search **"HTTP Header Auth"** (hoặc tạo custom credential)
4. Điền thông tin:
   - Name: `Zalo OA API`
   - Header Name: `access_token`
   - Header Value: `{ZALO_ACCESS_TOKEN từ .env}`
5. Click **"Save"**

**Hoặc tạo custom credential type:**

Vào n8n settings → Create custom credential:
```json
{
  "name": "zaloOaApi",
  "displayName": "Zalo OA API",
  "documentationUrl": "https://developers.zalo.me/docs/api",
  "properties": [
    {
      "displayName": "Access Token",
      "name": "accessToken",
      "type": "string",
      "typeOptions": {
        "password": true
      },
      "default": ""
    }
  ],
  "authenticate": {
    "type": "generic",
    "properties": {
      "headers": {
        "access_token": "={{$credentials.accessToken}}"
      }
    }
  }
}
```

### Bước 4: Cấu Hình Database Connection

1. Vào **Settings → Credentials** → **New Credential**
2. Chọn **"Postgres"**
3. Điền thông tin:
   - Host: `localhost` (hoặc Docker service name)
   - Database: `v_edfinance`
   - User: `postgres`
   - Password: (từ `.env`)
   - Port: `5432`
   - SSL: `disable` (nếu local)
4. Name: `V-EdFinance Database`
5. Click **"Save"**

### Bước 5: Test Workflows

**Test Workflow 1 - User Registration:**
```bash
# Send test webhook
curl -X POST http://localhost:5678/webhook/user-registered \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "phone": "0912345678",
    "name": "Nguyễn Văn A",
    "email": "test@example.com"
  }'
```

**Test Workflow 2 - Course Enrollment:**
```bash
curl -X POST http://localhost:5678/webhook/course-enrolled \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "phone": "0912345678",
    "name": "Nguyễn Văn A",
    "courseId": "course-456",
    "courseName": "Tài chính cá nhân cơ bản",
    "startDate": "2025-12-25T00:00:00Z"
  }'
```

**Kiểm tra kết quả:**
- ✅ Zalo app nhận được tin nhắn từ OA
- ✅ BehaviorLog có record mới với action `zalo_welcome_sent` hoặc `zalo_enrollment_sent`
- ✅ n8n execution log không có lỗi

### Bước 6: Activate Workflows

⚠️ **QUAN TRỌNG**: n8n MCP/API không thể activate workflows, phải làm thủ công:

1. Vào n8n UI: http://localhost:5678
2. Mở từng workflow
3. Click nút **"Active"** toggle (góc trên bên phải)
4. Xác nhận workflow status = **"Active"** (màu xanh)

---

## 🔗 Phần 4: Tích Hợp Backend (NestJS)

### Bước 1: Tạo Zalo Notification Service

File: `apps/api/src/modules/notifications/zalo-notification.service.ts`
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ZaloNotificationService {
  private readonly logger = new Logger(ZaloNotificationService.name);
  private readonly n8nWebhookUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.n8nWebhookUrl = this.configService.get<string>('N8N_WEBHOOK_URL');
  }

  async sendUserRegistrationNotification(data: {
    userId: string;
    phone: string;
    name: string;
    email: string;
  }): Promise<void> {
    try {
      const webhookUrl = `${this.n8nWebhookUrl}/webhook/user-registered`;
      
      await firstValueFrom(
        this.httpService.post(webhookUrl, data, {
          timeout: 10000,
        }),
      );

      this.logger.log(`Sent user registration notification to ${data.phone}`);
    } catch (error) {
      this.logger.error(
        `Failed to send registration notification: ${error.message}`,
        error.stack,
      );
      // Don't throw - notification failure shouldn't break registration
    }
  }

  async sendCourseEnrollmentNotification(data: {
    userId: string;
    phone: string;
    name: string;
    courseId: string;
    courseName: string;
    startDate: string;
  }): Promise<void> {
    try {
      const webhookUrl = `${this.n8nWebhookUrl}/webhook/course-enrolled`;
      
      await firstValueFrom(
        this.httpService.post(webhookUrl, data, {
          timeout: 10000,
        }),
      );

      this.logger.log(
        `Sent course enrollment notification to ${data.phone} for course ${data.courseId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send enrollment notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
```

### Bước 2: Update Notifications Module

File: `apps/api/src/modules/notifications/notifications.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ZaloNotificationService } from './zalo-notification.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [ZaloNotificationService],
  exports: [ZaloNotificationService],
})
export class NotificationsModule {}
```

### Bước 3: Tích Hợp vào Users Service

File: `apps/api/src/modules/users/users.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZaloNotificationService } from '../notifications/zalo-notification.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zaloNotification: ZaloNotificationService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        phone: registerDto.phone,
        password: hashedPassword, // assume hashed
      },
    });

    // 🔥 Send Zalo notification (async, non-blocking)
    this.zaloNotification
      .sendUserRegistrationNotification({
        userId: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
      })
      .catch((err) => {
        // Log but don't fail registration
        console.error('Zalo notification failed:', err);
      });

    return user;
  }
}
```

### Bước 4: Tích Hợp vào Enrollments Service

File: `apps/api/src/modules/enrollments/enrollments.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZaloNotificationService } from '../notifications/zalo-notification.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zaloNotification: ZaloNotificationService,
  ) {}

  async enrollUserInCourse(userId: string, courseId: string) {
    // Get user and course data
    const [user, course] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.course.findUnique({ where: { id: courseId } }),
    ]);

    // Create enrollment
    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'active',
      },
    });

    // 🔥 Send Zalo notification (async, non-blocking)
    this.zaloNotification
      .sendCourseEnrollmentNotification({
        userId: user.id,
        phone: user.phone,
        name: user.name,
        courseId: course.id,
        courseName: course.title,
        startDate: course.startDate?.toISOString() || new Date().toISOString(),
      })
      .catch((err) => {
        console.error('Zalo enrollment notification failed:', err);
      });

    return enrollment;
  }
}
```

### Bước 5: Update Environment Variables

File: `.env`
```bash
# Zalo OA Configuration
ZALO_APP_ID=your_app_id_here
ZALO_SECRET_KEY=your_secret_key_here
ZALO_ACCESS_TOKEN=your_access_token_here
ZALO_REFRESH_TOKEN=your_refresh_token_here

# n8n Webhook URL
N8N_WEBHOOK_URL=http://localhost:5678

# Slack webhook for error alerts (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Bước 6: Update Users Module Imports

File: `apps/api/src/modules/users/users.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule], // ← Add this
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## 🧪 Phần 5: Testing End-to-End

### Test Case 1: User Registration Flow

```bash
# 1. Register new user via API
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@gmail.com",
    "name": "Nguyễn Test User",
    "phone": "0987654321",
    "password": "SecurePass123!"
  }'

# Expected:
# ✅ User created in database
# ✅ n8n workflow triggered
# ✅ Zalo message sent to 0987654321
# ✅ BehaviorLog entry created with action='zalo_welcome_sent'
```

**Verify:**
```bash
# Check n8n execution log
docker logs n8n --tail 50

# Check database
psql -U postgres -d v_edfinance -c "SELECT * FROM \"BehaviorLog\" WHERE action='zalo_welcome_sent' ORDER BY \"createdAt\" DESC LIMIT 5;"

# Check Zalo app on phone
# → Should receive welcome message
```

### Test Case 2: Course Enrollment Flow

```bash
# 1. Enroll user in course
curl -X POST http://localhost:3001/api/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {USER_JWT_TOKEN}" \
  -d '{
    "courseId": "course-123"
  }'

# Expected:
# ✅ Enrollment created
# ✅ n8n workflow triggered
# ✅ Zalo message with course details sent
# ✅ BehaviorLog entry created
```

---

## 🔧 Phần 6: Troubleshooting

### Vấn Đề 1: Zalo API Trả Về Error Code

**Common Error Codes:**

| Code | Meaning | Solution |
|------|---------|----------|
| -216 | Invalid access token | Refresh token hoặc generate lại |
| -214 | Permission denied | Check app permissions trong Zalo Developer |
| -201 | User not found | User chưa follow OA, gửi QR code để follow |
| -124 | Message quota exceeded | Nâng cấp lên Enterprise OA |

**Debug Script:**
```bash
# Test Zalo API directly
curl -X POST https://openapi.zalo.me/v3.0/oa/message/cs \
  -H "Content-Type: application/json" \
  -H "access_token: YOUR_ACCESS_TOKEN" \
  -d '{
    "recipient": {
      "user_id": "84987654321"
    },
    "message": {
      "text": "Test message"
    }
  }'
```

### Vấn Đề 2: User Chưa Follow OA

**Solution: Implement Follow Flow**

1. Tạo QR Code cho OA:
```typescript
// Generate OA follow QR
const qrCodeUrl = `https://zalo.me/s/${ZALO_OA_ID}/?gidzl=...`;
```

2. Hiển thị QR code khi user đăng ký:
```tsx
// apps/web/src/components/organisms/RegistrationSuccess.tsx
<div className="zalo-follow">
  <p>Nhận thông báo qua Zalo:</p>
  <QRCode value={qrCodeUrl} />
  <p>Quét mã QR để follow V-EdFinance OA</p>
</div>
```

3. Lưu Zalo User ID sau khi follow:
```typescript
// Webhook nhận event khi user follow OA
@Post('/zalo/webhook/follow')
async handleZaloFollow(@Body() body) {
  const { user_id, timestamp, event } = body;
  
  if (event === 'follow') {
    // Update user với Zalo ID
    await this.prisma.user.update({
      where: { phone: user_id }, // Map phone với Zalo user_id
      data: { zaloUserId: user_id },
    });
  }
}
```

### Vấn Đề 3: n8n Workflow Không Chạy

**Debug Checklist:**
```bash
# 1. Check n8n container
docker ps | grep n8n

# 2. Check workflow status (phải là Active)
# → Vào UI xác nhận toggle "Active" = ON

# 3. Check webhook URL
docker logs n8n | grep webhook

# 4. Test webhook trực tiếp
curl -X POST http://localhost:5678/webhook/user-registered \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","phone":"0123456789","name":"Test","email":"test@test.com"}'

# 5. Check n8n execution log
# → Vào UI: Executions → xem lỗi ở node nào
```

### Vấn Đề 4: Phone Number Format Sai

Zalo yêu cầu format: `84xxxxxxxxx` (không có `+`, không có `0` đầu)

**Transform node đã handle:**
```javascript
// Trong workflow JSON
phoneFormatted: $json.body.phone.startsWith('0') 
  ? '84' + $json.body.phone.slice(1) 
  : $json.body.phone
```

**Hoặc validate ở backend:**
```typescript
function formatZaloPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Convert to international format
  if (cleaned.startsWith('0')) {
    return '84' + cleaned.slice(1);
  }
  if (cleaned.startsWith('84')) {
    return cleaned;
  }
  return '84' + cleaned;
}
```

---

## 📊 Phần 7: Monitoring & Analytics

### Setup Monitoring Dashboard

**1. Track Notification Success Rate:**
```sql
-- Query for daily success rate
SELECT 
  DATE(timestamp) as date,
  action,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN context->>'error' IS NULL THEN 1 END) as successful,
  ROUND(
    COUNT(CASE WHEN context->>'error' IS NULL THEN 1 END)::numeric / COUNT(*) * 100,
    2
  ) as success_rate
FROM "BehaviorLog"
WHERE action IN ('zalo_welcome_sent', 'zalo_enrollment_sent')
GROUP BY DATE(timestamp), action
ORDER BY date DESC;
```

**2. Setup Grafana Dashboard:**

File: `monitoring/grafana/dashboards/zalo-notifications.json`
```json
{
  "dashboard": {
    "title": "Zalo OA Notifications",
    "panels": [
      {
        "title": "Daily Notification Count",
        "targets": [
          {
            "rawSql": "SELECT timestamp, COUNT(*) FROM \"BehaviorLog\" WHERE action LIKE 'zalo_%' GROUP BY timestamp"
          }
        ]
      },
      {
        "title": "Success Rate (%)",
        "targets": [
          {
            "rawSql": "SELECT timestamp, (COUNT(CASE WHEN context->>'error' IS NULL THEN 1 END)::float / COUNT(*) * 100) FROM \"BehaviorLog\" WHERE action LIKE 'zalo_%' GROUP BY timestamp"
          }
        ]
      }
    ]
  }
}
```

### Setup Alerts

**Slack Alert khi Success Rate < 90%:**
```typescript
// apps/api/src/modules/monitoring/zalo-health-check.service.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ZaloHealthCheckService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  @Cron('0 */6 * * *') // Every 6 hours
  async checkZaloNotificationHealth() {
    const last6Hours = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const logs = await this.prisma.behaviorLog.findMany({
      where: {
        action: { in: ['zalo_welcome_sent', 'zalo_enrollment_sent'] },
        timestamp: { gte: last6Hours },
      },
    });

    const total = logs.length;
    const successful = logs.filter((log) => !log.context?.['error']).length;
    const successRate = (successful / total) * 100;

    if (successRate < 90) {
      // Alert to Slack
      await this.httpService.post(process.env.SLACK_WEBHOOK_URL, {
        text: `🚨 Zalo Notification Health Alert\n\nSuccess Rate: ${successRate.toFixed(2)}% (${successful}/${total})\nLast 6 hours\n\nPlease investigate!`,
      });
    }
  }
}
```

---

## 🚀 Phần 8: Production Deployment

### Checklist Trước Khi Deploy

- [ ] Đã test đầy đủ 2 workflows trên staging
- [ ] Zalo OA đã verified (nếu dùng Enterprise)
- [ ] Access token đã setup auto-refresh
- [ ] Environment variables đã setup trên production server
- [ ] n8n container đã chạy stable trên production
- [ ] Monitoring dashboard đã setup
- [ ] Error alerts đã setup (Slack/Email)
- [ ] Database có index cho BehaviorLog.action
- [ ] Đã test với volume lớn (100+ users/hour)

### Deploy to VPS (103.54.153.248)

**1. Copy workflows to VPS:**
```bash
scp -r scripts/n8n root@103.54.153.248:/opt/v-edfinance/

ssh root@103.54.153.248
cd /opt/v-edfinance
```

**2. Start n8n on VPS:**
```bash
# Add to docker-compose.yml
docker-compose up -d n8n

# Import workflows
docker exec -it n8n n8n import:workflow --input=/workflows/zalo-user-registered.json
docker exec -it n8n n8n import:workflow --input=/workflows/zalo-course-enrolled.json
```

**3. Configure reverse proxy (Nginx):**
```nginx
# /etc/nginx/sites-available/n8n.conf
server {
    listen 80;
    server_name n8n.v-edfinance.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**4. Update backend .env:**
```bash
N8N_WEBHOOK_URL=http://n8n:5678  # Internal Docker network
# hoặc
N8N_WEBHOOK_URL=http://103.54.153.248:5678  # Direct IP
```

---

## 📚 Tài Liệu Tham Khảo

- **Zalo OA API Docs**: https://developers.zalo.me/docs/api/official-account-api
- **n8n Documentation**: https://docs.n8n.io/
- **Zalo OA Console**: https://oa.zalo.me/
- **Zalo Developer Portal**: https://developers.zalo.me/

---

## 🎯 Summary Checklist

### Setup Hoàn Tất Khi:
- ✅ Zalo OA đã tạo và có App ID/Secret
- ✅ Access token đã lấy và lưu vào .env
- ✅ n8n container đang chạy
- ✅ 2 workflows đã import và activate
- ✅ Backend đã tích hợp ZaloNotificationService
- ✅ Test thành công cả 2 flows (registration + enrollment)
- ✅ Monitoring dashboard đã setup
- ✅ Error alerts đã cấu hình

### Performance Targets:
- 📊 Success Rate: ≥ 95%
- ⚡ Response Time: < 2s (webhook → Zalo API)
- 🔄 Daily Volume: 1000+ notifications (OA Personal), unlimited (Enterprise)

---

**Người tạo**: AI Agent @ V-EdFinance  
**Ngày tạo**: 2025-12-23  
**Version**: 1.0  
**Status**: ✅ Ready for Implementation
