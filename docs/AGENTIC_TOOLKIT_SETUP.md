# Agentic Toolkit Setup

> Installed tools for multi-agent orchestration in V-EdFinance

## ✅ Installed Tools

| Tool | Version | Location | Purpose |
|------|---------|----------|---------|
| **beads (bd)** | 0.32.1 | `.\beads.exe` | Issue tracking CLI |
| **bv (beads viewer)** | 0.12.1 | `.\bv.exe` | Graph-aware triage engine |
| **gt (gastown)** | 0.5.0 | `.\gt.exe` | Multi-agent orchestration |
| **dcg** | 0.2.15 | `.\dcg.exe` | Destructive command guard |
| **ms (meta_skill)** | 0.1.1 | `.\ms.exe` | Skill management CLI |
| **mcp-agent-mail** | 0.3.0 | `mcp_agent_mail\.venv\` | Agent coordination via MCP |

All tools are now installed and functional.

## Usage

### Beads (Issue Tracking)
```bash
.\beads.exe list --status open    # List open issues
.\beads.exe ready                 # Show ready work
.\beads.exe close <id> --reason "Done"
```

### BV (Graph Analysis)
```bash
.\bv.exe --robot-triage           # AI-ready triage
.\bv.exe --robot-plan             # Execution plan
.\bv.exe --robot-insights         # Graph metrics
```

### Gastown (Multi-Agent)
```bash
.\gt.exe init ~/gt                # Initialize town
.\gt.exe rig add v-edfinance .    # Add project as rig
.\gt.exe convoy create "Epic" ved-xxxx ved-yyyy
```

### MCP Agent Mail
```bash
cd mcp_agent_mail
.\.venv\Scripts\python.exe -m mcp_agent_mail serve-http
# Or stdio mode for MCP integration
.\.venv\Scripts\python.exe -m mcp_agent_mail serve-stdio
```

### DCG (Destructive Command Guard)
```bash
.\dcg.exe check "rm -rf /"     # Validate command safety
.\dcg.exe --help               # Show available options
```

### Meta Skill
```bash
.\ms.exe list                  # List available skills
.\ms.exe describe <skill>      # Show skill details
.\ms.exe --help                # Show available options
```

## Build Notes

The Rust tools (dcg, ms) were built using MinGW-w64 toolchain:
- Toolchain: `nightly-x86_64-pc-windows-gnu`
- MinGW: WinLibs (POSIX threads, UCRT runtime) via winget
- Build path: `C:\ved` junction (avoids spaces in path)

Build commands:
```bash
# Setup junction (avoids path with spaces)
mklink /J C:\ved "e:\Demo project\v-edfinance"

# Build DCG
cd C:\ved\destructive_command_guard
cargo +nightly-x86_64-pc-windows-gnu build --release --target x86_64-pc-windows-gnu

# Build Meta Skill
cd C:\ved\meta_skill
cargo +nightly-x86_64-pc-windows-gnu build --release --target x86_64-pc-windows-gnu
```

## Integration with V-EdFinance

The toolkit integrates with the Better-T-Stack migration:

1. **Issue Tracking**: Use `beads.exe` for migration beads (ved-q85u, ved-99xl)
2. **Graph Analysis**: Use `bv.exe --robot-triage` to prioritize migration tasks
3. **Multi-Agent**: Use `gt.exe` to spawn parallel workers for track execution
4. **Coordination**: Use `mcp-agent-mail` for file reservations and messaging

See [TRANSFORMATION_EXECUTION_PLAN.md](TRANSFORMATION_EXECUTION_PLAN.md) for detailed usage.
