# 🔑 API Keys Configuration Guide

**Date:** 2025-12-22  
**Purpose:** Quản lý API keys cho V-EdFinance production

---

## ⚠️ CRITICAL: Không Commit Keys Lên GitHub!

**Keys chứa thông tin nhạy cảm và PHẢI được lưu trong:**
- ✅ Local: `.env` file (đã có trong `.gitignore`)
- ✅ GitHub: Repository Secrets (Settings → Secrets and variables → Actions)
- ✅ VPS: Environment variables trong Dokploy

**KHÔNG BAO GIỜ:**
- ❌ Commit file `.env` lên GitHub
- ❌ Hard-code keys vào source code
- ❌ Share keys qua chat/email

---

## 📋 Required API Keys

### 1. **GEMINI_API_KEY** - Google AI Studio

**Mục đích:**
- Cung cấp AI-powered financial advice (lời khuyên đầu tư thông minh)
- Chatbot tự động trả lời câu hỏi tài chính
- Tạo nội dung khóa học cá nhân hóa dựa trên behavioral data
- Mentor AI với 3 persona: Wise Sage, Strict Coach, Supportive Buddy

**Nơi sử dụng:**
- [ai.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/ai/ai.service.ts#L33-L43) - Gemini 2.0 Flash model
- [gemini.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/config/gemini.service.ts) - Fallback Gemini 1.5 Flash

**Cách lấy:**
1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập Google Account
3. Click "Create API Key"
4. Copy key (format: `AIzaSy...`)

**Lưu ý:**
- ⚠️ Key này có giới hạn free tier: 500,000 tokens/month
- Rate limit: 20 requests/minute (đã config trong code)
- Có thể upgrade lên paid plan nếu vượt quota

---

### 2. **JWT_SECRET** - Authentication Token

**Mục đích:**
- Mã hóa JWT tokens cho user authentication
- Bảo mật session và authorization

**Đã generate:**
```
zDqXvHcZtsck+aLGOlwUiEgmvvzPutrq+UuOuE0+Yno=
```

**Lưu ý:**
- PHẢI giống nhau giữa tất cả environments (dev, staging, production)
- Thay đổi JWT_SECRET sẽ invalidate tất cả sessions hiện tại
- Minimum 32 characters, random base64 string

---

## 🛠️ Configuration Locations

### Local Development (.env)
```bash
# File: apps/api/.env
GEMINI_API_KEY=AIzaSy...  # Từ Google AI Studio
JWT_SECRET=zDqXvHcZtsck+aLGOlwUiEgmvvzPutrq+UuOuE0+Yno=
DATABASE_URL=postgresql://user:password@localhost:5432/v_edfinance
```

### GitHub Actions (CI/CD)
Đã config tại: https://github.com/Luahoa/v-edfinance/settings/secrets/actions

| Secret Name | Value | Status |
|-------------|-------|--------|
| `GEMINI_API_KEY` | `[REDACTED:api-key]` | ✅ Configured |
| `JWT_SECRET` | `zDqXvHcZtsck+aLGOlwUiEgmvvzPutrq+UuOuE0+Yno=` | ✅ Configured |

### VPS Production (Dokploy)
SSH vào VPS và set environment variables:
```bash
ssh root@103.54.153.248
dokploy env set GEMINI_API_KEY=AIzaSy...
dokploy env set JWT_SECRET=zDqXvHcZtsck+aLGOlwUiEgmvvzPutrq+UuOuE0+Yno=
```

---

## 🔍 Verification

### Check Local
```bash
# In apps/api directory
cat .env | grep GEMINI_API_KEY
cat .env | grep JWT_SECRET
```

### Check GitHub Secrets
1. Go to: https://github.com/Luahoa/v-edfinance/settings/secrets/actions
2. Verify both secrets exist (won't show values)

### Test API Integration
```bash
# Run backend tests that use AI
pnpm --filter api test src/ai/ai.service.spec.ts
```

---

## 📊 Usage Monitoring

### Google AI Studio Dashboard
- Monitor usage: https://makersuite.google.com/app/apikey
- Check quota: Free tier 500K tokens/month
- View rate limits: 20 requests/minute

### Application Metrics
- Token usage tracked in code ([ai.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/ai/ai.service.ts#L49-L95))
- Rate limiting: 20 calls/window per user
- Monthly budget: 50,000 tokens per user

---

## 🚨 Security Best Practices

1. **Rotate Keys Regularly**
   - GEMINI_API_KEY: Every 90 days
   - JWT_SECRET: Only when compromised

2. **Access Control**
   - Limit who can access GitHub repo settings
   - Use separate keys for dev/staging/production

3. **Monitoring**
   - Enable alerts for API quota exceeded
   - Log unusual authentication patterns

4. **Backup**
   - Keep encrypted backup of production keys
   - Document key rotation procedures

---

## 📝 Current Status

| Key | Environment | Status | Last Updated |
|-----|-------------|--------|--------------|
| GEMINI_API_KEY | Local | ✅ Set | 2025-12-22 |
| GEMINI_API_KEY | GitHub Actions | ✅ Set | 2025-12-22 |
| GEMINI_API_KEY | VPS Production | ⏳ Pending | - |
| JWT_SECRET | All Environments | ✅ Set | 2025-12-22 |

---

## 🔗 References

- Google AI Studio: https://makersuite.google.com
- JWT Best Practices: https://jwt.io/introduction
- Dokploy Env Vars: https://docs.dokploy.com/docs/core/env-variables
