# Monthly Incident Retrospective Template

**Month:** [YYYY-MM]  
**Date:** [First Monday of following month]  
**Attendees:** [Team members]  
**Facilitator:** [Name]

---

## 📊 Monthly Metrics Summary

### Incident Counts
| Severity | Count | Change from Last Month |
|----------|-------|------------------------|
| P0 (Critical) | X | ↑/↓/→ Y |
| P1 (High) | X | ↑/↓/→ Y |
| P2 (Medium) | X | ↑/↓/→ Y |
| **Total** | **X** | **↑/↓/→ Y** |

### MTTR (Mean Time To Recovery)
| Severity | Target | Actual | Met? |
|----------|--------|--------|------|
| P0 | <10 min | X min | ✅/❌ |
| P1 | <30 min | X min | ✅/❌ |
| P2 | <2 hours | X min | ✅/❌ |

### Availability
- **Uptime:** X.XX%
- **Target:** 99.9%
- **SLA Met:** ✅/❌
- **Total Downtime:** X minutes

---

## 🔥 Top 3 Incidents (By Impact)

### 1. [INC-YYYY-MM-DD-NNN]: [Title]
- **Severity:** PX
- **Duration:** X minutes
- **Affected Users:** ~X users
- **Root Cause:** [Brief summary]
- **Key Learnings:** [What did we learn?]
- **Status:** Resolved ✅ | In Progress 🔄

### 2. [INC-YYYY-MM-DD-NNN]: [Title]
- **Severity:** PX
- **Duration:** X minutes
- **Affected Users:** ~X users
- **Root Cause:** [Brief summary]
- **Key Learnings:** [What did we learn?]
- **Status:** Resolved ✅ | In Progress 🔄

### 3. [INC-YYYY-MM-DD-NNN]: [Title]
- **Severity:** PX
- **Duration:** X minutes
- **Affected Users:** ~X users
- **Root Cause:** [Brief summary]
- **Key Learnings:** [What did we learn?]
- **Status:** Resolved ✅ | In Progress 🔄

---

## 📈 Trend Analysis

### Incidents by Category
```
Database: XXXX [▓▓▓▓▓░░░░░] XX%
Authentication: XXXX [▓▓░░░░░░░░] XX%
Performance: XXXX [▓▓▓░░░░░░░] XX%
Infrastructure: XXXX [▓░░░░░░░░░] XX%
External Services: XXXX [▓▓▓▓░░░░░░] XX%
Other: XXXX [▓░░░░░░░░░] XX%
```

### Root Cause Distribution
```
Configuration Error: XXXX [▓▓▓▓▓░░░░░] XX%
Code Bug: XXXX [▓▓▓░░░░░░░] XX%
Capacity Issue: XXXX [▓▓░░░░░░░░] XX%
Human Error: XXXX [▓░░░░░░░░░] XX%
External Dependency: XXXX [▓▓░░░░░░░░] XX%
```

### Incident Frequency by Day of Week
```
Monday:    ▓▓▓▓░░ (X)
Tuesday:   ▓▓▓░░░ (X)
Wednesday: ▓▓░░░░ (X)
Thursday:  ▓▓▓▓▓░ (X)
Friday:    ▓░░░░░ (X)
Saturday:  ░░░░░░ (X)
Sunday:    ░░░░░░ (X)
```
**Insight:** [Are incidents concentrated on deploy days?]

### Incident Frequency by Time of Day
```
00-06: ░░░░░░ (X)
06-12: ▓▓▓░░░ (X)
12-18: ▓▓▓▓▓░ (X) ← Peak user traffic
18-00: ▓▓░░░░ (X)
```
**Insight:** [Do incidents correlate with load?]

---

## 🎯 Action Item Review

### From Last Month's Retrospective
| Bead ID | Action | Owner | Status | Notes |
|---------|--------|-------|--------|-------|
| ved-xxx | [Action 1] | [Name] | ✅ Done | [Impact] |
| ved-xxx | [Action 2] | [Name] | 🔄 In Progress | [Blocker?] |
| ved-xxx | [Action 3] | [Name] | ❌ Not Started | [Why?] |

### Completion Rate
- **Completed:** X/Y (Z%)
- **In Progress:** X/Y (Z%)
- **Not Started:** X/Y (Z%)

**Blocker Analysis:** [Why weren't some items completed?]

---

## ✅ What Went Well

### Wins This Month
1. **[Win 1]**
   - Description: [What happened?]
   - Impact: [How did this help?]
   - Celebrate: [Who should be recognized?]

2. **[Win 2]**
   - Description:
   - Impact:
   - Celebrate:

3. **[Win 3]**
   - Description:
   - Impact:
   - Celebrate:

### Improved Metrics
- [ ] MTTR decreased by X%
- [ ] Fewer P0 incidents (down from X to Y)
- [ ] Faster detection (alert fired within X seconds)
- [ ] Better runbook coverage (all P0/P1 documented)

---

## ❌ What Didn't Go Well

### Pain Points
1. **[Pain Point 1]**
   - Problem: [What went wrong?]
   - Frequency: [How often?]
   - Impact: [Severity?]
   - Why: [Root cause?]

2. **[Pain Point 2]**
   - Problem:
   - Frequency:
   - Impact:
   - Why:

3. **[Pain Point 3]**
   - Problem:
   - Frequency:
   - Impact:
   - Why:

### Degraded Metrics
- [ ] MTTR increased by X%
- [ ] More repeat incidents (same issue X times)
- [ ] Detection gaps (X incidents found by users, not alerts)
- [ ] Runbook gaps (X incidents had no runbook)

---

## 🔄 Repeat Incidents

### Recurring Issues (>1 occurrence this month)
| Issue | Occurrences | Last Fixed | Status |
|-------|-------------|------------|--------|
| [Issue 1] | X times | YYYY-MM-DD | 🔄 Investigating |
| [Issue 2] | X times | YYYY-MM-DD | ❌ Unresolved |
| [Issue 3] | X times | YYYY-MM-DD | ✅ Fixed |

**Analysis:** [Why are these recurring? Are fixes ineffective?]

---

## 📝 Lessons Learned

### Technical Lessons
1. **[Lesson 1]**
   - What we learned: [Insight]
   - How to apply: [Action]

2. **[Lesson 2]**
   - What we learned:
   - How to apply:

### Process Lessons
1. **[Lesson 1]**
   - What we learned:
   - How to apply:

2. **[Lesson 2]**
   - What we learned:
   - How to apply:

### Communication Lessons
1. **[Lesson 1]**
   - What we learned:
   - How to apply:

---

## 🎓 Runbook Effectiveness

### Runbook Usage
| Runbook | Times Used | Success Rate | Needs Update? |
|---------|------------|--------------|---------------|
| P0: Service Down | X | XX% | ✅/❌ |
| P0: Database Failure | X | XX% | ✅/❌ |
| P0: Memory Leak | X | XX% | ✅/❌ |
| P1: Login Failure | X | XX% | ✅/❌ |
| P1: Payment Failure | X | XX% | ✅/❌ |
| P1: Slow Queries | X | XX% | ✅/❌ |

### Missing Runbooks
- [ ] [New scenario 1] → Create ved-xxx
- [ ] [New scenario 2] → Create ved-xxx

### Runbook Improvements Needed
- [ ] [Runbook X] - Add section on [Y]
- [ ] [Runbook Y] - Update command for [Z]

---

## 🚀 Action Items (This Month)

### Preventive Measures
| Priority | Action | Owner | Due Date | Bead ID |
|----------|--------|-------|----------|---------|
| P0 | [Critical fix] | [Name] | YYYY-MM-DD | ved-xxx |
| P1 | [Important improvement] | [Name] | YYYY-MM-DD | ved-xxx |
| P2 | [Nice to have] | [Name] | YYYY-MM-DD | ved-xxx |

### Monitoring Enhancements
- [ ] Add alert for [X]
- [ ] Improve dashboard to show [Y]
- [ ] Set up synthetic monitoring for [Z]

### Process Improvements
- [ ] Update incident response workflow
- [ ] Add new runbook for [X]
- [ ] Improve escalation path for [Y]

### Training Needs
- [ ] Team training on [X]
- [ ] Update documentation for [Y]
- [ ] Disaster recovery drill for [Z]

---

## 🎯 Goals for Next Month

### Metric Targets
- [ ] Reduce MTTR to <X minutes (P0)
- [ ] Zero P0 incidents
- [ ] <X P1 incidents
- [ ] 99.9%+ uptime

### Process Targets
- [ ] 100% runbook coverage for all incident types
- [ ] 100% of incidents have follow-up beads created
- [ ] 100% of P0/P1 incidents have RCA documents

### Improvement Targets
- [ ] Complete X% of action items from last month
- [ ] Run 1 disaster recovery drill
- [ ] Update all runbooks based on learnings

---

## 📅 Next Review

**Date:** [First Monday of next month]  
**Facilitator:** [Name]  
**Agenda:**
1. Review metrics dashboard
2. Discuss top 3 incidents
3. Review action item completion
4. Identify new patterns
5. Plan preventive measures

---

## 📎 Appendix

### Detailed Incident List
*(Link to INCIDENTS.md section for this month)*

### RCA Documents
- [INC-YYYY-MM-DD-NNN RCA](../incidents/YYYY-MM-DD-001-rca.md)
- [INC-YYYY-MM-DD-NNN RCA](../incidents/YYYY-MM-DD-002-rca.md)

### Monitoring Dashboards
- [Grafana: Incident Overview](http://103.54.153.248:3001)
- [Uptime Kuma: Service Status](http://103.54.153.248:3000)

### Related Documentation
- [Incident Response Process](../DEPLOYMENT_RUNBOOK.md)
- [Runbooks Directory](../runbooks/)
- [Quality Gates](../QUALITY_GATE_STANDARDS.md)

---

**Retrospective Completed:** ✅  
**Minutes Published:** [Link]  
**Action Items Tracked:** beads list --title-contains "Retrospective"
