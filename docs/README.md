# V-EdFinance Documentation

> **Last Updated:** 2026-01-09  
> **Version:** 2.0.0

## Quick Navigation

| Category | Description | Key Files |
|----------|-------------|-----------|
| [Getting Started](getting-started/) | Installation, setup, first contribution | [Installation](getting-started/installation.md) |
| [Architecture](architecture/) | System design, frontend/backend patterns | [Overview](architecture/README.md) |
| [Deployment](deployment/) | Production, staging, Dokploy guides | [Checklist](deployment/production-checklist.md) |
| [Database](database/) | Schema, migrations, JSONB patterns | [ERD](database/erd.md) |
| [Behavioral Design](behavioral-design/) | Nudge, Hooked, Gamification | [Overview](behavioral-design/README.md) |
| [Testing](testing/) | E2E, unit tests, coverage | [Guide](testing/README.md) |
| [Operations](operations/) | Runbooks, rollback, monitoring | [Rollback](operations/ROLLBACK_PROCEDURES.md) |
| [Reports](reports/) | Sprint reports, completion summaries | [Latest](reports/) |

---

## Core Documentation Files

### Project Overview
- [AGENTS.md](../AGENTS.md) - AI agent instructions, code style, quality gates
- [README.md](../README.md) - Project introduction and quick start
- [SPEC.md](../SPEC.md) - Full product specification
- [ARCHITECTURE.md](../ARCHITECTURE.md) - High-level system architecture

### Development
- [Code Standards](code-standards.md) - TypeScript, React, naming conventions
- [API Documentation](api/) - REST endpoints, authentication
- [Frontend Guide](guides/FRONTEND_SKILLS_INTEGRATION_GUIDE.md) - UI patterns, accessibility

### Operations
- [Deployment Checklist](deployment/production-checklist.md) - Pre-deploy verification
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
- [Incident Response](guides/incident-retrospective-template.md) - Post-mortem template

---

## Documentation Standards

### File Naming
- Use `kebab-case.md` for all documentation files
- Prefix with category when at root level (e.g., `api-authentication.md`)
- Use `README.md` for directory index files

### Frontmatter
All documentation files should include:

```yaml
---
title: "Document Title"
description: "Brief description for search"
category: "guides|architecture|operations|reference"
lastUpdated: 2026-01-09
version: "1.0.0"
---
```

### Structure Guidelines
1. **One topic per file** - Avoid mega-documents
2. **Link don't duplicate** - Reference other docs instead of copying
3. **Keep current** - Archive outdated docs to `archive/YYYY-MM/`
4. **Add examples** - Code samples for every concept

---

## Directory Structure

```
docs/
├── README.md              # This file - documentation index
├── code-standards.md      # Coding conventions
├── troubleshooting.md     # Common issues and solutions
│
├── getting-started/       # New developer onboarding
│   ├── README.md
│   ├── installation.md
│   ├── development.md
│   └── first-contribution.md
│
├── architecture/          # System design
│   ├── README.md
│   ├── frontend.md
│   ├── backend.md
│   └── deployment.md
│
├── api/                   # API documentation
│   ├── README.md
│   ├── authentication.md
│   └── endpoints.md
│
├── deployment/            # Production deployment
│   ├── README.md
│   ├── production-checklist.md
│   ├── dokploy-setup-guide.md
│   └── service-dependencies.md
│
├── database/              # Database documentation
│   ├── README.md
│   ├── erd.md
│   ├── migration-guide.md
│   └── jsonb-schema-audit.md
│
├── behavioral-design/     # EdTech behavioral patterns
│   ├── README.md
│   ├── nudge-theory.md
│   ├── hooked-model.md
│   └── gamification.md
│
├── testing/               # Testing documentation
│   ├── README.md
│   ├── e2e-testing-guide.md
│   └── test-coverage-plan.md
│
├── operations/            # Ops runbooks
│   ├── README.md
│   ├── DEV_SERVER_GUIDE.md
│   └── ROLLBACK_PROCEDURES.md
│
├── guides/                # How-to guides
│   ├── FRONTEND_SKILLS_INTEGRATION_GUIDE.md
│   └── incident-retrospective-template.md
│
├── reports/               # Sprint/completion reports
│   └── [dated reports]
│
└── archive/               # Deprecated documentation
    ├── 2025-12/
    └── 2026-01/
```

---

## Documentation Quality Checklist

Before merging documentation changes:

- [ ] Frontmatter included with correct metadata
- [ ] Links tested (no 404s)
- [ ] Code examples are functional
- [ ] Screenshots are current
- [ ] Cross-references work
- [ ] Version numbers accurate
- [ ] Added to relevant index files

---

## Archive Policy

Documentation moves to `archive/YYYY-MM/` when:
- Feature is deprecated
- Content superseded by newer docs
- No longer relevant to current codebase

Archive files retain their original filename with date prefix.
