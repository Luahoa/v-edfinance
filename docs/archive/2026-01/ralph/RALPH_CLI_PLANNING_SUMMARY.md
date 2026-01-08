# Ralph Loop CLI - Planning Complete ✅

## 📋 Overview

**Epic**: [ved-fz9m](file:///e:/Demo%20project/v-edfinance/.beads/issues.jsonl) - Ralph Loop CLI - Modern command-line interface

**Status**: ✅ Planning complete (6/6 phases), ready for execution

**10 beads** created for 4 parallel tracks:
- **Track 1 (OrangeStone)**: 2 beads - CLI infrastructure
- **Track 2 (PurpleWave)**: 2 beads - Loop engine + integrations
- **Track 3 (GreenMountain)**: 3 beads - 5 commands implementation
- **Track 4 (BlueLake)**: 3 beads - UX polish + build

## 🎯 Planning Workflow Results

### Phase 1: Discovery ✅
**Output**: [discovery.md](file:///e:/Demo%20project/v-edfinance/history/ralph-cli/discovery.md)

**Key findings**:
- claudekit-cli uses **cac + @clack/prompts + Bun** (proven pattern)
- Beads binary wrapper pattern (cross-platform spawn)
- Agent-based orchestrator in amphitheatre-vps-deploy.ts
- All dependencies already available (no new deps needed)

**Risk assessment**: LOW-MEDIUM (all patterns exist in codebase)

### Phase 2: Synthesis ✅
**Output**: [approach.md](file:///e:/Demo%20project/v-edfinance/history/ralph-cli/approach.md)

**Recommended approach**: Standalone ralph CLI (libs/ralph-cli)
- Copy proven patterns from claudekit-cli
- Port START_RALPH_LOOP.bat logic to TypeScript
- 5 commands: start, stop, status, list, resume
- Interactive UX with @clack/prompts + ora spinners

**Gap analysis**:
- CLI Framework: ✅ Have cac in claudekit-cli → Create ralph-cli
- Loop Engine: Have batch script → Port to loop-engine.ts
- Beads Integration: Have bd/bv binaries → Wrap in beads-client.ts
- Quality Gates: Have quality-gate.sh → Spawn from quality-gate.ts
- Config: Have env vars → Create ralph.config.json

### Phase 3: Verification ✅
**Spikes**: SKIPPED (all risks LOW-MEDIUM, existing patterns)

**Identified spikes** (not executed):
1. Quality Gate Spawn on Windows (cross-platform bash)
2. Orchestrator Integration (Amp Task() API)
3. Bun Compile Cross-platform (binary build)

**Decision**: Skip spikes, proceed with known patterns

### Phase 4: Decomposition ✅
**Output**: 10 beads in `.beads/` database

**Epic ved-fz9m** blocks:
- ved-xlwx, ved-0yhg (Track 1)
- ved-l5g9, ved-3ypl (Track 2)
- ved-fey7, ved-x0bd, ved-jx67 (Track 3)
- ved-u09m, ved-5c5z, ved-zlvl (Track 4)

**Beads sync**: ✅ Synced to external beads repo

### Phase 5: Validation ✅
**bv --robot-plan output**: Validated dependency graph

**Key findings**:
- Epic ved-fz9m detected as track-F
- Unblocks 10 tasks correctly
- No cycles detected
- Ready for parallel execution

### Phase 6: Track Planning ✅
**Output**: [execution-plan.md](file:///e:/Demo%20project/v-edfinance/history/ralph-cli/execution-plan.md)

**Execution strategy**:
```
Phase 1: Foundations
├─ OrangeStone: ved-xlwx (scaffold)
└─ PurpleWave: ved-l5g9 (loop engine)

Phase 2: Core Logic
├─ PurpleWave: ved-3ypl (integrations)
└─ GreenMountain: ved-fey7 (start command) [depends on ved-l5g9]

Phase 3: Commands + UX
├─ GreenMountain: ved-x0bd → ved-jx67 (4 more commands)
└─ BlueLake: ved-u09m → ved-5c5z → ved-zlvl (UX + build)

Phase 4: Integration
└─ OrangeStone: ved-0yhg (CLI infrastructure complete)
```

## 📊 Planning Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| Discovery Report | [history/ralph-cli/discovery.md](file:///e:/Demo%20project/v-edfinance/history/ralph-cli/discovery.md) | Codebase patterns, frameworks, constraints |
| Approach Document | [history/ralph-cli/approach.md](file:///e:/Demo%20project/v-edfinance/history/ralph-cli/approach.md) | Gap analysis, strategy, risk map |
| Execution Plan | [history/ralph-cli/execution-plan.md](file:///e:/Demo%20project/v-edfinance/history/ralph-cli/execution-plan.md) | Track assignments, file scopes, dependencies |
| Beads | `.beads/*.md` | 10 executable work items |

## 🎯 CLI API Design

### Commands
```bash
# Start loop
ralph start <epic-id> [--max-iter 50] [--verbose]

# Monitor
ralph status <epic-id> [--json]
ralph list [--status running]

# Control
ralph stop <epic-id> [--force]
ralph resume <epic-id> [--from-iteration 10]
```

### Configuration
**ralph.config.json**:
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

## 🔧 Technical Stack

**Framework**: cac v6.7.14
**Prompts**: @clack/prompts v0.7.0
**Spinners**: ora v8.0.0
**Colors**: picocolors v1.1.1
**Runtime**: Bun >=1.3.2 (Node.js >=18.0.0 fallback)
**Build**: Bun compile for cross-platform binaries

## 📁 File Structure

```
libs/ralph-cli/
├── package.json
├── tsconfig.json
├── bin/
│   └── ralph.js              # Shebang wrapper
├── src/
│   ├── index.ts              # Entry point (cac setup)
│   ├── cli/
│   │   ├── cli-config.ts     # cac configuration
│   │   └── commands/
│   │       ├── start.ts      # ralph start
│   │       ├── stop.ts       # ralph stop
│   │       ├── status.ts     # ralph status
│   │       ├── list.ts       # ralph list
│   │       └── resume.ts     # ralph resume
│   ├── core/
│   │   ├── loop-engine.ts    # Main loop (ported from batch)
│   │   ├── beads-client.ts   # bd/bv wrapper
│   │   ├── quality-gate.ts   # quality-gate.sh wrapper
│   │   └── orchestrator.ts   # Worker spawning
│   ├── utils/
│   │   ├── logger.ts         # Logging with ora
│   │   └── config.ts         # Config management (Zod)
│   └── types/
│       ├── index.ts          # TypeScript types
│       └── config.schema.ts  # Zod schema
└── scripts/
    └── build-binaries.js     # Cross-platform build
```

## ✅ Success Criteria

**Planning complete** ✅ (all 6 phases done)

**Epic ved-fz9m ready for execution when**:
- ✅ Discovery report exists
- ✅ Approach document exists  
- ✅ No spikes needed (all LOW-MEDIUM risk)
- ✅ 10 beads created in `.beads/`
- ✅ `bv --robot-plan` validation passes (no cycles, deps resolved)
- ✅ Execution plan generated with 4 tracks

**Implementation complete when** (future):
- ⏳ All 10 beads closed
- ⏳ TypeScript build passes (strict mode)
- ⏳ 5 commands working (start, stop, status, list, resume)
- ⏳ Binary compilation successful (Windows/Linux/Mac)
- ⏳ Interactive UX with prompts + spinners
- ⏳ JSON output mode for CI/CD
- ⏳ Documentation complete (README + examples)

## 📈 Expected Timeline

**Implementation** (when orchestrator spawns workers):
- Track 1: ~4-6 iterations (2 beads)
- Track 2: ~6-8 iterations (2 beads)
- Track 3: ~8-10 iterations (3 beads)
- Track 4: ~6-8 iterations (3 beads)

**Total**: ~20-30 iterations with 4 parallel workers

## 🚀 Next Steps

### For Orchestrator (orchestrator.md)

1. **Read execution plan**: `history/ralph-cli/execution-plan.md`
2. **Spawn 4 workers in parallel**:
   ```typescript
   Task("OrangeStone: Track 1 - CLI Infrastructure")
   Task("PurpleWave: Track 2 - Loop Engine")
   Task("GreenMountain: Track 3 - Commands") // after ved-l5g9
   Task("BlueLake: Track 4 - UX + Build")   // after ved-xlwx
   ```
3. **Monitor via Agent Mail**: Track progress, handle blockers
4. **Quality Gate**: Run after each track completes
5. **Close Epic**: When all beads closed + quality gates pass

### For Manual Execution

```bash
# View epic status
bv --robot-triage --graph-root ved-fz9m

# List beads
beads list --status open --epic ved-fz9m

# Start working on beads
beads update ved-xlwx --status in_progress
# ... implement ...
beads close ved-xlwx --reason "Package scaffolded, ready for implementation"
```

## 🔗 Related Epics

- **ved-pd8l**: UI Accessibility & Polish (8 beads, 3 tracks) - **PLANNED**
- **ved-fz9m**: Ralph Loop CLI (10 beads, 4 tracks) - **PLANNED** ✅

Both epics ready for parallel execution via orchestrator!

## 📝 Key Learnings Embedded

**cac Command Registration**:
```typescript
cli.command('start <epic-id>', 'Start Ralph Loop')
   .option('--max-iter <number>', 'Max iterations', { default: 30 })
   .action(async (epicId, options) => { /* impl */ });
```

**Spawn Pattern (cross-platform)**:
```typescript
const cmd = process.platform === 'win32' ? 'beads.exe' : 'bd';
spawn(cmd, ['sync', '--no-daemon'], { stdio: 'inherit' });
```

**Completion Detection**:
```typescript
const output = await readFile('.ralph-output.md', 'utf-8');
if (output.includes('<promise>EPIC_COMPLETE</promise>')) { /* done */ }
```

**Graceful Shutdown**:
```typescript
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});
```

---

**Status**: 🎯 **PLAN_READY** - Ready for orchestrator to spawn workers!

<promise>PLAN_READY</promise>
