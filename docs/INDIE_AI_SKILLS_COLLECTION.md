# 🔥 Indie AI Assistant Skills Collection

> **Danh sách thư viện AI skills hot nhất trên GitHub (2024-2025)**  
> Dạng "AI assistant skill" tương tự UI/UX Pro Max - workflow/commands cho Claude, Cursor, Windsurf, etc.

---

## 📊 Top Skills theo Stars

### 1. ⭐ **wshobson/commands** (1,484 stars)
**URL:** https://github.com/wshobson/commands  
**Mô tả:** Production-ready slash commands cho Claude Code  
**Tính năng:**
- Workflows có cấu trúc cho software development
- Code review, feature creation, security auditing
- Architectural analysis
**Topics:** `claude-code`, `slash-commands`, `workflows`, `productivity`

---

### 2. ⭐ **cexll/myclaude** (1,355 stars)
**URL:** https://github.com/cexll/myclaude  
**Mô tả:** Claude Code và Codex orchestration workflow  
**Language:** Go  
**License:** AGPL-3.0  
**Đặc điểm:** Active development (pushed 2025-12-22)

---

### 3. ⭐ **peterkrueck/Claude-Code-Development-Kit** (1,257 stars)
**URL:** https://github.com/peterkrueck/Claude-Code-Development-Kit  
**Mô tả:** Handle context at scale - custom Claude Code workflow  
**Tính năng:**
- Hooks, MCP, sub agents
- Context management cho large projects
**Language:** Shell  
**Homepage:** https://www.linkedin.com/in/peterkrueck/

---

### 4. ⭐ **Njengah/claude-code-cheat-sheet** (1,055 stars)
**URL:** https://github.com/Njengah/claude-code-cheat-sheet  
**Mô tả:** Tips, tricks, hacks, workflows để master Claude Code  
**Topics:** `claude-code`, `claudecode-mcp`, `claude-api`  
**Homepage:** https://medium.com/@joe.njenga

---

### 5. ⭐ **czlonkowski/n8n-skills** (1,003 stars) 🔥 NEW
**URL:** https://github.com/czlonkowski/n8n-skills  
**Mô tả:** n8n skillset cho Claude Code để build workflows  
**Topics:** `n8n`, `workflow-automation`, `ai-agents`  
**Homepage:** https://www.n8n-skills.com  
**Created:** Oct 2025 (MỚI NHẤT - tăng trưởng nhanh!)

---

### 6. ⭐ **qdhenry/Claude-Command-Suite** (871 stars)
**URL:** https://github.com/qdhenry/Claude-Command-Suite  
**Mô tả:** Professional slash commands cho Claude Code  
**Tính năng:**
- Structured workflows cho dev tasks
- Code review, security auditing, architectural analysis
**Topics:** `claude-code`, `slash-commands`, `developer-tools`, `productivity`

---

### 7. ⭐ **catlog22/Claude-Code-Workflow** (667 stars)
**URL:** https://github.com/catlog22/Claude-Code-Workflow  
**Mô tả:** JSON-driven multi-agent development framework  
**Tính năng:**
- Intelligent CLI orchestration (Gemini/Qwen/Codex)
- Context-first architecture
- Automated workflow execution
**Language:** JavaScript  
**Topics:** `claude-code`, `workflow-automation`, `task-orchestration`

---

## 🚀 Trending & Rising Stars

### 8. **parruda/swarm** (1,540 stars)
**URL:** https://github.com/parruda/swarm  
**Mô tả:** Ruby gems cho AI agent systems  
**Tính năng:**
- Automation, research, data processing, customer support
- Single-process orchestration, persistent memory
- Semantic search, node workflows
**Language:** Ruby  
**Created:** May 2025

---

## 🎯 Specialized Skills

### 9. **nextlevelbuilder/ui-ux-pro-max-skill** ⭐ ĐÃ CÀI
**URL:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill  
**Mô tả:** AI skill cho professional UI/UX design  
**Tính năng:**
- 57 UI Styles, 95 Color Palettes, 56 Font Pairings
- 24 Chart Types, 98 UX Guidelines
- Searchable database với Python script
**CLI:** `npm install -g uipro-cli`

---

## 📋 So Sánh Skills

| Repo | Stars | Language | Focus | Updated | CLI Tool |
|------|-------|----------|-------|---------|----------|
| wshobson/commands | 1,484 | - | Claude commands | Oct 2025 | ❌ |
| cexll/myclaude | 1,355 | Go | Orchestration | Dec 2025 | ❌ |
| peterkrueck/CCDK | 1,257 | Shell | Context mgmt | Sep 2025 | ❌ |
| Njengah/cheat-sheet | 1,055 | - | Tips & tricks | Aug 2025 | ❌ |
| **czlonkowski/n8n-skills** | **1,003** | **-** | **n8n workflows** | **Oct 2025** | ✅ **NEW** |
| qdhenry/Command-Suite | 871 | Shell | Pro commands | Nov 2025 | ❌ |
| catlog22/Workflow | 667 | JS | Multi-agent | Dec 2025 | ✅ |
| UI-UX-Pro-Max | - | - | Design | - | ✅ |

---

## 🔍 Tiêu Chí Đánh Giá

### 🏆 Top Picks cho V-EdFinance:

1. **UI/UX Pro Max** ✅ ĐÃ CÀI
   - Design system cho landing pages, dashboards
   - Fintech color palettes
   - Educational typography

2. **n8n-skills** 🔥 RECOMMENDED
   - Workflow automation cho backend
   - Integration với APIs
   - Perfect cho AI agent orchestration

3. **Claude-Command-Suite**
   - Security auditing (cho fintech)
   - Code review automation
   - Architectural analysis

4. **Claude-Code-Workflow**
   - Multi-agent development
   - JSON-driven (dễ customize)
   - Context management

---

## 📦 Cách Cài Đặt

### Option 1: CLI (nếu có)

```bash
# n8n-skills
npm install -g n8n-skills-cli  # (chưa verify)

# UI/UX Pro Max
npm install -g uipro-cli
uipro init --ai all
```

### Option 2: Manual Installation

```bash
# Clone repo
git clone https://github.com/[repo-name]

# Copy folders vào project
cp -r .claude/skills/* ~/project/.claude/skills/
cp -r .cursor/commands/* ~/project/.cursor/commands/
```

### Option 3: Git Submodule

```bash
# Add as submodule
git submodule add https://github.com/[repo-name] .skills/[skill-name]

# Symlink vào .claude/, .cursor/, etc.
ln -s .skills/[skill-name]/.claude .claude/skills/[skill-name]
```

---

## 🎯 Integration Strategy cho V-EdFinance

### Phase 1: Design System ✅
- **UI/UX Pro Max** - Đã cài đặt
- Generate landing pages, dashboards, forms

### Phase 2: Workflow Automation 🔜
- **n8n-skills** - For backend orchestration
- **Claude-Code-Workflow** - Multi-agent development

### Phase 3: Code Quality 🔜
- **Claude-Command-Suite** - Security, code review
- **Claude-Code-Development-Kit** - Context management

### Phase 4: Documentation 🔜
- **claude-code-cheat-sheet** - Best practices
- **wshobson/commands** - Standard workflows

---

## 🔗 Resources

### Official Docs
- Claude Skills: https://docs.anthropic.com/en/docs/claude-code
- Cursor Commands: https://cursor.sh/docs
- Windsurf Workflows: https://codeium.com/windsurf

### Community
- r/ClaudeCode - Reddit discussions
- Discord: Anthropic AI Community
- Twitter: #ClaudeCode, #AISkills

---

## 🚀 Next Steps

### Immediate (Session này):
1. ✅ Đã cài UI/UX Pro Max
2. 🔲 Đánh giá n8n-skills
3. 🔲 Test Claude-Command-Suite

### Short-term (Week này):
1. 🔲 Setup multi-skill environment
2. 🔲 Create V-EdFinance-specific skills
3. 🔲 Document workflows

### Long-term (Month này):
1. 🔲 Contribute back to community
2. 🔲 Build custom skills repository
3. 🔲 Share learnings

---

## 📝 Notes

**Trend Observations:**
- AI Assistant Skills format mới hot từ mid-2025
- Hầu hết repos created Jun-Nov 2025
- CLI tools đang trở thành standard
- Claude Code có ecosystem lớn nhất

**Best Practices:**
- Version skills trong Git
- Test skills trước khi deploy production
- Fork và customize cho project-specific needs
- Contribute improvements back upstream

**Security:**
- Review skill code trước khi install
- Check permissions (file access, network)
- Use trusted sources only
- Monitor skill activity

---

**Last Updated:** 2025-12-22  
**Maintained by:** V-EdFinance Team  
**Status:** Living Document - Update khi có skills mới
