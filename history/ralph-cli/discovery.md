# Discovery Report: Ralph Loop CLI

## Architecture Snapshot

**Relevant packages:**
- `libs/claudekit-cli` - Existing CLI using `cac` + `@clack/prompts` + Bun
- `scripts/` - Various bash/PowerShell/TypeScript scripts
- `beads/npm-package` - Beads binary wrapper pattern
- Root `package.json` - Centralized scripts with turbo

**Key modules:**
- `libs/claudekit-cli/src/index.ts` - CLI entry point with cac framework
- `libs/claudekit-cli/src/cli/command-registry.ts` - Command registration pattern
- `beads/npm-package/bin/bd.js` - Cross-platform binary wrapper
- `scripts/amphitheatre-vps-deploy.ts` - Agent-based orchestrator pattern

**Entry points:**
- CLI: `bin/ck.js` → `src/index.ts`
- Scripts: `tsx scripts/*.ts` or direct bash/PowerShell

## Existing Patterns

### 1. **Modern CLI Framework (claudekit-cli)** ✅
**Location**: `libs/claudekit-cli/`
**Stack**: 
- `cac` v6.7.14 - Command-line argument parsing
- `@clack/prompts` v0.7.0 - Interactive prompts with modern UX
- `ora` v8.0.0 - Elegant terminal spinners
- `picocolors` v1.1.1 - Terminal colors
- Bun runtime for fast execution

**Pattern**:
```typescript
// src/index.ts
const cli = createCliInstance();
registerCommands(cli);
registerGlobalFlags(cli);
await cli.runMatchedCommand();

// Command registration
cli.command('create [name]', 'Create new project')
   .option('--template <template>', 'Template to use')
   .action(async (name, options) => { ... });
```

**Benefits**:
- Type-safe with TypeScript
- Interactive prompts with @clack/prompts
- Beautiful spinner animations
- JSON output mode for scripting
- Verbose logging support

### 2. **Binary Wrapper Pattern (beads)** ✅
**Location**: `beads/npm-package/bin/bd.js`
**Pattern**:
```javascript
// Platform detection
const platform = process.platform;
const arch = process.arch;

// Execute native binary
const beadsBinary = path.join(__dirname, `../bin/${platform}-${arch}/bd`);
spawn(beadsBinary, process.argv.slice(2), { stdio: 'inherit' });
```

**Benefits**:
- Cross-platform (Windows/Linux/Mac)
- Native binary performance
- NPM installable

### 3. **Agent-Based Orchestrator** ✅
**Location**: `scripts/amphitheatre-vps-deploy.ts`
**Pattern**:
```typescript
class DeployCommander {
  async execute() {
    await this.planPhase();
    await this.verifyPhase();
    await this.deployPhase();
  }
}

const commander = new DeployCommander();
await commander.execute();
```

### 4. **Simple Script Pattern** ✅
**Location**: `scripts/*.js`, `scripts/*.ts`
**Pattern**:
```javascript
// process.argv manual parsing
const args = process.argv.slice(2);
const epicId = args[0] || 'default';
```

## Technical Constraints

**Runtime requirements**:
- Bun >=1.3.2 (preferred for speed)
- Node.js >=18.0.0 (fallback)
- pnpm 9.15.0 (workspace manager)

**Build requirements**:
- TypeScript 5.7.2
- Bun build for compilation
- Cross-platform support (Windows/Linux/Mac)

**Dependencies available**:
- `cac` - Already in claudekit-cli
- `@clack/prompts` - Already in claudekit-cli
- `ora` - Already in claudekit-cli
- `picocolors` - Already in claudekit-cli
- `tsx` - Available in devDependencies

## Ralph Loop Requirements

**Current implementation**:
- Windows: `START_RALPH_LOOP.bat` (batch script)
- Linux: `.agents/scripts/ralph-loop.sh` (bash script)
- Manual execution only
- Hard to configure

**Desired CLI interface**:
```bash
# Simple start
ralph start ved-pd8l

# With options
ralph start ved-pd8l --max-iter 50 --workers 5 --verbose

# List epics
ralph list --status in-progress

# Monitor progress
ralph status ved-pd8l

# Resume
ralph resume ved-pd8l
```

## Naming Conventions

**CLI tool name**: `ralph` (short, memorable)
**Package name**: `@v-edfinance/ralph-cli` or `ralph-loop-cli`
**Binary name**: `ralph` (similar to `bd`, `bv`, `ck`)

**Command pattern** (verb-noun):
- `ralph start <epic-id>` - Start loop
- `ralph stop <epic-id>` - Stop loop
- `ralph status <epic-id>` - View status
- `ralph list` - List epics
- `ralph resume <epic-id>` - Resume stopped loop
- `ralph logs <epic-id>` - View logs

## External References

**CLI frameworks comparison**:
- ✅ **cac** - Lightweight, already in use, good TypeScript support
- ❌ commander.js - More verbose, not needed
- ❌ yargs - Heavy, complex API

**Interactive prompts**:
- ✅ **@clack/prompts** - Modern, beautiful, already in use
- ❌ inquirer - Older style
- ❌ prompts - Less features

**Similar CLIs for reference**:
- `bd` (beads) - Task management
- `bv` (beads viewer) - Visualization
- `ck` (claudekit) - Project scaffolding
- `turbo` - Monorepo task runner

## Risk Assessment

| Component | Risk | Reason | Verification |
|-----------|------|--------|--------------|
| Use cac framework | **LOW** | Already in claudekit-cli, proven | Copy pattern |
| Cross-platform binary | **MEDIUM** | Need to compile for 3 platforms | Bun compile tested with ck |
| Integration with beads | **LOW** | Already using bd commands | Test bd sync |
| Quality gate integration | **LOW** | Scripts already exist | Test quality-gate.sh |
| Orchestrator spawning | **MEDIUM** | Need to integrate Task() tool | Spike needed |

## Recommended Approach

**Option 1: Extend claudekit-cli** ❌
- Add ralph commands to existing CLI
- Reuse infrastructure
- **Con**: Mixes concerns (project scaffolding vs loop automation)

**Option 2: Standalone ralph CLI** ✅
- New package: `libs/ralph-cli/`
- Copy proven patterns from claudekit-cli
- Independent versioning
- **Pro**: Clean separation, focused tool

**Option 3: Simple wrapper scripts** ❌
- Keep bash/bat scripts
- Add node.js wrapper for args
- **Con**: No interactive prompts, poor UX

## File Structure Proposal

```
libs/ralph-cli/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # CLI entry point
│   ├── cli/
│   │   ├── cli-config.ts     # cac setup
│   │   └── commands/
│   │       ├── start.ts      # ralph start
│   │       ├── stop.ts       # ralph stop
│   │       ├── status.ts     # ralph status
│   │       ├── list.ts       # ralph list
│   │       └── resume.ts     # ralph resume
│   ├── core/
│   │   ├── loop-engine.ts    # Main loop logic
│   │   ├── beads-client.ts   # bd/bv wrapper
│   │   ├── quality-gate.ts   # QG integration
│   │   └── orchestrator.ts   # Worker spawning
│   ├── utils/
│   │   ├── logger.ts         # Logging
│   │   └── config.ts         # Config management
│   └── types/
│       └── index.ts          # TypeScript types
├── bin/
│   └── ralph.js              # Shebang wrapper
└── scripts/
    └── build-binaries.js     # Cross-platform build
```

## Quality Standards (from AGENTS.md)

- ✅ TypeScript strict mode
- ✅ No `any` types
- ✅ Bun runtime preferred
- ✅ Cross-platform (Windows/Linux/Mac)
- ✅ Interactive UX with @clack/prompts
- ✅ JSON output mode for scripting
- ✅ Verbose logging support
- ✅ Error handling with exit codes
- ✅ SIGINT/SIGTERM graceful shutdown
