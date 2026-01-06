# Ralph CLI Standalone Package

Quick setup guide for using Ralph CLI globally.

## Installation

### Option 1: Global Link (Development)

```bash
cd e:/Demo\ project/v-edfinance/libs/ralph-cli
pnpm link --global

# Test
ralph --version
ralph --help
```

### Option 2: Install from Source

```bash
# Clone or copy ralph-cli to any location
git clone <your-repo> ralph-cli
cd ralph-cli/libs/ralph-cli

# Install dependencies
pnpm install

# Build
pnpm build

# Link globally
pnpm link --global
```

### Option 3: Use npx directly

```bash
# In your project root
npx tsx e:/Demo\ project/v-edfinance/libs/ralph-cli/src/index.ts start my-epic
```

## Configuration

Create `ralph.config.json` in your project root:

```json
{
  "maxIterations": 30,
  "defaultWorkers": 0,
  "qualityGates": true,
  "beadsCommand": "beads.exe",
  "bvCommand": "bv.exe",
  "qualityGateScript": "scripts/quality-gate-ultra-fast.bat",
  "historyDir": "history/",
  "logDir": ".ralph/logs/"
}
```

## Requirements

Each project using Ralph needs:

1. **Beads system** - `beads.exe` and `bv.exe` in PATH or project root
2. **Quality gate script** - Create `scripts/quality-gate-ultra-fast.bat`
3. **Execution plans** - `history/<epic-id>/execution-plan.md`
4. **Git repository** - Ralph uses git for syncing

## Project Structure

```
your-project/
├── ralph.config.json          # Ralph configuration
├── test-ralph.bat            # Helper script (optional)
├── scripts/
│   └── quality-gate-ultra-fast.bat  # Quality validation
├── history/
│   └── <epic-id>/
│       └── execution-plan.md # Epic planning
└── .ralph/
    └── logs/                 # Ralph logs (auto-created)
```

## Usage

```bash
# Start epic execution
ralph start <epic-id> --max-iter 30 --verbose

# Check status
ralph status <epic-id>

# List all epics
ralph list

# Stop running epic
ralph stop <epic-id>

# Resume from checkpoint
ralph resume <epic-id>
```

## Troubleshooting

### Command not found
```bash
# Verify global link
pnpm list -g | findstr ralph

# Re-link if needed
cd e:/Demo\ project/v-edfinance/libs/ralph-cli
pnpm link --global
```

### Quality gates fail
```bash
# Test quality gate script directly
scripts\quality-gate-ultra-fast.bat

# Check JSON output
type .quality-gate-result.json
```

### Beads sync errors
```bash
# Verify beads installation
beads.exe list

# Check git status
git status

# Sync manually
beads.exe sync --no-daemon
```
