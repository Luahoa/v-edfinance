# Beads Documentation

Issue tracking and workflow management documentation for V-EdFinance.

## Contents

- [Beads Sync Integration Guide](beads-sync-integration-guide.md) - Integration with git workflow
- [Beads Sync Ready](beads-sync-ready.md) - Readiness checklist
- [Beads Sync Commit Summary](beads-sync-commit-summary.md) - Commit workflow

## Beads Trinity

The project uses [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) for issue tracking:

1. **`bd`** (beads CLI) - Task management and sync
2. **`bv`** (beads viewer) - Visual interface
3. **Agent Mail** - Inter-agent communication

## Usage

```bash
# Create issue
beads.exe create "Issue description" --priority 0

# Sync (ALWAYS use --no-daemon during git operations)
beads.exe sync --no-daemon

# List issues
beads.exe list --status open
```

See [AGENTS.md](../../AGENTS.md#beads-workflow-integration) for complete guidelines.
