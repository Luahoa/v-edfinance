# Epic Completion Hook - Knowledge Documentation

**Purpose**: Automatically extract and document knowledge after epic completion

## When to Trigger

- ✅ After closing any epic with `bd close <epic-id>`
- ✅ After quality gates pass
- ✅ When significant patterns/decisions were made
- ✅ Manual: Ask agent to "document epic ved-xxxx"

## Hook Integration Points

### Option 1: Manual Trigger (Recommended for now)
```markdown
After epic complete, ask agent:
"Document epic ved-xxxx using the knowledge skill"
```

### Option 2: Ralph CLI Integration (Future)
Add to `loop-engine.ts` after epic completion:
```typescript
if (isComplete) {
  logger.info('Running knowledge documentation...');
  // Spawn knowledge extraction task
  await this.extractKnowledge(epicId);
}
```

### Option 3: Beads Hook (Future)
Create `.beads/hooks/on-epic-close.js`:
```javascript
module.exports = async (epicId) => {
  console.log(`Epic ${epicId} closed - triggering knowledge extraction`);
  // Call Amp API to spawn knowledge skill
};
```

## Usage Pattern

### For Epic Just Completed
```bash
# Step 1: Ask agent
"Document epic ved-jgea using the knowledge skill"

# Agent will:
# 1. Find threads for epic ved-jgea
# 2. Extract topics, decisions, changes
# 3. Verify against code
# 4. Update AGENTS.md, docs/, skills/
```

### For Time-Based Documentation
```bash
# Document last 2 weeks
"Sync documentation for work from last 2 weeks"

# Document specific topic
"Document all authentication work from last month"
```

## Skill Invocation

The agent should:

1. **Load skill**:
   ```
   /skill knowledge
   ```

2. **Follow pipeline**:
   - Phase 1: Discover threads (find_thread)
   - Phase 2: Extract topics (Task + read_thread)
   - Phase 3: Verify against code (finder, Grep)
   - Phase 4: Map to docs (Read, Grep)
   - Phase 5: Reconcile (oracle)
   - Phase 6: Apply updates (edit_file, mermaid)

## Example: Document ved-jgea Epic

**Input**: "Document epic ved-jgea"

**Expected Output**:
- Updated `AGENTS.md` with:
  - New VPS Toolkit section
  - Ralph CLI orchestrator pattern
  - Spike workflow best practices
- Updated `docs/behavioral-design/` with code citations
- New `docs/ved-jgea-lessons-learned.md`
- Mermaid diagrams for:
  - Orchestrator workflow
  - Track dependencies

## Quality Checklist

After knowledge extraction:
- [ ] Topics verified against current code (not hallucinated)
- [ ] AGENTS.md updated with new patterns
- [ ] Diagrams have file citations
- [ ] Existing doc structure preserved
- [ ] Terminology matches codebase

## Frequency Recommendations

| Scenario | Frequency |
|----------|-----------|
| Major epic (>10 beads) | After completion |
| Minor epic (<5 beads) | Optional |
| Monthly sync | Every 4 weeks |
| Pre-handoff | Before session end |

## Benefits

1. **Prevents knowledge loss** - Threads → persistent docs
2. **Reduces onboarding time** - New agents read AGENTS.md
3. **Catches doc drift** - Code vs docs comparison
4. **Documents decisions** - Why, not just what
5. **Creates audit trail** - Epic → documentation link

---

**Next Step**: Test with epic ved-jgea to validate workflow
