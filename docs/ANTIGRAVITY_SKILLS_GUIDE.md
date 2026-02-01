# 🌌 Agent Skills Guide for V-EdFinance

> **Tổng hợp 630+ Agent Skills** - Hướng dẫn sử dụng cho dự án V-EdFinance
>
> 📚 **Universal Guide:** [`~/.amp/skills/SKILLS_MASTER_GUIDE.md`](file:///C:/Users/luaho/.amp/skills/SKILLS_MASTER_GUIDE.md)
>
> ## Installed Collections
> | Collection | Path | Skills |
> |------------|------|--------|
> | Cloudflare Official | `~/.amp/skills/cloudflare-official/skills` | 7 |
> | Antigravity | `~/.amp/skills/antigravity/skills` | 625+ |
> | Custom | `~/.amp/skills/custom-skills` | User-defined |
>
> **Amp Setting:** `~/.amp/skills/cloudflare-official/skills;~/.amp/skills/antigravity/skills;~/.amp/skills/custom-skills`

---

## 📚 Mục lục

- [Cách sử dụng Skills](#-cách-sử-dụng-skills)
- [Skills ưu tiên cho V-EdFinance](#-skills-ưu-tiên-cho-v-edfinance)
- [Starter Packs theo Role](#-starter-packs-theo-role)
- [Danh mục Skills đầy đủ](#-danh-mục-skills-đầy-đủ)
- [FAQ & Troubleshooting](#-faq--troubleshooting)

---

## 🚀 Cách sử dụng Skills

### Cú pháp cơ bản

```
# Trong Amp/Claude Code
/skill skill-name

# Hoặc tự nhiên
"Use @skill-name to help me..."
"Sử dụng skill react-best-practices để review component này"
```

### Ví dụ thực tế

| Mục đích | Cách gọi |
|----------|----------|
| Lập kế hoạch feature | `Use @brainstorming to plan the payment flow` |
| Review React code | `Use @react-best-practices to review this component` |
| Kiểm tra accessibility | `Use @accessibility-compliance-accessibility-audit on this page` |
| Security audit API | `Use @api-security-best-practices to review endpoints` |
| Viết test | `Use @test-driven-development to write tests for this service` |
| Debug lỗi | `Use @systematic-debugging to fix this error` |

---

## ☁️ Cloudflare Skills (Ưu tiên cho V-EdFinance)

> V-EdFinance deploy trên **Cloudflare Workers/Pages** → Cloudflare skills được ưu tiên load đầu tiên

### Available Skills

| Skill | Description | Use Case cho V-EdFinance |
|-------|-------------|--------------------------|
| **`cloudflare`** | Comprehensive platform (Workers, Pages, D1, R2, AI) | Mọi thứ liên quan Cloudflare |
| **`agents-sdk`** | Build stateful AI agents | AI Mentor chat feature |
| **`durable-objects`** | Stateful coordination, WebSockets | Real-time notifications |
| **`wrangler`** | CLI for Workers | Deploy, manage R2/D1 |
| **`web-perf`** | Core Web Vitals audit | Performance optimization |
| **`building-mcp-server-on-cloudflare`** | Remote MCP servers | AI tool integration |
| **`building-ai-agent-on-cloudflare`** | AI agents with state | Advanced AI features |

### Commands

| Command | Description |
|---------|-------------|
| `/cloudflare:build-agent` | Build AI agent using Agents SDK |
| `/cloudflare:build-mcp` | Build MCP server on Cloudflare |

### Example Usage

```bash
# Deploy to Cloudflare Workers
Use @wrangler to deploy the API to Cloudflare Workers

# Build AI chat feature
/cloudflare:build-agent

# Audit performance
Use @web-perf to audit Core Web Vitals for the dashboard

# Setup Durable Objects for real-time
Use @durable-objects to implement WebSocket notifications
```

---

## ⭐ Skills ưu tiên cho V-EdFinance

### 🎯 Theo Task hiện tại

| Task ID | Task Name | Skills phù hợp |
|---------|-----------|----------------|
| `ved-9isr` | E2E tests for tRPC API | `test-driven-development`, `playwright-skill` |
| `ved-4g7h` | Roster Export CSV | `typescript-expert`, `api-patterns` |
| `ved-61gi` | Teacher Revenue Dashboard | `react-best-practices`, `analytics-tracking` |
| `ved-34r1` | AI/ML Integration | `rag-implementation`, `prompt-engineering`, `langfuse` |
| `ved-kspn` | Frontend UX Polish | `frontend-design`, `ui-ux-pro-max`, `accessibility-compliance-accessibility-audit` |
| `ved-f99a.6` | GitHub Actions CI/CD | `deployment-procedures`, `docker-expert` |

### 🔥 Top 20 Skills cho Tech Stack

| Skill | Tại sao tồn tại | Use Case cho V-EdFinance |
|-------|-----------------|--------------------------|
| **react-best-practices** | Tối ưu performance React/Next.js | Dashboard, components optimization |
| **nextjs-best-practices** | App Router patterns, SSR/SSG | Route handlers, server components |
| **typescript-expert** | TypeScript nâng cao, generics | tRPC type safety, Drizzle schemas |
| **api-patterns** | REST vs GraphQL vs tRPC | tRPC router design |
| **postgres-best-practices** | Query optimization, indexing | Drizzle queries, analytics |
| **test-driven-development** | Viết test trước code | Vitest unit tests |
| **frontend-design** | UI guidelines, aesthetics | Dashboard redesign |
| **accessibility-compliance-accessibility-audit** | WCAG compliance | WCAG AA compliance |
| **stripe-integration** | Payment, subscriptions | Payment flow |
| **auth-implementation-patterns** | JWT, OAuth2, sessions | better-auth integration |
| **api-security-best-practices** | OWASP API security | tRPC endpoint security |
| **docker-expert** | Containers, multi-stage builds | Cloudflare Workers deployment |
| **deployment-procedures** | Safe rollout, blue-green | CI/CD pipeline |
| **observability-engineer** | Monitoring, logging | Production observability |
| **rag-implementation** | RAG architecture | AI chat feature |
| **prompt-engineering** | Prompt design patterns | Gemini integration |
| **langfuse** | LLM observability | AI usage tracking |
| **seo-audit** | Technical SEO | Landing page SEO |
| **analytics-tracking** | GA4, PostHog setup | User behavior tracking |
| **i18n-guidelines** | Internationalization | vi/en/zh support |

---

## 👤 Starter Packs theo Role

### 🚀 Essentials (Bắt buộc cho mọi người)

| Skill | Mô tả | Use Case |
|-------|-------|----------|
| `concise-planning` | Luôn bắt đầu với kế hoạch | Trước mỗi feature mới |
| `lint-and-validate` | Tự động clean code | Sau mỗi lần code |
| `git-pushing` | Safe git workflow | Commit/push an toàn |
| `kaizen` | Continuous improvement | Refactoring mindset |
| `systematic-debugging` | Debug như pro | Khi gặp bugs |
| `verification-before-completion` | Verify trước khi done | Trước khi close task |

### 🌐 Web Wizard (Frontend Developer)

| Skill | Tại sao | Use Case |
|-------|---------|----------|
| `frontend-design` | UI guidelines và aesthetics | Mọi UI component |
| `react-best-practices` | React & Next.js performance | Component optimization |
| `react-patterns` | Modern React patterns | Hooks, context, composition |
| `nextjs-best-practices` | Next.js App Router patterns | Route handlers, layouts |
| `tailwind-patterns` | Tailwind CSS v4 styling | Responsive design |
| `form-cro` | Form conversion optimization | Login, checkout forms |
| `seo-audit` | Technical SEO | Landing pages |

### ⚡ Full-Stack Developer

| Skill | Tại sao | Use Case |
|-------|---------|----------|
| `senior-fullstack` | Complete fullstack guide | Architecture decisions |
| `frontend-developer` | React 19+ và Next.js 15+ | Frontend code |
| `backend-dev-guidelines` | Node.js/Express/TypeScript | API development |
| `api-patterns` | REST vs GraphQL vs tRPC | tRPC router design |
| `database-design` | Schema design và ORM | Drizzle schema |
| `stripe-integration` | Payments và subscriptions | Payment feature |

### 🛡️ Security Developer

| Skill | Tại sao | Use Case |
|-------|---------|----------|
| `api-security-best-practices` | Secure API design | tRPC endpoints |
| `auth-implementation-patterns` | JWT, OAuth2, sessions | better-auth |
| `backend-security-coder` | Secure backend coding | Input validation |
| `frontend-security-coder` | XSS prevention | User input handling |
| `cc-skill-security-review` | Security checklist | Pre-deploy review |

### 🤖 AI & Agents

| Skill | Tại sao | Use Case |
|-------|---------|----------|
| `llm-app-patterns` | Production LLM patterns | Gemini integration |
| `rag-implementation` | RAG architecture | AI-powered search |
| `prompt-caching` | Cache strategies for prompts | Cost optimization |
| `context-window-management` | Manage LLM context | Long conversations |
| `langfuse` | LLM observability | AI usage tracking |

### 🌧️ DevOps & Cloud

| Skill | Tại sao | Use Case |
|-------|---------|----------|
| `docker-expert` | Containers, multi-stage builds | Production builds |
| `deployment-procedures` | Safe rollout strategies | CI/CD |
| `observability-engineer` | Comprehensive monitoring | Production reliability |
| `incident-responder` | Rapid incident response | When things break |
| `postmortem-writing` | Blameless postmortems | After incidents |

### 📊 Data & Analytics

| Skill | Tại sao | Use Case |
|-------|---------|----------|
| `analytics-tracking` | GA4/PostHog setup | User tracking |
| `sql-pro` | Modern SQL patterns | Complex queries |
| `postgres-best-practices` | Postgres optimization | Query performance |
| `ab-test-setup` | A/B testing | Feature experiments |
| `database-architect` | Database design | Schema decisions |

---

## 📋 Danh mục Skills đầy đủ

### Architecture (59 skills)

| Skill | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| `architect-review` | Review system designs | Trước major features |
| `architecture` | ADR framework | Architecture decisions |
| `architecture-decision-records` | Write ADRs | Documenting decisions |
| `senior-architect` | Comprehensive architecture | System design |
| `microservices-patterns` | Microservices architecture | Service decomposition |
| `event-sourcing-architect` | Event sourcing & CQRS | Event-driven systems |
| `docs-architect` | Technical documentation | Creating docs |

### Development (80 skills)

| Skill | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| `typescript-expert` | TypeScript mastery | Type-safe code |
| `javascript-pro` | Modern JavaScript ES6+ | JS patterns |
| `react-patterns` | Modern React patterns | Component design |
| `react-best-practices` | React performance | Optimization |
| `nextjs-best-practices` | Next.js App Router | Route handling |
| `nextjs-app-router-patterns` | Next.js 14+ patterns | Advanced routing |
| `nodejs-best-practices` | Node.js principles | Backend code |
| `api-design-principles` | REST/GraphQL design | API creation |
| `database-design` | Schema design | Database modeling |
| `tailwind-patterns` | Tailwind CSS v4 | Styling |

### Testing (21 skills)

| Skill | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| `test-driven-development` | Write tests first | New features |
| `testing-patterns` | Test design patterns | Test structure |
| `test-fixing` | Fix failing tests | When tests break |
| `playwright-skill` | Browser automation | E2E testing |
| `python-testing-patterns` | pytest patterns | Python tests |

### Security (112 skills)

| Skill | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| `api-security-best-practices` | Secure API design | API development |
| `auth-implementation-patterns` | JWT, OAuth2 | Auth implementation |
| `accessibility-compliance-accessibility-audit` | WCAG compliance | Accessibility review |
| `vulnerability-scanner` | Security analysis | Security audit |
| `security-auditor` | Comprehensive audits | Pre-release |
| `ethical-hacking-methodology` | Pentest methodology | Security testing |
| `backend-security-coder` | Secure backend | Input validation |
| `frontend-security-coder` | XSS prevention | Frontend security |

### Business (37 skills)

| Skill | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| `competitive-landscape` | Competitor analysis | Market research |
| `content-creator` | SEO content | Blog posts |
| `copywriting` | Marketing copy | Landing pages |
| `seo-audit` | Technical SEO | SEO optimization |
| `pricing-strategy` | Pricing models | Monetization |
| `startup-metrics-framework` | SaaS metrics | KPI tracking |

### Data & AI (81 skills)

| Skill | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| `rag-implementation` | RAG architecture | AI search |
| `prompt-engineering` | Prompt design | LLM prompts |
| `langfuse` | LLM observability | AI monitoring |
| `vector-database-engineer` | Vector DBs | Embeddings |
| `embedding-strategies` | Embedding selection | AI features |
| `analytics-tracking` | GA4/PostHog | User tracking |

### Infrastructure (72 skills)

| Skill | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| `docker-expert` | Containers | Deployment |
| `kubernetes-architect` | K8s architecture | Orchestration |
| `terraform-specialist` | IaC mastery | Infrastructure |
| `aws-serverless` | Lambda, DynamoDB | AWS deployment |
| `vercel-deployment` | Vercel patterns | Vercel deploy |
| `deployment-procedures` | Rollout strategies | Production deploy |
| `bash-linux` | Terminal wizardry | Scripting |

### Workflow (17 skills)

| Skill | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| `mermaid-expert` | Create diagrams | Documentation |
| `billing-automation` | Billing systems | Payments |
| `agent-orchestration-multi-agent-optimize` | Multi-agent systems | Complex automation |
| `workflow-automation` | Automation patterns | Repetitive tasks |

### General (122 skills)

| Skill | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| `brainstorming` | Structured ideation | Planning |
| `concise-planning` | Quick planning | Before coding |
| `systematic-debugging` | Debug methodology | Bug fixing |
| `git-pushing` | Safe git workflow | Committing |
| `verification-before-completion` | Verify work | Before marking done |
| `finishing-a-development-branch` | Branch completion | PR creation |
| `address-github-comments` | Handle PR comments | Code review |

---

## 🔧 Custom Skills cho V-EdFinance

Bạn có thể tạo custom skills tại `~/.amp/skills/custom-skills/`:

### Cấu trúc skill

```
~/.amp/skills/custom-skills/
└── ved-workflow/
    └── SKILL.md
```

### Template SKILL.md

```markdown
---
name: ved-workflow
description: V-EdFinance specific workflow and patterns
---

# V-EdFinance Development Workflow

## When to use
- Starting new features
- Running quality gates
- Deploying to production

## Workflow Steps

### 1. Before coding
- Check beads for assigned tasks
- Read AGENTS.md for project context
- Run `pnpm install` && `pnpm build` baseline

### 2. During development
- Follow Atomic Design for components
- Use tRPC routers for API
- Add i18n keys for all UI strings

### 3. Before completion
- Run `scripts/quality-gate-ultra-fast.bat`
- Verify build passes
- Update beads status
- Git push (MANDATORY)

## Tech Stack Quick Reference
- Frontend: Next.js 15, React 19, Tailwind, shadcn/ui
- Backend: Hono, tRPC, Drizzle, Neon PostgreSQL
- Auth: better-auth
- Deploy: Cloudflare Workers/Pages
```

---

## ❓ FAQ & Troubleshooting

### Q: Skill không được load?

**A:** Kiểm tra:
1. Path trong Amp settings đúng: `~/.amp/skills/antigravity/skills`
2. Restart VS Code sau khi thay đổi settings
3. Folder có chứa `SKILL.md`

### Q: Skills trùng tên giữa các sources?

**A:** Amp load theo thứ tự:
1. Project skills (`.claude/skills/`) - ưu tiên cao nhất
2. Global skills (theo thứ tự trong settings)

Path đầu tiên được ưu tiên nếu trùng tên.

### Q: Làm sao update skills?

**A:** Chạy trong thư mục antigravity:
```bash
cd ~/.amp/skills/antigravity
git pull
```

### Q: Skill nào nên dùng thường xuyên?

**A:** Top 5 cho daily work:
1. `concise-planning` - Trước mỗi task
2. `systematic-debugging` - Khi gặp bugs
3. `verification-before-completion` - Trước khi done
4. `react-best-practices` - Mọi React code
5. `typescript-expert` - Type safety

### Q: Làm sao tạo skill mới?

**A:** Dùng skill creator:
```
Use @skill-creator to create a new skill for V-EdFinance testing workflow
```

---

## 📊 Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                 ANTIGRAVITY SKILLS CHEATSHEET               │
├─────────────────────────────────────────────────────────────┤
│ PLANNING                                                    │
│   @concise-planning    - Quick planning before coding       │
│   @brainstorming       - Structured ideation                │
│   @architecture        - Architecture decisions             │
├─────────────────────────────────────────────────────────────┤
│ CODING                                                      │
│   @react-best-practices - React/Next.js performance         │
│   @typescript-expert    - TypeScript mastery                │
│   @api-patterns         - REST/GraphQL/tRPC                 │
│   @database-design      - Schema design                     │
├─────────────────────────────────────────────────────────────┤
│ TESTING                                                     │
│   @test-driven-development - Write tests first              │
│   @playwright-skill        - E2E automation                 │
│   @systematic-debugging    - Debug methodology              │
├─────────────────────────────────────────────────────────────┤
│ SECURITY                                                    │
│   @api-security-best-practices - Secure APIs                │
│   @auth-implementation-patterns - Auth patterns             │
│   @accessibility-compliance-accessibility-audit - WCAG      │
├─────────────────────────────────────────────────────────────┤
│ DEPLOYMENT                                                  │
│   @docker-expert        - Containers                        │
│   @deployment-procedures - Safe rollouts                    │
│   @vercel-deployment    - Vercel patterns                   │
├─────────────────────────────────────────────────────────────┤
│ AI/ML                                                       │
│   @rag-implementation   - RAG architecture                  │
│   @prompt-engineering   - LLM prompts                       │
│   @langfuse            - LLM observability                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-01 | 1.1.0 | Added Cloudflare official skills, updated Amp settings |
| 2026-02-01 | 1.0.0 | Initial guide created |

---

## 🔗 Resources

- **Universal Guide:** [`~/.amp/skills/SKILLS_MASTER_GUIDE.md`](file:///C:/Users/luaho/.amp/skills/SKILLS_MASTER_GUIDE.md)
- [Cloudflare Skills](https://github.com/cloudflare/skills) - Official Cloudflare skills
- [Antigravity Skills](https://github.com/sickn33/antigravity-awesome-skills) - 625+ skills
- [Agent Skills Standard](https://agentskills.io/) - Skill format specification

---

*Generated for V-EdFinance project*
