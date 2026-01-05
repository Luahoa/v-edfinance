# Git + Beads Trinity Incident Report
**Date:** 2026-01-05  
**Severity:** P0 (Blocking VPS Deployment)  
**Duration:** 15 minutes (06:30 - 06:45 UTC+7)  
**Status:** Resolved ✅

---

## Incident Summary

Git operations became blocked after merging spike/simplified-nav → main due to beads daemon holding `.beads/daemon.lock` file, preventing git operations from accessing the beads state files.

## Timeline

| Time | Event |
|------|-------|
| 06:20 | Fast-forward merge spike/simplified-nav → main completed (commit f3f2969 → 204d5b1) |
| 06:25 | Git push failed: "Uncommitted changes detected" |
| 06:30 | Created ved-gy30 task for git cleanup (P0 priority) |
| 06:32 | Killed beads daemon (PID 11388), removed daemon.lock |
| 06:35 | Daemon respawned (PID 14532), killed again |
| 06:38 | Added daemon files to .gitignore |
| 06:40 | Committed changes, hit GitHub 100MB file size limit (Install Termius.exe 243MB) |
| 06:42 | Removed large file, amended commit |
| 06:43 | Force pushed to spike/simplified-nav (commit 63db100) |
| 06:45 | Closed ved-gy30, updated agent-mail, final commit (6f63a0e) |

## Root Cause Analysis

### Primary Cause
**Beads daemon auto-start during git operations** - The beads daemon automatically respawned after being killed, creating a race condition where it would re-lock `.beads/daemon.lock` before git operations could complete.

### Contributing Factors
1. **Missing .gitignore entries** - Daemon files were tracked by git, causing conflicts
2. **Large file in repository** - Install Termius.exe (243MB) exceeded GitHub's 100MB limit
3. **Git worktree confusion** - Merge happened in `.git/beads-worktrees/main/` but stash applied to spike/simplified-nav working directory

## Impact

- **Blocked VPS deployment** - Tasks ved-y1u, ved-drx, ved-8yqm were blocked
- **Git state corruption** - 520+ deleted files from merge, conflicted stash
- **Developer time lost** - 15 minutes of unplanned incident response

## Resolution Steps

1. **Immediate:** Killed beads daemon processes (multiple times)
2. **Immediate:** Removed `.beads/daemon.lock` manually
3. **Short-term:** Added daemon files to `.gitignore`
4. **Short-term:** Used `beads sync --no-daemon` for commits
5. **Short-term:** Removed large files before push
6. **Long-term:** Updated AGENTS.md and SPEC.md with prevention protocols

## Prevention Measures

### Added to AGENTS.md
- Beads Trinity Protocol section with critical rules
- Agent-Mail coordination guidelines
- Lessons learned from this incident

### Added to SPEC.md (Section 10.4)
- Git Operations with Beads Integration
- Pre-Merge Checklist
- Agent-Mail Protocol
- Lessons Learned section

### Process Changes
1. **Always use `--no-daemon` flag** when running beads commands during git operations
2. **Pre-merge checklist** includes killing daemon and checking file sizes
3. **P0 beads tasks** for critical git operations
4. **Agent-mail notifications** for blocking operations

## Lessons Learned

### What Went Well ✅
- Beads Trinity protocol enabled transparent coordination
- Ved-hs88 merge succeeded (main now has full apps/api/ codebase)
- Agent-mail notifications kept other agents informed
- Created P0 task ved-gy30 for proper tracking

### What Could Be Improved ⚠️
- Should have added daemon files to .gitignore earlier
- Should have checked for large files before committing
- Need automated pre-commit hook to check file sizes
- Need better documentation about beads daemon behavior

### Action Items
- [x] Update AGENTS.md with Beads Trinity rules
- [x] Update SPEC.md Section 10.4 with git+beads protocols
- [x] Add daemon files to .gitignore
- [ ] Create pre-commit hook to check file sizes (>100MB)
- [ ] Add automated daemon killer script for git operations
- [ ] Document beads daemon respawn behavior

## Related Tasks
- **ved-hs88** - Main merge that triggered the incident
- **ved-gy30** - Git cleanup task (closed)
- **ved-y1u, ved-drx, ved-8yqm** - Unblocked by resolution

## Conclusion

The incident was successfully resolved using Beads Trinity protocol. Documentation has been updated to prevent recurrence. VPS deployment can now proceed.

**Post-Incident Review:** The root cause was identified as beads daemon auto-respawn behavior during git operations. Prevention protocols have been added to both AGENTS.md and SPEC.md to ensure this issue doesn't recur.
