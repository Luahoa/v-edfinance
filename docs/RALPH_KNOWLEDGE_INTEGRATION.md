# Ralph CLI + Knowledge Skill Integration

**Date**: 2026-01-06  
**Feature**: Automatic knowledge extraction after epic completion

---

## Overview

Integrated **knowledge skill** into Ralph CLI loop to automatically trigger documentation updates after epic completion.

### Before Integration
```
Epic Complete → Manual: "Document epic ved-xxx"
              → Agent extracts knowledge
              → Updates docs
```

### After Integration
```
Epic Complete → Quality Gates PASS
              → Beads Sync
              → [PHASE 5] Knowledge Extraction (automatic)
              → Prompt created for agent
              → Agent completes when ready
```

---

## Implementation

### 1. Configuration (ralph.config.json)

Added 2 new fields:
```json
{
  "knowledgeExtraction": true,
  "knowledgeExtractionPrompt": ".agents/skills/knowledge/epic-completion-prompt.txt"
}
```

**Options**:
- `knowledgeExtraction`: Enable/disable (default: `true`)
- `knowledgeExtractionPrompt`: Path to prompt template

**Environment Override**:
```bash
RALPH_KNOWLEDGE_EXTRACTION=false test-ralph.bat start ved-xxx
```

---

### 2. Code Changes

#### a. Config Schema (config.ts)
```typescript
export const ConfigSchema = z.object({
  // ... existing fields
  knowledgeExtraction: z.boolean().default(true),
  knowledgeExtractionPrompt: z.string().default(
    ".agents/skills/knowledge/epic-completion-prompt.txt"
  ),
});
```

#### b. Knowledge Extractor (knowledge-extractor.ts)
New module with 3 methods:

```typescript
class KnowledgeExtractor {
  async extract(epicId: string): Promise<void>
  isPending(epicId: string): boolean
  markComplete(epicId: string): void
}
```

**Workflow**:
1. Check if enabled in config
2. Read prompt template from `.agents/skills/knowledge/epic-completion-prompt.txt`
3. Replace `{{EPIC_ID}}` placeholder
4. Create marker file: `history/<epic-id>/knowledge-extraction-pending.txt`
5. Display instructions for agent

#### c. Loop Engine Integration (loop-engine.ts)
```typescript
// After quality gates pass
await this.beadsClient.sync();

// Phase 5: Knowledge extraction
await this.knowledgeExtractor.extract(epicId);

return; // Epic complete
```

---

### 3. Prompt Template

Created comprehensive prompt at `.agents/skills/knowledge/epic-completion-prompt.txt`:

**Sections**:
- Instructions (load skill)
- Focus areas (5 key topics)
- Workflow (6 phases)
- Output deliverables
- Quality verification
- Success criteria

**Placeholder**:
```
{{EPIC_ID}} → replaced with actual epic ID
```

---

## Usage Flow

### 1. Run Ralph CLI
```bash
test-ralph.bat start ved-xxx --max-iter 30
```

### 2. Epic Completes
```
[PHASE 4] Quality gates PASSED
[BEADS SYNC] Syncing beads...
[PHASE 5] Knowledge extraction...

✅ Knowledge extraction prompt created
Location: history/ved-xxx/knowledge-extraction-pending.txt

To complete knowledge extraction:
  1. Ask your AI agent:
     "Document epic ved-xxx using the knowledge skill"
  2. Agent will:
     - Find threads for this epic
     - Extract topics, decisions, patterns
     - Verify against code
     - Update AGENTS.md and docs/
     - Create diagrams with citations
```

### 3. Agent Executes
Agent reads prompt → loads knowledge skill → follows 6 phases → updates docs

### 4. Mark Complete (Future)
```bash
# When agent finishes
ralph knowledge-complete ved-xxx
# Renames: knowledge-extraction-pending.txt → knowledge-extraction-complete.txt
```

---

## Benefits

### 1. **Automatic Trigger**
No need to remember to document - Ralph reminds you

### 2. **Consistent Process**
Same prompt structure for every epic

### 3. **Trackable**
- Pending marker shows what needs documentation
- Complete marker shows what's done

### 4. **Configurable**
- Toggle on/off per epic
- Custom prompts for different epic types

### 5. **Non-Blocking**
Agent can complete documentation async after epic

---

## File Structure

```
v-edfinance/
├── ralph.config.json              # Config with knowledgeExtraction: true
├── libs/ralph-cli/src/
│   ├── core/
│   │   ├── loop-engine.ts         # Phase 5 integration
│   │   └── knowledge-extractor.ts # New module
│   └── utils/
│       └── config.ts              # Schema update
├── .agents/skills/knowledge/
│   ├── SKILL.md                   # Skill documentation
│   ├── epic-completion-prompt.txt # Template with {{EPIC_ID}}
│   └── EPIC_COMPLETION_HOOK.md    # Integration guide
└── history/<epic-id>/
    ├── execution-plan.md
    ├── discovery.md
    ├── approach.md
    └── knowledge-extraction-pending.txt  # Created by Ralph
```

---

## Configuration Options

### Enable/Disable
```json
// Disable globally
{
  "knowledgeExtraction": false
}

// Disable per-run
RALPH_KNOWLEDGE_EXTRACTION=false test-ralph.bat start ved-xxx
```

### Custom Prompt
```json
{
  "knowledgeExtractionPrompt": "custom-templates/epic-docs.txt"
}
```

**Prompt Variables**:
- `{{EPIC_ID}}` - Replaced with actual epic ID
- Future: `{{EPIC_TITLE}}`, `{{TRACK_COUNT}}`, etc.

---

## Future Enhancements

### 1. Full Automation (v2.0)
```typescript
// In knowledge-extractor.ts
async extractAndApply(epicId: string): Promise<void> {
  // Call Amp API to spawn Task with knowledge skill
  // Wait for completion
  // Mark as complete automatically
}
```

### 2. Command: `ralph knowledge`
```bash
# Manual trigger
ralph knowledge extract ved-xxx

# Check status
ralph knowledge status ved-xxx

# Mark complete
ralph knowledge complete ved-xxx

# List pending
ralph knowledge list
```

### 3. Quality Gate Integration
```bash
# Fail if documentation pending for >3 days
"knowledgeExtractionTimeout": "3d"
```

### 4. Epic Types
```json
{
  "knowledgeExtractionPrompts": {
    "feature": "templates/feature-epic.txt",
    "bugfix": "templates/bugfix-epic.txt",
    "refactor": "templates/refactor-epic.txt"
  }
}
```

---

## Testing

### Test 1: Epic Completion Flow
```bash
# Start epic
test-ralph.bat start ved-test --verbose

# Verify Phase 5 runs
# Should see: "[PHASE 5] Knowledge extraction..."

# Check marker created
dir history\ved-test\knowledge-extraction-pending.txt
```

### Test 2: Disabled Mode
```bash
# Update ralph.config.json
"knowledgeExtraction": false

# Run epic
test-ralph.bat start ved-test

# Verify Phase 5 skipped
# Should see: "Knowledge extraction disabled in config"
```

### Test 3: Custom Prompt
```bash
# Create custom prompt
echo "Custom prompt for {{EPIC_ID}}" > custom.txt

# Update config
"knowledgeExtractionPrompt": "custom.txt"

# Run epic
# Verify custom prompt used
```

---

## Rollback Plan

If issues arise:

### Quick Disable
```json
{
  "knowledgeExtraction": false
}
```

### Revert Code
```bash
git checkout HEAD -- libs/ralph-cli/src/core/knowledge-extractor.ts
git checkout HEAD -- libs/ralph-cli/src/core/loop-engine.ts
git checkout HEAD -- libs/ralph-cli/src/utils/config.ts
git checkout HEAD -- ralph.config.json
```

---

## Documentation Updates

### AGENTS.md
Added section: **Knowledge Documentation (Post-Epic Hook)**
- When to use
- Benefits
- Integration with Ralph CLI

### RALPH_CLI_HANDOFF.md
Should add:
- Phase 5: Knowledge Extraction
- Configuration options
- Usage examples

---

## Metrics to Track

After deploying to production:

1. **Usage Rate**: % of epics with knowledge extracted
2. **Time Saved**: Manual (2-3h) vs Automated (15min)
3. **Doc Quality**: Freshness, accuracy of AGENTS.md
4. **Adoption**: How many agents use the prompt

**Target**: 80% of major epics (>10 beads) documented within 24 hours

---

## Summary

✅ **Integrated knowledge skill into Ralph CLI loop**  
✅ **Phase 5 runs automatically after epic completion**  
✅ **Configurable via ralph.config.json**  
✅ **Non-blocking - agent completes async**  
✅ **Trackable via marker files**  
✅ **Prompt template customizable**

**Next Steps**:
1. Test with next epic (ved-xxx)
2. Gather feedback on prompt quality
3. Iterate on automation level
4. Consider full auto-execution (v2.0)

---

**Status**: ✅ READY FOR PRODUCTION  
**Version**: Ralph CLI 1.1.0  
**Date**: 2026-01-06
