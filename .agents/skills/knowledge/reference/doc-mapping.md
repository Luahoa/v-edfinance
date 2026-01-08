# Documentation Target Mapping (V-EdFinance)

## By Topic Type

| Topic Type | Target Files |
|------------|--------------|
| Architecture | `AGENTS.md`, `ARCHITECTURE.md` |
| Behavioral Design | `docs/behavioral-design/*.md`, `AGENTS.md` (Nudge/Hooked section) |
| Frontend Skills | `docs/FRONTEND_SKILLS_INTEGRATION_GUIDE.md` |
| Backend API | `apps/api/`, `AGENTS.md` (API section) |
| Database | `docs/database/`, `prisma/schema.prisma` |
| Patterns | `.agents/skills/*/SKILL.md` |
| Quick start | `README.md` |
| Testing | `docs/testing/` |
| Deployment | `docs/devops/`, `runbooks/vps-deployment.md` |
| VPS Toolkit | `scripts/vps-toolkit/AGENT_PROTOCOL.md` |
| Beads Workflow | `docs/beads/` |

## By Change Type

| Change | Primary Doc | Secondary |
|--------|-------------|-----------|
| New command | Package AGENTS.md | README.md |
| New hook | SDK AGENTS.md | Skill if pattern |
| Breaking change | MIGRATION.md | Affected AGENTS.md |
| New pattern | Relevant SKILL.md | AGENTS.md |
| Bug fix pattern | TROUBLESHOOTING.md | - |
| Config change | README.md | DEPLOYMENT.md |

## Section Conventions

### AGENTS.md
- Commands table with examples
- Architecture diagrams (mermaid)
- Dependency rules tables
- Quick reference tables

### README.md
- Quick start commands
- Feature lists (brief)
- Installation steps
- Links to detailed docs

### SKILL.md
- When to use section
- Patterns with examples
- Reference tables
- Troubleshooting section
