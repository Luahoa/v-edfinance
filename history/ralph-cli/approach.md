# Approach: Ralph Loop CLI

## Gap Analysis

| Component | Have | Need | Gap |
|-----------|------|------|-----|
| **CLI Framework** | claudekit-cli with cac | Ralph-specific commands | Create new libs/ralph-cli |
| **Loop Engine** | Batch/bash scripts | TypeScript implementation | Port START_RALPH_LOOP.bat logic |
| **Beads Integration** | bd/bv binaries | Wrapper functions | Create beads-client.ts |
| **Quality Gates** | quality-gate.sh script | Node.js wrapper | Spawn script from TS |
| **Orchestrator** | Manual Task() spawning | Automated worker spawning | Implement orchestrator.ts |
| **Config** | Env vars (RALPH_MAX_ITER) | ralph.config.json | Create config system |
| **Logging** | Console.log | Structured logging | Use ora + picocolors |

## Recommended Approach: Standalone Ralph CLI

This is a **LOW-MEDIUM risk** implementation because:
- Framework (cac) already proven in claudekit-cli
- Most logic exists in batch/bash scripts (just need TS port)
- Beads integration simple (spawn bd/bv commands)
- No new external dependencies

### Strategy: Copy-Paste-Adapt from claudekit-cli

**Phase 1: Scaffold Package** (Copy structure)
- Create `libs/ralph-cli/` following claudekit-cli structure
- Copy package.json, tsconfig.json, biome.json
- Setup bin/ralph.js shebang wrapper

**Phase 2: Implement Core** (Port batch logic to TS)
- Port START_RALPH_LOOP.bat → loop-engine.ts
- Implement beads-client.ts (spawn bd/bv commands)
- Implement quality-gate.ts (spawn quality-gate.sh)

**Phase 3: Add Commands** (5 commands)
- `ralph start` - Main loop
- `ralph stop` - Graceful stop
- `ralph status` - View progress
- `ralph list` - List epics
- `ralph resume` - Resume from checkpoint

**Phase 4: Polish UX** (Interactive prompts)
- Use @clack/prompts for interactive mode
- Add ora spinners for progress
- Implement --json mode for CI/CD

## Alternative Approaches

### Option B: Extend claudekit-cli
- Add ralph commands to existing ck CLI
- **Tradeoff**: Mixing concerns, harder to maintain
- **Why not**: Ralph is domain-specific (V-EdFinance), ck is generic

### Option C: Pure Node.js (no Bun)
- Use Node.js instead of Bun
- **Tradeoff**: Slower startup, larger bundle
- **Why not**: Bun already in use, faster

## Risk Map

| Component | Risk | Reason | Verification |
|-----------|------|--------|--------------|
| Port batch to TS | **LOW** | Logic simple, no complex logic | Unit tests |
| cac framework setup | **LOW** | Copy from claudekit-cli | Smoke test `ralph --help` |
| Beads integration | **LOW** | Just spawn bd/bv | Test `bd sync`, `bv --robot-plan` |
| Quality gate spawn | **MEDIUM** | Bash script on Windows needs WSL/Git Bash | Spike: Test spawn on Windows |
| Orchestrator spawning | **MEDIUM** | Integration with Amp Task() unclear | Spike: How to call Task() from CLI |
| Binary compilation | **MEDIUM** | Bun compile for 3 platforms | Test on Windows/Linux/Mac |

## Implementation Plan

### Track 1: Core CLI Infrastructure
**Agent: OrangeStone**
- Scaffold libs/ralph-cli package
- Setup package.json, tsconfig.json
- Configure bin/ralph.js wrapper
- Implement cli-config.ts with cac
- Create basic logger and config manager

### Track 2: Loop Engine & Integrations
**Agent: PurpleWave**
- Port START_RALPH_LOOP.bat logic to loop-engine.ts
- Implement beads-client.ts (wrap bd/bv commands)
- Implement quality-gate.ts (spawn quality-gate.sh)
- Create orchestrator.ts (worker spawning)
- Add completion detection (<promise> parsing)

### Track 3: Commands Implementation
**Agent: GreenMountain**
- Implement `ralph start` command
- Implement `ralph stop` command
- Implement `ralph status` command
- Implement `ralph list` command
- Implement `ralph resume` command

### Track 4: UX Polish & Build
**Agent: BlueLake**
- Add @clack/prompts interactive mode
- Implement ora spinners for progress
- Add --json output mode
- Configure Bun build for binaries
- Test on Windows/Linux/Mac

## Verification Strategy

### Per-Bead Verification
```bash
# TypeScript build
pnpm --filter ralph-cli build

# Unit tests
pnpm --filter ralph-cli test

# Smoke test
./libs/ralph-cli/bin/ralph.js --help
ralph start --help
```

### Integration Testing
```bash
# Test beads integration
ralph list --json

# Test loop execution (simulated)
ralph start ved-test --max-iter 1 --dry-run

# Test quality gates
ralph start ved-test --skip-quality-gates
```

### Quality Gates
```bash
# TypeScript strict mode
pnpm --filter ralph-cli typecheck

# Lint
pnpm --filter ralph-cli lint

# Build binary
pnpm --filter ralph-cli compile:binary
```

## Success Criteria

**All features must meet:**
1. ✅ Cross-platform (Windows/Linux/Mac)
2. ✅ TypeScript strict mode (no any types)
3. ✅ Interactive UX with @clack/prompts
4. ✅ JSON output mode for CI/CD
5. ✅ Graceful shutdown (SIGINT/SIGTERM)
6. ✅ Beads integration works (`bd sync`, `bv --robot-plan`)
7. ✅ Quality gates integration (spawn quality-gate.sh)
8. ✅ Binary compilation successful (Bun compile)

## CLI API Design

### `ralph start <epic-id>`
Start Ralph Loop for an epic

**Options**:
- `--max-iter <number>` - Maximum iterations (default: 30)
- `--workers <number>` - Number of parallel workers (default: auto from tracks)
- `--quality-gates` - Run quality gates after each iteration (default: true)
- `--skip-quality-gates` - Skip quality gates (for testing)
- `--dry-run` - Simulate execution without real changes
- `--json` - JSON output for CI/CD
- `--verbose` - Verbose logging

**Example**:
```bash
ralph start ved-pd8l --max-iter 50 --verbose
```

### `ralph stop <epic-id>`
Stop running loop gracefully

**Options**:
- `--force` - Force stop (SIGKILL)

### `ralph status <epic-id>`
View loop status and progress

**Options**:
- `--json` - JSON output

**Output**:
```json
{
  "epic": "ved-pd8l",
  "status": "running",
  "iteration": 5,
  "maxIterations": 30,
  "tracksComplete": 2,
  "tracksTotal": 3,
  "lastQualityGate": "pass"
}
```

### `ralph list`
List all epics with loop history

**Options**:
- `--status <status>` - Filter by status (running|complete|failed)
- `--json` - JSON output

### `ralph resume <epic-id>`
Resume stopped loop from last checkpoint

**Options**:
- `--from-iteration <number>` - Resume from specific iteration

## Configuration

### `ralph.config.json` (project root)
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

### Environment Variables
- `RALPH_MAX_ITER` - Override max iterations
- `RALPH_VERBOSE` - Enable verbose mode
- `RALPH_JSON` - Enable JSON output

## Expected Timeline

**Using parallel tracks**:
- Track 1 (OrangeStone): ~4-6 iterations (scaffold + infrastructure)
- Track 2 (PurpleWave): ~6-8 iterations (core logic port)
- Track 3 (GreenMountain): ~8-10 iterations (5 commands)
- Track 4 (BlueLake): ~4-6 iterations (UX + build)

**Total**: ~20-30 iterations with 4 workers in parallel

## Key Learnings to Embed in Beads

1. **cac Pattern**: Copy from claudekit-cli/src/index.ts
2. **Command Registration**: Use cli.command() with .option() and .action()
3. **Spawn Pattern**: Use `child_process.spawn()` for bd/bv/quality-gate.sh
4. **Completion Detection**: Parse stdout for `<promise>EPIC_COMPLETE</promise>`
5. **Cross-platform Paths**: Use `path.join()` and `path.resolve()`, handle Windows backslashes
6. **Graceful Shutdown**: Handle SIGINT/SIGTERM, cleanup child processes
7. **Binary Build**: `bun build src/index.ts --compile --outfile bin/ralph`

## Spike Requirements

**Spike 1: Quality Gate Spawn on Windows**
- **Question**: Can we spawn bash scripts on Windows without WSL?
- **Time-box**: 15 minutes
- **Test**: Spawn `quality-gate.sh` via Git Bash, WSL, or PowerShell wrapper
- **Output**: Working spawn pattern for Windows

**Spike 2: Orchestrator Integration**
- **Question**: How to call Amp Task() tool from Node.js CLI?
- **Time-box**: 30 minutes
- **Test**: Research Amp API, test spawning Task() from script
- **Output**: Working pattern or alternative (manual orchestrator for now)

**Spike 3: Bun Compile Cross-platform**
- **Question**: Can we build binaries for all 3 platforms from one machine?
- **Time-box**: 20 minutes
- **Test**: Run `bun build --compile` with platform targets
- **Output**: Build script for Windows/Linux/Mac binaries
