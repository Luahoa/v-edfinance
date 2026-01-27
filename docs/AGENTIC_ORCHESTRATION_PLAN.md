# Agentic Tools Orchestration Plan

> Kế hoạch phối hợp tất cả công cụ trong V-EdFinance

## Tool Ecosystem Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MAYOR (Main Agent/You)                             │
│  Orchestrates all work, makes decisions, spawns workers                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   bv.exe      │           │  beads.exe    │           │   gt.exe      │
│   (Triage)    │           │  (Tracking)   │           │  (Gastown)    │
│               │           │               │           │               │
│ • --robot-    │           │ • list/show   │           │ • polecat     │
│   triage      │           │ • update      │           │   spawn       │
│ • --robot-    │           │ • close       │           │ • convoy      │
│   next        │           │ • sync        │           │ • sling       │
│ • --robot-    │           │ • create      │           │ • status      │
│   plan        │           │               │           │               │
└───────────────┘           └───────────────┘           └───────────────┘
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SAFETY & COORDINATION LAYER                        │
├─────────────────────────────────┬───────────────────────────────────────────┤
│         dcg.exe                 │           mcp-agent-mail                   │
│    (Command Guard)              │        (File Reservations)                 │
│                                 │                                            │
│ • PreToolUse hook               │ • reserve_file_paths()                     │
│ • Blocks: rm -rf, git reset     │ • send_message()                           │
│ • Auto-integrates with Claude   │ • get_messages()                           │
│                                 │ • release_reservation()                    │
└─────────────────────────────────┴───────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ms.exe (Meta Skill)                             │
│  • Skill discovery and loading                                               │
│  • Context packing for agents                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tool Responsibilities

| Tool | Role | When Used |
|------|------|-----------|
| **bv.exe** | Brain - AI triage & prioritization | Start of session, choosing next task |
| **beads.exe** | Memory - Issue tracking & sync | All task lifecycle operations |
| **gt.exe** | Hands - Spawn parallel workers | Complex epics with multiple tracks |
| **dcg.exe** | Guardian - Block dangerous commands | Every Bash command (automatic) |
| **mcp-agent-mail** | Coordinator - Prevent conflicts | Multi-agent parallel work |
| **ms.exe** | Knowledge - Load relevant skills | Before complex domain work |

## Integration Points

### 1. DCG Integration (PreToolUse Hook)

DCG runs automatically on EVERY Bash command via Claude Code hook:

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{"type": "command", "command": "dcg"}]
    }]
  }
}
```

**Flow:**
```
Agent wants to run: git reset --hard
    │
    ▼
DCG intercepts (PreToolUse hook)
    │
    ▼
DCG analyzes command
    │
    ├── SAFE → Allow execution
    │
    └── DANGEROUS → Block + Return error to agent
```

### 2. MCP Agent Mail Integration

For multi-agent work, agents must reserve files:

```python
# Before editing
reserve_file_paths(
    project_key="/path/to/v-edfinance",
    agent_name="POLECAT-1",
    paths=["apps/server/src/trpc/routers/user.ts"],
    exclusive=True,
    reason="ved-bts-5c: Create user router"
)

# After editing
release_reservation(project_key, agent_name, paths)
```

### 3. Meta Skill Integration

Before domain-specific work:

```bash
# Search for relevant skills
.\ms.exe search "drizzle migration" --robot

# Load skill with token budget
.\ms.exe load drizzle-patterns --pack 2000
```

## Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 1: SESSION START                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  pipeline start                                                              │
│      │                                                                       │
│      ├── beads sync --no-daemon     ← Pull latest from remote               │
│      │                                                                       │
│      ├── bv --robot-triage          ← AI analyzes all tasks                 │
│      │                                                                       │
│      └── bv --robot-next            ← Recommend top task                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 2: TASK CLAIM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  pipeline claim ved-xxxx                                                     │
│      │                                                                       │
│      ├── beads update ved-xxxx --status=in_progress                         │
│      │                                                                       │
│      ├── ms search "<task domain>"  ← Find relevant skills                  │
│      │                                                                       │
│      └── [If multi-agent] mcp-agent-mail reserve files                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 3: WORK EXECUTION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Agent does work]                                                           │
│      │                                                                       │
│      ├── Every Bash command → DCG PreToolUse hook (automatic)               │
│      │       │                                                               │
│      │       ├── SAFE: Execute                                              │
│      │       └── DANGEROUS: Block + suggest alternative                     │
│      │                                                                       │
│      ├── [If parallel] gt polecat spawn --bead ved-track-N                  │
│      │       │                                                               │
│      │       └── Each polecat reserves its files via mcp-agent-mail         │
│      │                                                                       │
│      └── [Quality gate] pnpm build, pnpm test                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 4: TASK COMPLETION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  pipeline done ved-xxxx "reason"                                             │
│      │                                                                       │
│      ├── [If multi-agent] mcp-agent-mail release reservations               │
│      │                                                                       │
│      ├── beads close ved-xxxx --reason "..."                                │
│      │                                                                       │
│      ├── beads sync --no-daemon     ← Push to remote                        │
│      │                                                                       │
│      └── bv --robot-next            ← Show next task                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Multi-Agent Parallel Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MAYOR (Main Thread)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. bv --robot-triage-by-track      ← Get tasks grouped by track            │
│                                                                              │
│  2. Start MCP Agent Mail server:                                             │
│     mcp-agent-mail serve-http --port 8080                                    │
│                                                                              │
│  3. Create convoy:                                                           │
│     gt convoy create "Epic Name" ved-track1 ved-track2 ved-track3           │
│                                                                              │
│  4. Spawn polecats (parallel workers):                                       │
│     gt polecat spawn --bead ved-track1 --name BlueLake                      │
│     gt polecat spawn --bead ved-track2 --name GreenMountain                 │
│     gt polecat spawn --bead ved-track3 --name RedCastle                     │
│                                                                              │
│  5. Monitor:                                                                 │
│     gt status                        ← Overall status                        │
│     gt agents                        ← List active agents                    │
│     gt convoy list                   ← Convoy progress                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ POLECAT BlueLake│       │POLECAT GreenMtn │       │POLECAT RedCastle│
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ Track: ved-trk1 │       │ Track: ved-trk2 │       │ Track: ved-trk3 │
│                 │       │                 │       │                 │
│ 1. Reserve files│       │ 1. Reserve files│       │ 1. Reserve files│
│    via MCP      │       │    via MCP      │       │    via MCP      │
│                 │       │                 │       │                 │
│ 2. Work (DCG    │       │ 2. Work (DCG    │       │ 2. Work (DCG    │
│    protects)    │       │    protects)    │       │    protects)    │
│                 │       │                 │       │                 │
│ 3. Quality gate │       │ 3. Quality gate │       │ 3. Quality gate │
│                 │       │                 │       │                 │
│ 4. Release files│       │ 4. Release files│       │ 4. Release files│
│                 │       │                 │       │                 │
│ 5. Close bead   │       │ 5. Close bead   │       │ 5. Close bead   │
│                 │       │                 │       │                 │
│ 6. Notify Mayor │       │ 6. Notify Mayor │       │ 6. Notify Mayor │
└─────────────────┘       └─────────────────┘       └─────────────────┘
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MAYOR (Synthesis)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. gt convoy status "Epic Name"    ← Check all tracks complete             │
│                                                                              │
│  2. beads sync --no-daemon          ← Final sync                            │
│                                                                              │
│  3. Quality gate (full build/test)                                           │
│                                                                              │
│  4. git push                         ← Push to remote                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## DCG Blocked Commands Reference

| Category | Blocked Commands |
|----------|------------------|
| **Git** | `git reset --hard`, `git checkout -- <path>`, `git push --force`, `git branch -D`, `git clean -f`, `git stash drop/clear` |
| **Filesystem** | `rm -rf` outside /tmp |
| **Containers** | `docker system prune -f` |
| **Kubernetes** | `kubectl delete namespace`, `kubectl delete --all` |
| **Databases** | `DROP DATABASE`, `TRUNCATE` |
| **Cloud** | `terraform destroy -auto-approve` |

## Vietnamese Command Reference

| Tiếng Việt | Pipeline Command |
|------------|------------------|
| "Bắt đầu làm việc" | `pipeline start` |
| "Task tiếp theo là gì?" | `pipeline next` |
| "Nhận task ved-xxxx" | `pipeline claim ved-xxxx` |
| "Xong task ved-xxxx" | `pipeline done ved-xxxx "Lý do"` |
| "Đồng bộ" | `pipeline sync` |
| "Trạng thái" | `pipeline status` |
| "Spawn 3 workers" | `spawn-workers ved-t1 ved-t2 ved-t3` |
| "Triage toàn bộ" | `triage` |

## Configuration Files

| File | Purpose |
|------|---------|
| `.claude/settings.json` | DCG hook configuration |
| `.beads/config.yaml` | Beads settings |
| `mcp_agent_mail/.env` | MCP server config |
| `scripts/agentic/*.bat` | Pipeline scripts |

## Troubleshooting

### DCG not blocking commands
1. Check `.claude/settings.json` has the hook configured
2. Ensure `dcg.exe` is in PATH or project root
3. Run `.\dcg.exe --help` to verify it works

### Beads sync fails
1. Use `--no-daemon` flag: `beads sync --no-daemon`
2. Kill daemon if stuck: `taskkill /f /im beads.exe`
3. Remove lock: `del .beads\daemon.lock`

### MCP Agent Mail connection issues
1. Ensure server is running: `scripts\agentic\mail-serve.bat`
2. Check port 8080 is free
3. Verify Python venv: `mcp_agent_mail\.venv\Scripts\python.exe --version`

### Gastown polecat spawn fails
1. Ensure beads is accessible: `.\beads.exe list`
2. Add scripts\agentic to PATH for `bd` wrapper
3. Initialize gt if needed: `.\gt.exe init .`
