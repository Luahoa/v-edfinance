# 📦 Archive - Historical Documentation

This directory contains archived project documentation organized by date.

---

## 📁 Directory Structure

```
archive/
├── 2025-12/              # December 2025 archives
│   ├── audits/           # Project audit reports
│   ├── session-reports/  # Session handoffs, progress reports
│   ├── test-waves/       # WAVE test reports (WAVE1-5)
│   └── completion-reports/ # Task completion reports (VED-XXX)
│
└── 2026-01/              # January 2026 archives
```

---

## 🗂️ Archive Categories

### 1. Audits (`audits/`)
**Purpose:** Historical project audit reports  
**Contents:**
- Comprehensive project audits
- Infrastructure audits
- Security audits
- Test coverage audits

**Retention:** Keep all audits (reference material)

---

### 2. Session Reports (`session-reports/`)
**Purpose:** Development session documentation  
**Contents:**
- SESSION_HANDOFF_*.md - Session context transfers
- NEW_THREAD_HANDOFF_*.md - Thread handoff documentation
- SESSION_PROGRESS_*.md - Progress reports
- CONTEXT_*.md - Context snapshots

**Retention:** Keep for 6 months, then archive to cold storage

---

### 3. Test Waves (`test-waves/`)
**Purpose:** Historical test campaign reports  
**Contents:**
- WAVE1-5 batch reports
- Controller, service, integration, E2E test reports
- Quality gate reports

**Retention:** Keep for reference (testing patterns)

---

### 4. Completion Reports (`completion-reports/`)
**Purpose:** Task completion documentation  
**Contents:**
- VED-XXX_COMPLETION_REPORT.md
- Feature implementation summaries
- Bug fix reports

**Retention:** Keep until project milestone complete

---

## 📋 Archive Policy

### When to Archive
1. **Session Reports:** Archive after 1 week
2. **Test Reports:** Archive after test wave complete
3. **Audit Reports:** Archive when newer audit exists (keep latest 2)
4. **Completion Reports:** Archive after sprint/milestone complete

### Archiving Process
```bash
# 1. Identify files to archive (older than 1 week)
# 2. Move to appropriate archive subdirectory
# 3. Update any references in active documentation
# 4. Commit with message: "docs: Archive [category] reports"
```

### Retrieval
To find archived documentation:
```bash
# Search by filename
find docs/archive -name "*KEYWORD*"

# Search by content (ripgrep)
rg "search term" docs/archive/

# List by date
ls -lt docs/archive/2025-12/session-reports/
```

---

## 🔗 Related Documentation

- [Project Audit (Latest)](../../PROJECT_AUDIT_2026-01-03.md)
- [Strategic Debt Paydown Plan](../../STRATEGIC_DEBT_PAYDOWN_PLAN.md)
- [Comprehensive Cleanup Plan](../../COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md)

---

**Created:** 2026-01-03  
**Last Updated:** 2026-01-03  
**Maintainer:** Project Lead
