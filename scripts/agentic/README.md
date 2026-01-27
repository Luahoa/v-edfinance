# Agentic Toolkit Scripts

> Quick access to multi-agent orchestration tools for V-EdFinance

## Unified Pipeline (Recommended)

```batch
REM Start work session (sync + get next task)
scripts\agentic\pipeline.bat start

REM Claim a task
scripts\agentic\pipeline.bat claim ved-xxxx

REM Complete task (close + sync + show next)
scripts\agentic\pipeline.bat done ved-xxxx "Completed feature"

REM Or full cycle in one command
scripts\agentic\pipeline.bat full ved-xxxx "Reason"
```

## Setup

```batch
REM Add tools to PATH for current session
scripts\agentic\setup-path.bat
```

## Pipeline Commands

| Command | Purpose |
|---------|---------|
| `pipeline start` | Sync + get next recommended task |
| `pipeline next` | Get AI-recommended task only |
| `pipeline claim <id>` | Claim and start working |
| `pipeline done <id> "reason"` | Close + sync + show next |
| `pipeline sync` | Sync beads to git |
| `pipeline status` | Show current status |
| `pipeline full <id> "reason"` | Full cycle (claim→done→sync) |

## Individual Scripts

| Script | Purpose | Example |
|--------|---------|---------|
| `next-task` | Get AI-recommended next task | `next-task` |
| `triage` | Full triage report (JSON) | `triage` |
| `claim` | Claim a task | `claim ved-xxxx` |
| `close` | Close a task | `close ved-xxxx "Done"` |
| `safe-check` | Show DCG blocked commands | `safe-check` |
| `spawn-workers` | Spawn parallel workers | `spawn-workers ved-t1 ved-t2` |
| `status` | Show toolkit status | `status` |
| `mail-serve` | Start MCP Agent Mail | `mail-serve` |

## Daily Workflow (Using Pipeline)

### 1. Start Session
```batch
scripts\agentic\pipeline.bat start
```
This syncs beads and shows the AI-recommended next task.

### 2. Claim Task
```batch
scripts\agentic\pipeline.bat claim ved-xxxx
```

### 3. Do Your Work
Work on the task. DCG automatically blocks dangerous commands.

### 4. Complete & Sync
```batch
scripts\agentic\pipeline.bat done ved-xxxx "Implemented feature X"
```
This closes the task, syncs to git, and shows the next recommended task.

## Multi-Agent Parallel Execution

For complex epics with multiple tracks:

```batch
REM Spawn 3 parallel workers
scripts\agentic\spawn-workers ved-track1 ved-track2 ved-track3

REM Monitor
gt status
gt agents
```

## Direct Tool Access

All tools are in project root:

```batch
.\beads.exe list --status open
.\bv.exe --robot-triage
.\gt.exe status
.\dcg.exe check "command"
.\ms.exe list
```

## Vietnamese Commands

Bạn có thể ra lệnh bằng tiếng Việt cho Agent:

| Tiếng Việt | Command |
|------------|---------|
| "Task tiếp theo?" | `next-task` |
| "Nhận task ved-xxxx" | `claim ved-xxxx` |
| "Đóng task" | `close ved-xxxx` |
| "Kiểm tra lệnh an toàn" | `safe-check "cmd"` |
| "Spawn 3 workers" | `spawn-workers ...` |
| "Triage toàn bộ" | `triage` |

## Tool Documentation

- **beads** (bd): Issue tracking - https://github.com/Dicklesworthstone/beads_viewer
- **bv**: Graph triage engine - https://github.com/Dicklesworthstone/beads_viewer
- **gt** (gastown): Multi-agent orchestration - https://github.com/Dicklesworthstone/gastown
- **dcg**: Command safety - https://github.com/Dicklesworthstone/destructive_command_guard
- **ms** (meta_skill): Skill management - https://github.com/Dicklesworthstone/meta_skill
- **mcp-agent-mail**: File reservations - https://github.com/Dicklesworthstone/mcp_agent_mail
