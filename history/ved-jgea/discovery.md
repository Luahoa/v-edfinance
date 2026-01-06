# Discovery Report: Comprehensive Project Cleanup (ved-jgea)

**Generated**: 2026-01-06  
**Epic**: ved-jgea - EPIC: Comprehensive Project Cleanup

---

## Architecture Snapshot

### Relevant Packages
- **apps/api** - NestJS backend (Prisma, TypeScript strict mode)
- **apps/web** - Next.js 15.1.2 frontend
- **prisma/** - Database schema and seed files
- **scripts/** - Quality gate scripts, test runners
- **docs/** - Project documentation (currently scattered)
- **Root directory** - 201 files (target: 15-25 files)

### Key Modules
- **Prisma Client Generation** - `apps/api/prisma/schema.prisma`
- **TypeScript Build** - `apps/api/tsconfig.json` (strict mode enabled)
- **Quality Gates** - `scripts/quality-gate-ultra-fast.bat`
- **Beads System** - `.beads/issues.jsonl` (373 tracked issues)
- **Documentation** - Multiple scattered SPEC, AUDIT, SESSION files

### Entry Points
- API Build: `pnpm --filter api build`
- Web Build: `pnpm --filter web build`
- Prisma Generate: `npx prisma generate` (in apps/api)
- Quality Gate: `scripts\quality-gate-ultra-fast.bat`

---

## Existing Patterns

### Similar Implementation: Documentation Cleanup
**Pattern found**: Previous cleanup in `.beads/issues.jsonl` shows completed tasks:
- ved-3ize: Task 6: Move SESSION reports to archive (closed)
- ved-4fo5: Task 5: Move WAVE reports to archive (closed)
- ved-8ib3: Task 4: Create archive directory structure (closed)

**Reusable utilities**:
- Archive directory structure: `archive/2026-01/` pattern
- File categorization via beads labels: `[cleanup]`
- Batch move operations tracked via beads

### Naming Conventions
- Epic beads: `ved-XXXX` format with `[epic]` type
- Sub-tasks: Use discovered beads pattern from epic
- File organization: `history/<feature>/` for planning docs

---

## Technical Constraints

### Node Version
- **Required**: Node.js (inferred from pnpm usage)
- **Package Manager**: pnpm (workspace monorepo)

### Key Dependencies
From `package.json` (root and apps/api):
- **Prisma**: v5.22.0 (schema generation critical)
- **TypeScript**: Strict mode enabled (no `any` types allowed)
- **NestJS**: Backend framework
- **Next.js**: 15.1.2 frontend

### Build Requirements
- **Prisma Generate**: Must run before TypeScript build
- **TypeScript Compilation**: 188 errors currently blocking build
- **Quality Gates**: Ultra-fast script validates Ralph CLI, Git, Package config

---

## External References

### Prisma Schema Issues (Current Blockers)

**Missing Exports** (identified from build output):
- `ChatRole`, `LessonType`, `Level`, `ProgressStatus`, `Role`
- `QuestionType`, `BuddyGroupType`, `PostType`, `RelationStatus`, `BuddyRole`
- `Prisma.DbNull`, `Prisma.InputJsonValue`
- `Prisma.PrismaClientKnownRequestError`

**Root Cause**: Enum or model definitions missing from `schema.prisma` or not generated correctly.

### Documentation Patterns
From existing cleanup tasks (ved-jgea discovered beads):
- Extract patterns: Nudge Theory, Hooked Model, Gamification
- Create structure: `docs/` reorganization
- Move reports: DevOps, Testing, Database, Beads documentation

---

## Risk Map (Preliminary)

| Component                | Current State      | Risk Level | Blocker         |
| ------------------------ | ------------------ | ---------- | --------------- |
| Prisma Schema Drift      | 188 TS errors      | **HIGH**   | Build failure   |
| Documentation Move       | 16 open beads      | **LOW**    | File conflicts  |
| VPS Deployment           | 2 in_progress      | **HIGH**   | External infra  |
| Pgvector Extension       | 1 in_progress      | **MEDIUM** | DB permissions  |
| Test Suite Verification  | Unknown            | **MEDIUM** | May reveal bugs |
| Quality Gate Integration | Already passing    | **LOW**    | Stable          |

---

## Constraints Summary

### Hard Constraints
1. **TypeScript Strict Mode**: No `any` types allowed (per AGENTS.md)
2. **Prisma Client Regeneration**: Required before any build
3. **File Scope Isolation**: Tracks must not overlap to allow parallel work
4. **Beads Sync**: Must use `--no-daemon` flag to avoid git lock conflicts

### Soft Constraints
1. **Documentation Moves**: Can be done in any order (LOW risk)
2. **Pattern Extraction**: Depends on docs being in final location
3. **VPS Deployment**: External dependency (may block independently)

---

## Discovery Tools Used

- `beads.exe list` - Identified 373 tracked issues, 147 open
- `beads.exe show ved-jgea` - Found 22 discovered sub-beads
- `pnpm --filter api build` - Identified 188 TypeScript errors
- `npx prisma generate` - Validated Prisma client generation works
- `finder` tool - Analyzed execution plan gaps

---

## Next Steps

1. **Synthesis Phase**: Oracle to create detailed approach document
2. **Risk Verification**: Create spikes for HIGH risk items (Prisma schema, VPS deploy)
3. **Decomposition**: Convert 22 discovered beads into proper bead files with file scopes
4. **Track Assignment**: Define non-overlapping file scopes for parallel execution
