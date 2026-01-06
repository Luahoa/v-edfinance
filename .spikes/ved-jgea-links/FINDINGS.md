# Spike 3 Findings: Link Checker Automation

**Epic**: ved-jgea (Documentation Restructuring)  
**Agent**: RedStone  
**Date**: 2026-01-06  
**Time-box**: 15 minutes  

---

## Question
**Can we automate broken link detection for documentation moves?**

## Answer
**YES** ✅ - Automated link checking is feasible and recommended.

---

## Tool Evaluated

### markdown-link-check
- **Version**: 3.14.2
- **Installation**: `pnpm add -D -w markdown-link-check`
- **Type**: CLI tool + Node.js library
- **License**: ISC (permissive)

---

## Test Results

### Accuracy
- ✅ Detects relative links (`../history/file.md`)
- ✅ Detects absolute file:// links
- ✅ Detects external HTTP/HTTPS links
- ✅ Validates link targets exist
- ⚠️ Does NOT validate anchor links (`#section`) within files

### Performance Metrics

| Metric | Value |
|--------|-------|
| **Single file** | ~1.6 seconds |
| **10 files** | ~16 seconds |
| **Estimated 119 docs** | ~3-4 minutes |

**Extrapolation**: Full docs/ scan (~119 .md files) = **3-4 minutes**

### Sample Output
```
FILE: docs/RALPH_IMPLEMENTATION_SUMMARY.md
  [✓] ../history/ui-accessibility-improvement/discovery.md
  [✓] ../history/ui-accessibility-improvement/approach.md
  [✓] ../history/ui-accessibility-improvement/execution-plan.md
  3 links checked.
```

---

## Recommended Approach for Track 1

### Pre-Move Phase
```bash
# Establish baseline (before any moves)
npx markdown-link-check docs/**/*.md > .spikes/ved-jgea-links/baseline-before.log
```

### Post-Move Validation
```bash
# After each directory move
npx markdown-link-check docs/**/*.md > .spikes/ved-jgea-links/post-move.log
npx markdown-link-check runbooks/**/*.md >> .spikes/ved-jgea-links/post-move.log

# Compare with baseline
diff baseline-before.log post-move.log
```

### Integration Options

#### Option 1: npm script (Recommended)
```json
// package.json
{
  "scripts": {
    "check:links": "markdown-link-check docs/**/*.md runbooks/**/*.md patterns/**/*.md",
    "check:links:json": "markdown-link-check --json docs/**/*.md > link-check-report.json"
  }
}
```

#### Option 2: Pre-commit hook
```bash
# .husky/pre-commit
npx markdown-link-check $(git diff --cached --name-only --diff-filter=AM | grep '\.md$')
```

#### Option 3: Batch script (Windows-friendly)
Created: `.spikes/ved-jgea-links/link-checker.bat`
- Scans target directory recursively
- Counts files, links, and errors
- Exits with code 1 if broken links found

---

## Limitations Found

1. **Anchor validation**: Does NOT check `#section` fragments
2. **Performance**: Slow on large repos (1.6s per file)
3. **Windows paths**: Requires careful escaping in scripts
4. **GitHub-specific**: Cannot validate GitHub Wiki links

### Workarounds
- For anchors: Use `remark-validate-links` (alternative tool)
- For speed: Run only on changed files (git diff)
- For CI/CD: Use GitHub Action `gaurav-nelson/github-action-markdown-link-check`

---

## Implementation Plan for ved-jgea

### Track 1: Move Documentation
1. **Before starting**: Run full baseline scan → save to `.spikes/ved-jgea-links/baseline.log`
2. **After each move**: Run incremental scan on affected directories
3. **Final validation**: Run full scan → compare with baseline
4. **Gate**: MUST show 0 new broken links to merge

### Automation Script
Use provided `.spikes/ved-jgea-links/link-checker.bat`:
```bash
# Check specific directory
link-checker.bat docs

# Check all affected directories
link-checker.bat docs
link-checker.bat runbooks
link-checker.bat patterns
```

### CI Integration (Future)
```yaml
# .github/workflows/docs-check.yml
name: Docs Link Check
on: [pull_request]
jobs:
  link-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          config-file: '.markdown-link-check.json'
```

---

## Cost-Benefit Analysis

### Benefits
- ✅ Catch broken links before merge
- ✅ Prevent user frustration (404 documentation)
- ✅ Automated validation (no manual clicking)
- ✅ Clear pass/fail criteria for PRs

### Costs
- ⏱️ 3-4 minutes per full scan (acceptable for 119 files)
- 💾 +34 packages (markdown-link-check + deps)
- 🛠️ Setup time: ~5 minutes

**ROI**: High - Time saved in manual verification > setup cost

---

## Decision Matrix

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| **Accuracy** | 4/5 | Misses anchor validation |
| **Performance** | 3/5 | Slow but acceptable |
| **Ease of use** | 5/5 | Simple CLI, clear output |
| **Integration** | 5/5 | npm script + CI ready |
| **Maintenance** | 5/5 | Widely used, active project |

**Overall**: ⭐⭐⭐⭐ (4.2/5) - **Recommended for adoption**

---

## Next Steps

1. ✅ Install: `pnpm add -D -w markdown-link-check` (DONE)
2. ✅ Create baseline script (DONE - `link-checker.bat`)
3. ⏭️ Add to package.json scripts
4. ⏭️ Document in Track 1 execution plan
5. ⏭️ Run baseline before first move
6. ⏭️ (Optional) Add to CI/CD pipeline

---

## Files Created
- `.spikes/ved-jgea-links/link-checker.bat` - Automated scanning script
- `.spikes/ved-jgea-links/FINDINGS.md` - This document

## References
- [markdown-link-check](https://github.com/tcort/markdown-link-check)
- [GitHub Action](https://github.com/marketplace/actions/markdown-link-check)
- [Alternative: remark-validate-links](https://github.com/remarkjs/remark-validate-links)
