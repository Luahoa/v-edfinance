# 🛠️ Agentic Toolkit Guide for V-EdFinance

> Hướng dẫn sử dụng bộ công cụ Agent cho cả **người dùng** và **AI Coding Agents**

---

## 📋 Tổng quan các công cụ

| Tool | Chức năng | Ngôn ngữ | Cài đặt |
|------|-----------|----------|---------|
| **beads** (`bd`) | Issue tracking có dependency graph | Go | `go install github.com/steveyegge/beads/cmd/bd@latest` |
| **beads_viewer** (`bv`) | TUI + robot flags cho graph analysis | Go | `go install` từ repo |
| **mcp_agent_mail** | Coordination layer cho multi-agent | Python | `./scripts/install.sh` |
| **gastown** (`gt`) | Multi-agent orchestration với Mayor | Go | `brew tap steveyegge/gastown && brew install gt` |
| **repo_updater** (`ru`) | Sync nhiều repos cùng lúc | Bash | `curl -fsSL .../install.sh \| bash` |
| **destructive_command_guard** (`dcg`) | Block lệnh nguy hiểm | Rust | `cargo install` |
| **meta_skill** (`ms`) | Skill management + MCP server | Rust | `cargo install --path .` |

---

## 🔗 Kiến trúc tích hợp

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATION LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  gastown (gt)     │  mcp_agent_mail     │  meta_skill (ms)      │
│  Mayor + Polecats │  Inbox/Outbox/Leases│  Skills + MCP Server  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         WORK TRACKING                            │
├─────────────────────────────────────────────────────────────────┤
│  beads (bd)              │  beads_viewer (bv)                   │
│  Issue CRUD, deps, sync  │  PageRank, critical path, --robot-*  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          SAFETY LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  destructive_command_guard (dcg)  │  repo_updater (ru)          │
│  Block rm -rf, git reset --hard   │  Sync repos, detect conflicts│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (5 phút)

### 1. Cài đặt MCP Agent Mail (core)

```bash
cd "e:/Demo project/v-edfinance/mcp_agent_mail"
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/mcp_agent_mail/main/scripts/install.sh" | bash -s -- --yes
```

Sau khi cài, khởi động server:
```bash
am  # Alias tự động được thêm vào shell
```

### 2. Tích hợp với Beads (đã có sẵn trong project)

```bash
# V-EdFinance đã có .beads/ - chỉ cần sync
bd sync --no-daemon
bd ready  # Xem task sẵn sàng
```

### 3. Sử dụng Beads Viewer cho AI triage

```bash
cd "e:/Demo project/v-edfinance/beads_viewer"
go build -o bv.exe ./cmd/bv
# Copy bv.exe ra project root
```

---

## 📖 Hướng dẫn chi tiết từng tool

---

### 1. MCP Agent Mail 📬

**Mục đích**: Coordination layer cho multi-agent workflows - như Gmail cho coding agents.

#### Cho người dùng:

```bash
# Khởi động server
am  # hoặc: cd mcp_agent_mail && ./scripts/run_server_with_token.sh

# Xem trạng thái
curl http://localhost:8765/health
```

#### Cho AI Agent:

```python
# MCP tools có sẵn trong môi trường agent:

# 1. Đăng ký identity
ensure_project(project_key="/path/to/v-edfinance")
register_agent(project_key, program="claude", model="opus-4")

# 2. Reserve files trước khi edit (tránh conflict)
file_reservation_paths(
    project_key="/path/to/v-edfinance",
    agent_name="GreenCastle",
    paths=["apps/web/src/**"],
    ttl_seconds=3600,
    exclusive=True
)

# 3. Gửi message với thread_id = bead ID
send_message(
    project_key="/path/to/v-edfinance",
    from_agent="GreenCastle",
    to_agent="BlueLake",
    subject="[ved-abc1] Starting frontend track",
    body="Working on Sidebar refactor",
    thread_id="ved-abc1"
)

# 4. Check inbox
fetch_inbox(project_key, agent_name="GreenCastle", limit=20)
```

**Macros (nhanh hơn cho tasks đơn giản)**:
- `macro_start_session` - Đăng ký + announce
- `macro_prepare_thread` - Setup thread cho bead
- `macro_file_reservation_cycle` - Reserve → work → release
- `macro_contact_handshake` - Connect 2 agents

---

### 2. Beads (bd) 📿

**Mục đích**: Issue tracking với dependency graph, giống Linear nhưng Git-native.

#### Cho người dùng:

```bash
# Xem tasks sẵn sàng (không có blockers)
bd ready

# Tạo issue mới
bd create "Fix Sidebar accessibility" --priority 1 --type bug

# Cập nhật trạng thái
bd update ved-xyz1 --status in_progress

# Đóng issue
bd close ved-xyz1 --reason "Completed"

# Sync với Git (QUAN TRỌNG: không tự động git commit!)
bd sync --no-daemon
git add .beads/ && git commit -m "Update beads"
```

#### Cho AI Agent:

```bash
# LUÔN dùng --json cho machine-readable output
bd ready --json
bd list --status=open --json
bd show ved-abc1 --json

# Workflow pattern:
# 1. Pick task
bd ready --json | jq '.[0]'

# 2. Claim task
bd update ved-abc1 --status in_progress

# 3. Work...

# 4. Complete
bd close ved-abc1 --reason "Fixed accessibility issues"
bd sync --no-daemon

# 5. Git commit (MANDATORY - bd không tự làm!)
git add .beads/ && git commit -m "Close ved-abc1"
```

**⚠️ QUAN TRỌNG**: 
- `bd` KHÔNG BAO GIỜ chạy git commands - bạn phải tự làm
- Luôn dùng `--no-daemon` để tránh lock conflicts

---

### 3. Beads Viewer (bv) 👁️

**Mục đích**: Graph analytics cho beads - PageRank, critical path, cycles detection.

#### Cho người dùng:

```bash
# Interactive TUI
bv

# Xem insights
bv --robot-insights | jq '.PageRank[:5]'
```

#### Cho AI Agent (QUAN TRỌNG):

**KHÔNG BAO GIỜ chạy `bv` không có flags** - sẽ launch TUI và block session!

```bash
# THE MEGA-COMMAND - bắt đầu từ đây
bv --robot-triage

# Output bao gồm:
# - quick_ref: tổng quan + top 3 picks
# - recommendations: ranked items với scores
# - quick_wins: low-effort high-impact
# - blockers_to_clear: unblock downstream work
# - project_health: distributions, metrics
# - commands: copy-paste next steps

# Chỉ lấy top pick
bv --robot-next

# Execution plan với parallel tracks
bv --robot-plan

# Full graph metrics
bv --robot-insights

# Priority misalignment detection
bv --robot-priority

# Change tracking
bv --robot-diff --diff-since HEAD~10
```

**jq patterns hữu ích**:
```bash
bv --robot-triage | jq '.quick_ref'
bv --robot-triage | jq '.recommendations[0]'
bv --robot-plan | jq '.plan.summary.highest_impact'
bv --robot-insights | jq '.Cycles'  # MUST FIX circular deps!
```

---

### 4. Gas Town (gt) 🏘️

**Mục đích**: Multi-agent orchestration với Mayor pattern - scale 20-30 agents.

#### Cho người dùng:

```bash
# Cài đặt
brew tap steveyegge/gastown && brew install gt

# Khởi tạo workspace
gt install ~/gt --git
cd ~/gt

# Thêm project
gt rig add v-edfinance /path/to/v-edfinance

# Tạo crew workspace
gt crew add yourname --rig v-edfinance

# Bắt đầu Mayor session
gt mayor attach
```

#### Core Concepts:

| Term | Meaning |
|------|---------|
| **Mayor** | AI coordinator chính - nói với Mayor những gì bạn muốn |
| **Town** | Workspace directory (~/gt/) |
| **Rig** | Project container (wraps git repo) |
| **Polecat** | Ephemeral worker agent |
| **Hook** | Git worktree-based persistent storage |
| **Convoy** | Work tracking unit (bundle of beads) |

#### Workflow:

```bash
# 1. Tell Mayor what to build
gt mayor attach
# "I want to implement user authentication"

# 2. Mayor creates convoy with beads
gt convoy create "Auth System" ved-auth1 ved-auth2 --notify

# 3. Assign work to agents
gt sling ved-auth1 v-edfinance

# 4. Track progress
gt convoy list
gt agents
```

---

### 5. Repo Updater (ru) 📦

**Mục đích**: Sync nhiều repos cùng lúc - clone missing, pull updates, detect conflicts.

#### Cho người dùng:

```bash
# Cài đặt
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/repo_updater/main/install.sh" | bash

# Sync tất cả repos
ru sync

# Preview trước
ru sync --dry-run

# Parallel sync
ru sync -j4 --autostash
```

#### Cho AI Agent:

```bash
# LUÔN dùng --json cho automation
ru sync --non-interactive --json
ru status --no-fetch --json
ru list --paths  # stdout only paths

# Exit codes:
# 0 = ok
# 1 = partial failure
# 2 = conflicts exist
# 3 = system error
# 4 = bad args
# 5 = interrupted (use --resume)
```

**⚠️ CRITICAL**: 
- KHÔNG tạo worktrees/clones trong projects dir → dùng `/tmp/`
- KHÔNG parse human output → dùng `--json`

---

### 6. Destructive Command Guard (dcg) 🛡️

**Mục đích**: Hook chặn lệnh nguy hiểm trước khi execute.

#### Cài đặt:

```bash
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/destructive_command_guard/master/install.sh" | bash -s -- --easy-mode
```

#### Blocked by default:

| Category | Commands |
|----------|----------|
| **Git (critical)** | `git reset --hard`, `git clean -fd`, `git push --force` |
| **Git (high)** | `git checkout -- <file>`, `git stash drop`, `git branch -D` |
| **Filesystem** | `rm -rf` (ngoài /tmp) |

#### Enable thêm packs:

```toml
# ~/.config/dcg/config.toml
[packs]
enabled = [
    "database.postgresql",    # DROP TABLE, TRUNCATE
    "kubernetes.kubectl",     # kubectl delete namespace
    "cloud.aws",              # aws ec2 terminate-instances
    "containers.docker",      # docker system prune
]
```

#### Cho AI Agent:

```bash
# Explain tại sao bị block
dcg explain "git reset --hard HEAD~5"

# Allow-once (24h)
dcg allow-once <code>

# Permanent allowlist
dcg allowlist add <ruleId> --project
```

---

### 7. Meta Skill (ms) 🎓

**Mục đích**: Skill management platform - store, search, package skills cho AI agents.

#### Core features:

- **Dual persistence**: SQLite (queries) + Git (audit)
- **Hybrid search**: BM25 + embeddings + RRF
- **MCP server**: Native integration với Claude, Codex
- **Token packing**: Fit skills trong context budget

#### Commands:

```bash
# Initialize
ms init

# Index skills
ms index

# Search
ms search "error handling" --robot

# Load skill với token budget
ms load rust-error-handling --pack 2000

# Start MCP server
ms mcp serve
```

---

## 🔄 V-EdFinance Integration Workflow

### Recommended Daily Workflow

```bash
# 1. Morning: Check what's ready
bd ready
bv --robot-triage | jq '.quick_ref'

# 2. Before coding: Reserve files
# (qua MCP Agent Mail nếu multi-agent)

# 3. Claim task
bd update ved-xxx --status in_progress

# 4. Work...

# 5. Before commit: Sync beads
bd sync --no-daemon

# 6. Commit together
git add .
git commit -m "[ved-xxx] Description"
git push

# 7. Close bead
bd close ved-xxx --reason "Completed"
bd sync --no-daemon
git add .beads/ && git commit -m "Close ved-xxx" && git push
```

### Multi-Agent Epic Execution

```bash
# 1. Planning phase
bv --robot-plan | jq '.plan.tracks'

# 2. Start Agent Mail server
am

# 3. Each agent:
#    - Register identity
#    - Reserve files (exclusive)
#    - Work on track
#    - Release files
#    - Send completion message

# 4. Verification phase
scripts/quality-gate-ultra-fast.bat

# 5. Landing (MANDATORY)
git pull --rebase
bd sync --no-daemon
git add .beads/
git commit -m "Epic complete"
git push
```

---

## 🚨 Common Pitfalls

### Agent Mail
- ❌ "from_agent not registered" → Luôn `register_agent` trước
- ❌ "FILE_RESERVATION_CONFLICT" → Check `fetch_reservations`, wait hoặc dùng non-exclusive

### Beads
- ❌ Không git push sau `bd sync` → Work bị mất!
- ❌ Dùng daemon trong git operations → Lock conflicts

### Beads Viewer
- ❌ Chạy `bv` không có flags → Block session với TUI
- ✅ Luôn dùng `--robot-*` flags

### DCG
- ❌ Ignore blocked commands → Data loss
- ✅ Dùng `dcg explain` để hiểu tại sao

---

## 📚 Thêm vào AGENTS.md

Thêm snippet sau vào `AGENTS.md` của project:

```markdown
## Agentic Toolkit Integration

### MCP Agent Mail
- Server: `am` (port 8765)
- Reserve files: `file_reservation_paths(..., exclusive=true)`
- Thread ID = Bead ID (e.g., `ved-abc1`)

### Beads + Beads Viewer
- `bd ready --json` để tìm task
- `bv --robot-triage` để triage
- `bd sync --no-daemon` + git commit LUÔN đi cùng nhau

### Safety
- DCG blocks destructive commands automatically
- KHÔNG BAO GIỜ bypass mà không hiểu tại sao

### Landing the Plane
Work is NOT complete until `git push` succeeds!
```

---

## 📎 Tài liệu tham khảo

- [mcp_agent_mail README](../mcp_agent_mail/README.md)
- [beads_viewer SKILL.md](../beads_viewer/SKILL.md)
- [gastown README](../gastown/README.md)
- [repo_updater SKILL.md](../repo_updater/SKILL.md)
- [destructive_command_guard README](../destructive_command_guard/README.md)
- [meta_skill README](../meta_skill/README.md)
