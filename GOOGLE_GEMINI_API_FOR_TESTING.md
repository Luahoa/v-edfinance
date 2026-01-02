# 🔄 Google Gemini API cho AI Testing Army

**Date:** 2025-12-23  
**Good News:** ✅ 3/4 tools hỗ trợ Google Gemini API!

---

## 🎯 Tổng Quan Support

| Tool | OpenAI | Google Gemini | Cost Savings |
|------|--------|---------------|--------------|
| **TestPilot** | ✅ Yes | ⚠️ Via OpenAI-compatible endpoint | Moderate |
| **QA-use** | ❌ No (BrowserUse only) | ❌ No | N/A (BrowserUse required) |
| **e2e-test-agent** | ✅ Yes | ✅ Yes (OpenAI-compatible) | **70% cheaper** |
| **Arbigent** | ✅ Yes | ✅ Yes (Native support) | **90% cheaper** |

**Tóm tắt:** 2/4 tools native support Gemini, 1 tool có thể dùng qua proxy!

---

## 💰 So Sánh Chi Phí

### OpenAI API Pricing
- **GPT-4o:** $2.50/1M input tokens, $10/1M output tokens
- **GPT-4o-mini:** $0.15/1M input, $0.60/1M output
- **Est. Monthly (1000 tests):** ~$30-50

### Google Gemini API Pricing
- **Gemini 2.0 Flash:** **FREE** (60 req/min, 1500/day)
- **Gemini 1.5 Flash:** $0.075/1M input, $0.30/1M output
- **Gemini 1.5 Pro:** $1.25/1M input, $5/1M output
- **Est. Monthly (1000 tests):** ~$3-10 (**70-90% cheaper!**)

**🔥 Best Deal:** Gemini 2.0 Flash (FREE tier) cho testing!

---

## ✅ Tool-by-Tool Setup

### 1. **Arbigent** - ✅ Native Gemini Support

**Documentation Excerpt:**
```
Supported AI Providers:
- OpenAI: Yes
- Gemini: Yes  ✅
- OpenAI based APIs like Ollama: Yes
```

**Setup:**
```bash
# Get Gemini API key (FREE tier available)
# Visit: https://aistudio.google.com/app/apikey

# Run with Gemini
arbigent run \
  --project-file tests/arbigent-project.yml \
  --ai-type gemini \
  --gemini-api-key YOUR_GEMINI_API_KEY \
  --gemini-model-name gemini-2.0-flash-exp \
  --os web

# Or configure in .arbigent/settings.yml
ai-type: gemini
gemini-api-key: YOUR_KEY
gemini-model-name: gemini-2.0-flash-exp
gemini-endpoint: https://generativelanguage.googleapis.com/v1beta/openai/
```

**Recommended Models:**
- `gemini-2.0-flash-exp` - FREE, latest, fastest ⭐
- `gemini-1.5-flash` - Cheap, good quality
- `gemini-1.5-pro` - Best quality, more expensive

**Cost:** **$0/month** (FREE tier: 1500 requests/day)

---

### 2. **e2e-test-agent** - ✅ OpenAI-Compatible APIs

**Documentation Excerpt:**
```
💡 API Compatibility: This package works with OpenAI and any OpenAI-compatible APIs:
- OpenAI (GPT-4o, GPT-4, etc.)
- Anthropic Claude (via OpenAI-compatible endpoints)
- OpenRouter (access to multiple models)
- Local LLMs (Ollama, LM Studio, etc.)

Simply configure your BASE_URL and API_KEY accordingly.
```

**Setup via OpenRouter (Gemini proxy):**
```bash
# .env.testing
MODEL_NAME="google/gemini-2.0-flash-exp:free"
API_KEY="your_openrouter_key"  # Get from https://openrouter.ai/keys
BASE_URL="https://openrouter.ai/api/v1"
TESTS_DIR="./tests/e2e"

# Or direct Gemini API (via LiteLLM proxy)
# Install: pip install litellm
# Run proxy: litellm --model gemini/gemini-2.0-flash-exp
MODEL_NAME="gemini-2.0-flash-exp"
API_KEY="your_gemini_api_key"
BASE_URL="http://localhost:8000/v1"  # LiteLLM proxy
```

**Cost:** **$0/month** (via OpenRouter free tier or direct Gemini free tier)

---

### 3. **TestPilot** - ⚠️ OpenAI-Compatible Endpoint

**Original Design:**
```bash
# Designed for OpenAI Codex
TESTPILOT_LLM_API_ENDPOINT='https://api.openai.com/v1/engines/gpt-4/completions'
TESTPILOT_LLM_AUTH_HEADERS='{"Authorization": "Bearer YOUR_KEY"}'
```

**Gemini Workaround (via LiteLLM proxy):**
```bash
# Step 1: Install LiteLLM proxy
pip install litellm

# Step 2: Run proxy for Gemini
litellm --model gemini/gemini-2.0-flash-exp --port 8000

# Step 3: Configure TestPilot
TESTPILOT_LLM_API_ENDPOINT='http://localhost:8000/v1/completions'
TESTPILOT_LLM_AUTH_HEADERS='{"Authorization": "Bearer YOUR_GEMINI_KEY"}'
```

**Cost:** **$0/month** (Gemini free tier)

**⚠️ Note:** TestPilot is archived, recommend using TestPilot2 or skipping this tool.

---

### 4. **QA-use** - ❌ BrowserUse API Only

**Cannot Replace:**
- QA-use uses **BrowserUse API** (proprietary service)
- BrowserUse API costs: ~$20-50/month
- No Gemini alternative available

**Workaround:**
- Use **e2e-test-agent** instead (same natural language tests, uses Gemini)
- Or use **Playwright** directly with Gemini for browser automation

---

## 🎯 Recommended Stack (100% Google Gemini)

### **Option A: Pure Google Stack (FREE)**

**Tools:**
1. ✅ **Arbigent** (Gemini 2.0 Flash) - Scenarios & E2E
2. ✅ **e2e-test-agent** (Gemini via OpenRouter) - Natural language tests
3. ❌ Skip TestPilot (archived)
4. ❌ Skip QA-use (paid BrowserUse API)

**Total Cost:** **$0/month** (within free tier limits)

**Limits:**
- Gemini API: 1500 requests/day (FREE tier)
- OpenRouter Gemini: Unlimited (FREE tier)

**Perfect for:** V-EdFinance testing (est. 500 requests/day)

---

### **Option B: Hybrid Stack (Best Value)**

**Tools:**
1. ✅ **Arbigent** (Gemini 2.0 Flash) - $0/month
2. ✅ **e2e-test-agent** (Gemini) - $0/month
3. ✅ **QA-use** (BrowserUse API) - $20-50/month (platform value)
4. ❌ Skip TestPilot

**Total Cost:** **$20-50/month** (only BrowserUse API)

**Savings vs OpenAI:** **$30-40/month** (70-80% reduction)

---

## 📋 Updated Beads Tasks

```bash
# Update API key task
beads.exe update ved-10p --title "Get Google Gemini API key (FREE tier)"
beads.exe update ved-10p --description "Get FREE Gemini API key from https://aistudio.google.com/app/apikey (1500 req/day FREE)"

# Update .env.testing task
beads.exe update ved-g8a --description "Create .env.testing with GEMINI_API_KEY, MODEL_NAME=gemini-2.0-flash-exp"

# Add new task for OpenRouter (optional)
beads.exe create "Get OpenRouter API key for Gemini proxy" \
  --type task \
  --priority 2 \
  --description "Alternative: Get OpenRouter key from https://openrouter.ai/keys for unlimited free Gemini access"
```

---

## 🚀 Quick Start with Gemini

### Step 1: Get FREE Gemini API Key
```bash
# Visit: https://aistudio.google.com/app/apikey
# Click "Create API Key"
# Copy key: AIza...
```

### Step 2: Create .env.testing
```bash
# .env.testing (Gemini version)
cat > .env.testing << EOF
# Google Gemini API (FREE tier)
GEMINI_API_KEY=AIza...your_key_here
MODEL_NAME=gemini-2.0-flash-exp

# BrowserUse (still needed for QA-use)
BROWSER_USE_API_KEY=your_browseruse_key

# Optional: OpenRouter for e2e-test-agent
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
EOF
```

### Step 3: Test Arbigent with Gemini
```bash
cd temp_skills/arbigent

# Run with Gemini
./arbigent-cli/build/install/arbigent/bin/arbigent run \
  --project-file sample-test/src/main/resources/projects/e2e-test-android.yaml \
  --ai-type gemini \
  --gemini-api-key AIza...your_key \
  --gemini-model-name gemini-2.0-flash-exp \
  --os web

# Expected output:
# ✅ Running with Gemini 2.0 Flash (FREE)
# ✅ Scenario completed successfully
```

### Step 4: Test e2e-test-agent with Gemini
```bash
# Install LiteLLM proxy
pip install litellm

# Run proxy
litellm --model gemini/gemini-2.0-flash-exp --port 8000 &

# Update .env
echo 'BASE_URL="http://localhost:8000/v1"' >> .env.testing

# Run tests
npx tsx run-e2e-tests.ts

# Expected output:
# ✅ Using Gemini 2.0 Flash via LiteLLM
# ✅ Test passed
```

---

## 📊 Cost Comparison (1000 tests/month)

| Stack | OpenAI Cost | Gemini Cost | Savings |
|-------|-------------|-------------|---------|
| **Pure OpenAI** | $80-120/month | - | - |
| **Pure Gemini (Option A)** | - | **$0/month** | **100% ($120)** ⭐ |
| **Hybrid (Option B)** | - | **$20-50/month** | **60-75% ($60-90)** |

**Recommendation:** 🎯 Start with **Option A (Pure Gemini)** for FREE testing!

---

## ⚠️ Limitations & Considerations

### Gemini API Free Tier Limits:
- **1500 requests/day** (enough for ~50 tests/day)
- **60 requests/minute** (enough for parallel testing)

### If You Hit Limits:
1. Upgrade to **Gemini API Paid tier** ($0.075/1M tokens - still 90% cheaper)
2. Use **OpenRouter** (unlimited free Gemini access)
3. Distribute tests across multiple API keys

### Quality Comparison:
- **GPT-4o:** Best quality, slowest, most expensive
- **Gemini 2.0 Flash:** Good quality, **fastest**, **FREE** ⭐
- **Gemini 1.5 Pro:** Best Gemini quality, cheap

**For Testing:** Gemini 2.0 Flash is **more than sufficient**!

---

## 🎯 Updated Deployment Plan

**Phase 0 (Updated):**
1. ✅ Get **Gemini API key** (FREE) - https://aistudio.google.com/app/apikey
2. ✅ Get **BrowserUse API key** (if using QA-use) - $20-50/month
3. ✅ Create `.env.testing` with Gemini credentials
4. ✅ Install tools with Gemini config

**Monthly Cost:**
- **Option A (Pure Gemini):** $0/month 🎉
- **Option B (Hybrid):** $20-50/month (only BrowserUse)

---

## 🔥 Conclusion

**TL;DR:** 
- ✅ **Arbigent:** Native Gemini support (FREE)
- ✅ **e2e-test-agent:** Gemini via proxy (FREE)
- ⚠️ **TestPilot:** Gemini via proxy (archived, skip)
- ❌ **QA-use:** BrowserUse only ($20-50/month)

**Best Strategy:** Use **Gemini 2.0 Flash (FREE)** for Arbigent + e2e-test-agent = **$0/month testing**!

**Next Action:**
```bash
beads.exe update ved-10p --status in_progress
# Get Gemini API key: https://aistudio.google.com/app/apikey
```
