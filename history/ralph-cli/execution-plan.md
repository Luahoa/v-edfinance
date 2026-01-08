# Execution Plan: Ralph Loop CLI

Epic: ved-fz9m
Generated: 2026-01-06

## Tracks

| Track | Agent | Beads (in order) | File Scope |
|-------|-------|------------------|------------|
| 1 | OrangeStone | ved-xlwx → ved-0yhg | `libs/ralph-cli/**` (scaffold + infrastructure) |
| 2 | PurpleWave | ved-l5g9 → ved-3ypl | `libs/ralph-cli/src/core/**` (engine + integrations) |
| 3 | GreenMountain | ved-fey7 → ved-x0bd → ved-jx67 | `libs/ralph-cli/src/cli/commands/**` (5 commands) |
| 4 | BlueLake | ved-u09m → ved-5c5z → ved-zlvl | `libs/ralph-cli/**` (UX + build + docs) |

## Track Details

### Track 1: OrangeStone - CLI Infrastructure

**File scope**: `libs/ralph-cli/**` (package setup)
**Beads**:

1. `ved-xlwx`: Scaffold libs/ralph-cli package
   - Create package.json (copy from claudekit-cli, update name/bin)
   - Create tsconfig.json (strict mode)
   - Setup bin/ralph.js shebang wrapper
   - Create src/index.ts entry point
   - Basic logger (src/utils/logger.ts) with ora/picocolors
   - Config manager (src/utils/config.ts) with Zod schema

2. `ved-0yhg`: Setup CLI infrastructure with cac framework
   - Implement src/index.ts (copy pattern from claudekit-cli lines 38-124)
   - Create src/cli/cli-config.ts (cac setup)
   - Add global flags: --verbose, --json, --max-iter, --log-file
   - Graceful shutdown handlers (SIGINT/SIGTERM)
   - Version display command

### Track 2: PurpleWave - Loop Engine & Integrations

**File scope**: `libs/ralph-cli/src/core/**`
**Beads**:

1. `ved-l5g9`: Port loop engine from batch to TypeScript
   - Create src/core/loop-engine.ts
   - Port START_RALPH_LOOP.bat logic (4-phase cycle)
   - Phase 1: Check execution plan exists
   - Phase 2: Orchestrator spawn workers (simulated)
   - Phase 3: Workers execute beads
   - Phase 4: Quality gates verification
   - Completion detection (<promise>EPIC_COMPLETE</promise>)
   - Max iteration limit + exit codes

2. `ved-3ypl`: Implement beads + quality gate integrations
   - Create src/core/beads-client.ts
     - Wrapper for `bd sync`, `bd list`, `bd update`, `bd close`
     - Wrapper for `bv --robot-plan`, `bv --robot-triage`
     - Use child_process.spawn()
     - Parse JSON output
   - Create src/core/quality-gate.ts
     - Spawn scripts/quality-gate.sh
     - Handle cross-platform (Windows: WSL/Git Bash, Linux/Mac: direct)
     - Parse .quality-gate-result.json
     - Return pass/fail status

### Track 3: GreenMountain - Commands Implementation

**File scope**: `libs/ralph-cli/src/cli/commands/**`
**Beads**:

1. `ved-fey7`: Implement 'ralph start' command
   - Create src/cli/commands/start.ts
   - Register command: `cli.command('start <epic-id>', 'Start Ralph Loop')`
   - Options: --max-iter, --workers, --quality-gates, --skip-quality-gates, --dry-run, --json, --verbose
   - Interactive mode with @clack/prompts (epic selection if not provided)
   - Call loop-engine.start(epicId, options)
   - Progress spinner with ora
   - Exit codes: 0 (success), 1 (error), 130 (user cancel)

2. `ved-x0bd`: Implement status + list commands
   - Create src/cli/commands/status.ts
     - Show loop status: iteration count, tracks progress, quality gate result
     - Use beads-client.getEpicStatus(epicId)
     - Table format with cli-table3
     - JSON output mode
   - Create src/cli/commands/list.ts
     - List all epics with loop history
     - Filter by --status (running|complete|failed)
     - Use beads-client.listEpics()
     - JSON output mode

3. `ved-jx67`: Implement stop + resume commands
   - Create src/cli/commands/stop.ts
     - Graceful stop (save checkpoint, cleanup)
     - Read PID from .ralph/running/<epic-id>.pid
     - Send SIGTERM (or SIGKILL with --force)
     - Remove PID file after stop
   - Create src/cli/commands/resume.ts
     - Resume from checkpoint (.ralph/checkpoints/<epic-id>.json)
     - Option: --from-iteration <number>
     - Call loop-engine.resume(epicId, options)

### Track 4: BlueLake - UX Polish & Build

**File scope**: `libs/ralph-cli/**` (all)
**Beads**:

1. `ved-u09m`: Add interactive UX with prompts + spinners
   - Use @clack/prompts for:
     - Epic selection (if not provided as arg)
     - Confirmation prompts ("Start loop for ved-pd8l?")
     - Error recovery ("Quality gates failed. Retry? Y/n")
   - Add ora spinners for:
     - Beads sync operation
     - Quality gate execution
     - Worker spawning
   - Color output with picocolors:
     - Success: green
     - Error: red
     - Warning: yellow
     - Info: cyan
   - Progress bars for iterations (cli-progress)

2. `ved-5c5z`: Configure Bun build + cross-platform binaries
   - Create scripts/build-binaries.js
   - Bun build command: `bun build src/index.ts --compile --outfile bin/ralph`
   - Build for platforms: windows-x64, linux-x64, darwin-x64, darwin-arm64
   - Update package.json scripts:
     - `"build": "bun build src/index.ts --outdir dist"`
     - `"compile:binary": "bun build src/index.ts --compile --outfile bin/ralph"`
     - `"compile:binaries": "bun run scripts/build-binaries.js"`
   - Update .gitignore (bin/, dist/, *.exe)
   - Test binary on Windows

3. `ved-zlvl`: Add ralph.config.json + docs
   - Create src/types/config.schema.ts (Zod schema)
   - Config fields:
     - maxIterations: number (default: 30)
     - defaultWorkers: number (default: auto)
     - qualityGates: boolean (default: true)
     - beadsCommand: string (default: "beads.exe" or "bd")
     - bvCommand: string (default: "bv.exe" or "bv")
     - qualityGateScript: string (default: "scripts/quality-gate.sh")
     - historyDir: string (default: "history/")
     - logDir: string (default: ".ralph/logs/")
   - Create libs/ralph-cli/README.md:
     - Installation
     - Usage examples for all 5 commands
     - Configuration guide
     - Environment variables
     - Troubleshooting
   - Add example ralph.config.json to root

## Cross-Track Dependencies

- Track 2 (PurpleWave) can start immediately (no deps)
- Track 3 (GreenMountain) needs ved-l5g9 (loop-engine) from Track 2
- Track 4 (BlueLake) can start after ved-xlwx (package scaffold) from Track 1

**Parallelization strategy**:
- Start Track 1 + Track 2 in parallel
- Start Track 3 after ved-l5g9 completes
- Start Track 4 after ved-xlwx completes

## Key Learnings (from Discovery)

### cac Pattern (from claudekit-cli)
```typescript
import { cac } from 'cac';

const cli = cac('ralph');

cli
  .command('start <epic-id>', 'Start Ralph Loop')
  .option('--max-iter <number>', 'Max iterations', { default: 30 })
  .action(async (epicId, options) => {
    // Implementation
  });

cli.parse();
```

### Spawn Pattern (cross-platform)
```typescript
import { spawn } from 'child_process';
import path from 'path';

const beadsCmd = process.platform === 'win32' ? 'beads.exe' : 'bd';
const proc = spawn(beadsCmd, ['sync', '--no-daemon'], {
  stdio: 'inherit',
  shell: false
});
```

### Completion Detection
```typescript
const output = await readFile('.ralph-output.md', 'utf-8');
const isComplete = output.includes('<promise>EPIC_COMPLETE</promise>');
```

### Graceful Shutdown
```typescript
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  cleanup();
  process.exit(130);
});
```

## Quality Gates

### Per-Bead Verification
```bash
# TypeScript build
pnpm --filter ralph-cli build

# Type check
pnpm --filter ralph-cli typecheck

# Lint
pnpm --filter ralph-cli lint

# Test
pnpm --filter ralph-cli test
```

### Integration Testing
```bash
# Smoke test
./libs/ralph-cli/bin/ralph.js --version
./libs/ralph-cli/bin/ralph.js --help

# Command tests
ralph list --json
ralph status ved-pd8l --json

# Loop test (dry-run)
ralph start ved-test --max-iter 1 --dry-run
```

### Binary Build Verification
```bash
# Build binary
pnpm --filter ralph-cli compile:binary

# Test binary
./libs/ralph-cli/bin/ralph --version

# Cross-platform (requires platform access)
./libs/ralph-cli/bin/ralph-windows.exe --version
./libs/ralph-cli/bin/ralph-linux --version
./libs/ralph-cli/bin/ralph-macos --version
```

## Success Criteria

**Epic ved-fz9m complete when**:
- ✅ All 10 beads closed
- ✅ TypeScript build passes (strict mode, no any)
- ✅ Binary compilation successful (all platforms)
- ✅ All 5 commands working:
  - `ralph start <epic-id>` - Starts loop
  - `ralph stop <epic-id>` - Graceful stop
  - `ralph status <epic-id>` - Shows progress
  - `ralph list` - Lists epics
  - `ralph resume <epic-id>` - Resumes from checkpoint
- ✅ Interactive UX with prompts + spinners
- ✅ JSON output mode for CI/CD
- ✅ Config file support (ralph.config.json)
- ✅ README documentation complete
- ✅ Tested on Windows (primary platform)

## Expected Timeline

**Using 4 parallel tracks**:
- Track 1: ~4-6 iterations (2 beads)
- Track 2: ~6-8 iterations (2 beads)
- Track 3: ~8-10 iterations (3 beads)
- Track 4: ~6-8 iterations (3 beads)

**Total**: ~20-30 iterations (similar to UI epic)

## Next Steps for Orchestrator

When ready to execute this plan:

1. **Read this execution plan**
2. **Spawn 4 workers in parallel** (after resolving dependencies):
   ```typescript
   // Phase 1: Foundations
   Task("OrangeStone: ved-xlwx") // Track 1 start
   Task("PurpleWave: ved-l5g9")  // Track 2 start
   
   // Phase 2: Core Logic (after ved-l5g9)
   Task("PurpleWave: ved-3ypl")  // Track 2 continue
   Task("GreenMountain: ved-fey7") // Track 3 start (depends on ved-l5g9)
   
   // Phase 3: Commands + UX (parallel)
   Task("GreenMountain: ved-x0bd → ved-jx67") // Track 3 continue
   Task("BlueLake: ved-u09m → ved-5c5z → ved-zlvl") // Track 4 (depends on ved-xlwx)
   
   // Phase 4: Final Integration
   Task("OrangeStone: ved-0yhg") // Track 1 complete
   ```

3. **Monitor via Agent Mail**:
   - Track progress in epic thread
   - Handle cross-track blockers
   - Verify quality gates after each track completes

4. **Quality Gate Verification**:
   ```bash
   pnpm --filter ralph-cli build
   pnpm --filter ralph-cli test
   ./libs/ralph-cli/bin/ralph --version
   ```

5. **Close Epic** when all beads complete + quality gates pass
