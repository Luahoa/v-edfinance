# Anti-Hallucination System (AHS) - PRD & Technical Spec

## 1. Problem Statement
In a codebase generated 100% by AI agents, "hallucinations" (non-existent APIs, schema drift, or logic gaps) are the primary risk. The AHS ensures that every AI-generated output or logic step is validated against the **Source of Truth** (Prisma Schema, Types, and Existing Modules).

## 2. Core Pillars
### A. Structural Integrity (Schema Guard)
- **Problem**: Agent assumes a field exists in JSONB or a table that doesn't.
- **Solution**: Centralized `ValidationService` using Zod schemas for all JSONB fields (`metadata`, `payload`, `content`).

### B. Logic Cross-Referencing (Reference Guard)
- **Problem**: Agent calls a service method that was renamed or deleted.
- **Solution**: Automated `DiagnosticHub` checks that verify inter-module dependencies before any "Agent-to-Main" merge.

### C. Multi-Step verification (Chain of Thought Guard)
- **Problem**: Agent jumps to a conclusion without verifying the local environment.
- **Solution**: New **Protocol**: Every agent task must start with a `Read` of `AGENTS.md` and `ARCHITECTURE.md` to refresh the context window.

## 3. Technical Implementation Plan

### Phase 1: JSONB Schema Enforcement
- **Tool**: `Zod` + `Prisma Middleware`.
- **Implementation**: Define a `SchemaRegistry` that maps every JSONB field to a Zod schema. Any write operation that fails validation is blocked.

### Phase 2: Diagnostic Verification (Pre-Commit)
- **Tool**: `pnpm build` + `DiagnosticService`.
- **Implementation**: A specific debug endpoint `/api/debug/verify-integrity` that runs a recursive check on all AI-touched files.

### Phase 3: "Grounding" Prompts
- **Standard**: Update `AGENTS.md` to include a "Verification Loop" requirement.
- **Rule**: Agents must cite file paths and line numbers (as I am doing now) to ground their claims in reality.

## 4. Review Checklist for Agents
- [ ] Is every new JSONB field defined in `SchemaRegistry`?
- [ ] Did you run `pnpm --filter api build` to catch type-level hallucinations?
- [ ] Does the new logic conflict with the `ARCHITECTURE.md`?
- [ ] Are all mock data generated following the `DEBUG_SPEC.md`?
