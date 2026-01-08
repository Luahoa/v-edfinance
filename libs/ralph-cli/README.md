# Ralph Loop CLI

Autonomous epic execution automation for V-EdFinance.

## Installation

```bash
# From workspace root
cd libs/ralph-cli
bun install
bun run build

# Or compile to binary
bun run compile:binary
```

## Quick Start

```bash
# Start a loop for an epic
ralph start ved-pd8l

# With options
ralph start ved-pd8l --max-iter 50 --verbose

# Monitor progress
ralph status ved-pd8l

# List all epics
ralph list

# Stop a running loop
ralph stop ved-pd8l

# Resume from checkpoint
ralph resume ved-pd8l
```

## Commands

### `ralph start <epic-id>`

Start Ralph Loop for an epic.

**Options:**
- `--max-iter <number>` - Maximum iterations (default: 30)
- `--workers <number>` - Number of parallel workers (default: auto)
- `--skip-quality-gates` - Skip quality gate verification
- `--dry-run` - Simulate execution without real changes
- `--verbose` - Enable verbose logging
- `--json` - Output in JSON format

**Example:**
```bash
ralph start ved-pd8l --max-iter 50 --verbose
```

### `ralph stop <epic-id>`

Stop a running loop gracefully.

**Options:**
- `--force` - Force stop with SIGKILL instead of SIGTERM

**Example:**
```bash
ralph stop ved-pd8l
ralph stop ved-pd8l --force
```

### `ralph status <epic-id>`

View loop status and progress.

**Options:**
- `--json` - Output in JSON format

**Example:**
```bash
ralph status ved-pd8l
ralph status ved-pd8l --json
```

### `ralph list`

List all epics with loop history.

**Options:**
- `--status <status>` - Filter by status (running|complete|failed)
- `--json` - Output in JSON format

**Example:**
```bash
ralph list
ralph list --status running
ralph list --json
```

### `ralph resume <epic-id>`

Resume a stopped loop from checkpoint.

**Options:**
- `--from-iteration <number>` - Resume from specific iteration

**Example:**
```bash
ralph resume ved-pd8l
ralph resume ved-pd8l --from-iteration 10
```

## Configuration

Create a `ralph.config.json` in your project root:

```json
{
  "maxIterations": 30,
  "defaultWorkers": 3,
  "qualityGates": true,
  "beadsCommand": "beads.exe",
  "bvCommand": "bv.exe",
  "qualityGateScript": "scripts/quality-gate.sh",
  "historyDir": "history/",
  "logDir": ".ralph/logs/"
}
```

### Configuration Options

- **maxIterations** (number) - Maximum loop iterations (default: 30)
- **defaultWorkers** (number) - Default parallel workers (default: auto)
- **qualityGates** (boolean) - Enable quality gates (default: true)
- **beadsCommand** (string) - Beads CLI command (default: "beads.exe" on Windows, "bd" on Unix)
- **bvCommand** (string) - Beads Viewer command (default: "bv.exe" on Windows, "bv" on Unix)
- **qualityGateScript** (string) - Path to quality gate script (default: "scripts/quality-gate.sh")
- **historyDir** (string) - Directory for execution plans (default: "history/")
- **logDir** (string) - Directory for loop logs (default: ".ralph/logs/")

## Environment Variables

Environment variables override configuration file values:

- `RALPH_MAX_ITER` - Override maxIterations
- `RALPH_VERBOSE` - Enable verbose mode (set to "1" or "true")
- `RALPH_JSON` - Enable JSON output mode (set to "1" or "true")

**Example:**
```bash
RALPH_MAX_ITER=50 RALPH_VERBOSE=1 ralph start ved-pd8l
```

## How It Works

Ralph Loop executes in a 4-phase cycle:

1. **Phase 1: Planning Check** - Verifies execution plan exists
2. **Phase 2: Orchestrator** - Spawns parallel worker agents
3. **Phase 3: Workers Execute** - Beads are executed across tracks
4. **Phase 4: Quality Gates** - Runs verification and checks for completion

The loop continues until:
- Completion promise detected: `<promise>EPIC_COMPLETE</promise>`
- Quality gates pass
- Maximum iterations reached

## Integration with Beads

Ralph CLI integrates seamlessly with the beads workflow:

```bash
# View epic status
bv --robot-triage --graph-root ved-pd8l

# Check blockers
beads list --status blocked

# Manual bead management
beads update ved-xxxx --status in_progress
beads close ved-xxxx --reason "Completed successfully"
```

## Troubleshooting

### Loop doesn't start

Check that:
- Execution plan exists in `history/<epic-id>/execution-plan.md`
- Beads CLI is available (`beads.exe` or `bd`)
- Quality gate script exists at configured path

### Quality gates failing

Review the quality gate output:
```bash
cat .quality-gate-result.json
cat .quality-gate.log
```

Fix errors and resume:
```bash
ralph resume ved-pd8l
```

### Max iterations reached

This means the loop didn't complete within the iteration limit. Review progress:

```bash
bv --robot-triage --graph-root ved-pd8l
beads list --status open --epic ved-pd8l
```

Then adjust max iterations and resume:
```bash
ralph resume ved-pd8l --max-iter 50
```

## Development

### Build from source

```bash
cd libs/ralph-cli
bun install
bun run build
```

### Run tests

```bash
bun test
```

### Compile binaries

```bash
# Single platform
bun run compile:binary

# All platforms
bun run compile:binaries
```

## License

MIT
