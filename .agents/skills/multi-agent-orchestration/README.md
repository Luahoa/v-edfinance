# Multi-Agent Orchestration Skill

## 📦 Skill Structure

```
multi-agent-orchestration/
├── SKILL.md                    # Main documentation
├── README.md                   # This file
├── scripts/                    # Bash scripts
│   ├── beads-smart-select.sh
│   ├── beads-claim-task.sh
│   ├── beads-release-task.sh
│   └── beads-unified-dashboard.sh
└── examples/                   # Usage examples
    └── wave-execution.sh
```

## 🚀 Quick Start

### 1. Installation

```bash
# From project root
cd .agents/skills/multi-agent-orchestration

# Make scripts executable
chmod +x scripts/*.sh

# Install dependencies (if not already installed)
cd ../../..
./scripts/install-beads-trinity.sh
```

### 2. Basic Usage

```bash
# Select task for agent
./scripts/beads-smart-select.sh MyAgent

# Claim task
./scripts/beads-claim-task.sh ved-123 MyAgent

# Release task
./scripts/beads-release-task.sh ved-123 MyAgent "Work complete"

# Monitor dashboard
./scripts/beads-unified-dashboard.sh
```

### 3. Load Skill in Amp

```markdown
Use the `skill` tool to load this skill:

**Tool Call:**
```json
{
  "name": "skill",
  "arguments": {
    "name": "multi-agent-orchestration"
  }
}
```

The skill provides commands for orchestrating 100+ AI agents:
- Smart task selection (AI-driven)
- File conflict prevention (advisory locks)
- Agent-to-agent messaging
- Real-time monitoring dashboard
```

## 📚 Documentation

- **Main Guide**: [SKILL.md](SKILL.md)
- **Integration Guide**: [../../../BEADS_INTEGRATION_DEEP_DIVE.md](../../../BEADS_INTEGRATION_DEEP_DIVE.md)
- **Installation**: [../../../MULTI_AGENT_INTEGRATION_PLAN.md](../../../MULTI_AGENT_INTEGRATION_PLAN.md)

## 🔑 Key Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `beads-smart-select` | AI-driven task selection | Start of session |
| `beads-claim-task` | Atomic claim + file lock | Before editing files |
| `beads-release-task` | Close + unlock + notify | After work complete |
| `beads-unified-dashboard` | Real-time monitoring | During multi-agent execution |

## 🎯 Use Cases

1. **Single Agent Session** - Select → Claim → Work → Release
2. **Wave Execution** - Deploy 20 agents in parallel
3. **Debugging Conflicts** - Monitor file locks, resolve conflicts
4. **Progress Tracking** - View unified dashboard, export reports

## ⚙️ Configuration

Set these environment variables:

```bash
export AGENT_NAME="MyAgent"                    # Your agent name
export PROJECT_ROOT="$(pwd)"                   # Project directory
export AGENT_MAIL_URL="http://127.0.0.1:9000/mcp/"  # MCP server URL
```

## 🔧 Troubleshooting

**No tasks available:**
```bash
bd doctor  # Check for blockers
bv --robot-insights | jq '.Bottlenecks'  # View blocking tasks
```

**File reservation conflict:**
```bash
# View active locks
curl http://127.0.0.1:9000/mcp/ -d '{"method":"resources/read","params":{"uri":"resource://file_reservations/<project>?active_only=true"}}'
```

**MCP server offline:**
```bash
# Start server
cd ~/.mcp_agent_mail
uv run python -m mcp_agent_mail.cli serve-http
```

## 📊 Success Metrics

- File conflicts: 0%
- Task sync latency: <1s
- Graph health: >0.7
- Agent coordination: 95%+ ACK rate

## 🔗 Resources

- **beads_viewer**: https://github.com/Dicklesworthstone/beads_viewer
- **mcp_agent_mail**: https://github.com/Dicklesworthstone/mcp_agent_mail

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-03
