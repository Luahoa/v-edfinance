# 🎯 Beads Viewer (bv) - Workflow Hiệu Quả cho MVP

**Date:** 2026-01-03  
**Context:** V-EdFinance MVP Launch  
**Tools:** beads (bd) + beads_viewer (bv) + mcp_agent_mail

---

## 📊 BEADS TRINITY ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                   BEADS TRINITY                             │
├─────────────────────────────────────────────────────────────┤
│  beads (bd)        beads_viewer (bv)    mcp_agent_mail     │
│  Task Mgmt         Analytics            Coordination        │
│  (Write)           (Read + AI)          (Messaging)         │
│       │                   │                    │            │
│       └───────────────────┼────────────────────┘            │
│                           ▼                                 │
│              .beads/issues.jsonl                            │
│              Single Source of Truth                         │
└─────────────────────────────────────────────────────────────┘
```

**Vai trò:**
- **bd**: Tạo/cập nhật/đóng tasks (CRUD operations)
- **bv**: Phân tích graph, tính PageRank, phát hiện bottlenecks
- **mcp_agent_mail**: Điều phối nhiều agents (messaging, file locks)

---

## 🚀 WORKFLOW HIỆU QUẢ: 5 BƯỚC

### Bước 1️⃣: Triage (Xác định task tiếp theo)

**Command:** `bv --robot-triage`

**Đây là MEGA-COMMAND** - chạy đầu tiên mỗi session!

```bash
cd "c:\Users\luaho\Demo project\v-edfinance"
bv --robot-triage
```

**Output includes:**
```json
{
  "quick_ref": {
    "total_open": 150,
    "ready_to_work": 45,
    "top_picks": [
      {
        "id": "ved-o1cw",
        "title": "Fix API Build",
        "score": 98.5,
        "reason": "Critical blocker, high PageRank"
      }
    ]
  },
  "recommendations": [...],  // Ranked tasks with scores
  "quick_wins": [...],       // Low effort, high impact
  "blockers_to_clear": [...],// Unblock most downstream work
  "project_health": {...},   // Status/type/priority distribution
  "commands": [              // Copy-paste ready
    "bd update ved-o1cw --status in_progress"
  ]
}
```

**Cách dùng:**
```bash
# Xem quick summary
bv --robot-triage | jq '.quick_ref'

# Lấy task #1 recommend
bv --robot-triage | jq '.recommendations[0]'

# Xem quick wins (làm nhanh, impact cao)
bv --robot-triage | jq '.quick_wins'

# Copy command để claim task
bv --robot-triage | jq '.commands[0]'
```

---

### Bước 2️⃣: Insights (Phân tích sâu graph)

**Command:** `bv --robot-insights`

**Khi nào dùng:**
- Cần biết critical path (đường đi dài nhất)
- Phát hiện circular dependencies (cycles)
- Tìm bottlenecks (tasks block nhiều task khác)

```bash
bv --robot-insights
```

**Output includes:**
```json
{
  "PageRank": {
    "ved-o1cw": 0.085,  // High = Important
    "ved-23r": 0.062
  },
  "Betweenness": {
    "ved-o1cw": 142.5,  // High = Bottleneck
    "ved-5oq": 98.3
  },
  "CriticalPath": {
    "path": ["ved-o1cw", "ved-23r", "deployment"],
    "total_hours": 15
  },
  "Cycles": [],  // MUST be empty! (circular deps = bad)
  "ArticulationPoints": ["ved-o1cw"],  // If removed, graph splits
  "status": {
    "PageRank": {"state": "computed", "elapsed_ms": 45},
    "Betweenness": {"state": "computed", "elapsed_ms": 120}
  }
}
```

**Cách dùng:**
```bash
# Check critical path
bv --robot-insights | jq '.CriticalPath'

# Tìm bottlenecks (high betweenness)
bv --robot-insights | jq '.Betweenness | to_entries | sort_by(.value) | reverse | .[0:5]'

# QUAN TRỌNG: Check cycles (phải = [])
bv --robot-insights | jq '.Cycles'

# Check articulation points (single point of failure)
bv --robot-insights | jq '.ArticulationPoints'
```

**⚠️ LƯU Ý:**
- Phase 2 metrics (PageRank, Betweenness) có timeout 500ms
- Large graphs (>500 nodes) có thể bị "approx" hoặc "skipped"
- Luôn check `.status` để verify metrics đã computed

---

### Bước 3️⃣: Alerts (Phát hiện vấn đề)

**Command:** `bv --robot-alerts`

**Khi nào dùng:**
- Sau khi update nhiều tasks
- Phát hiện tasks bị stale (quá lâu không động)
- Tìm blocking cascades (1 task block cả chuỗi)

```bash
# All alerts
bv --robot-alerts

# Critical only
bv --robot-alerts --severity=critical
```

**Output includes:**
```json
{
  "stale_issues": [
    {
      "id": "ved-xyz",
      "days_since_update": 45,
      "severity": "warning"
    }
  ],
  "blocking_cascades": [
    {
      "blocker": "ved-o1cw",
      "blocked_count": 12,
      "severity": "critical",
      "suggestion": "Prioritize this task immediately"
    }
  ],
  "priority_mismatches": [
    {
      "id": "ved-abc",
      "assigned_priority": 2,
      "calculated_priority": 0,
      "reason": "High PageRank but low priority"
    }
  ]
}
```

**Cách dùng:**
```bash
# Check blocking cascades (1 task block nhiều tasks)
bv --robot-alerts --severity=critical | jq '.blocking_cascades'

# Tìm priority mismatches
bv --robot-alerts | jq '.priority_mismatches'

# Tìm stale issues (>30 days)
bv --robot-alerts | jq '.stale_issues | map(select(.days_since_update > 30))'
```

---

### Bước 4️⃣: Plan (Parallel execution)

**Command:** `bv --robot-plan`

**Khi nào dùng:**
- Cần chia tasks cho nhiều agents
- Tìm tasks có thể làm song song
- Lập execution timeline

```bash
bv --robot-plan
```

**Output includes:**
```json
{
  "plan": {
    "tracks": [
      {
        "track_id": 1,
        "name": "Critical Path",
        "tasks": ["ved-o1cw", "ved-23r", "deployment"],
        "total_hours": 15,
        "dependencies": "sequential"
      },
      {
        "track_id": 2,
        "name": "Independent - Patterns",
        "tasks": ["ved-vzx0", "ved-aww5", "ved-wxc7"],
        "total_hours": 2.25,
        "dependencies": "none",
        "can_parallel": true
      }
    ],
    "summary": {
      "total_tracks": 2,
      "max_parallelization": 2,
      "critical_path_hours": 15,
      "elapsed_time_estimate": "2-3 weeks"
    }
  }
}
```

**Cách dùng:**
```bash
# Xem parallel tracks
bv --robot-plan | jq '.plan.tracks'

# Xem critical path
bv --robot-plan | jq '.plan.tracks[] | select(.name | contains("Critical"))'

# Tìm tasks có thể làm song song
bv --robot-plan | jq '.plan.tracks[] | select(.can_parallel == true)'

# Scope to specific label
bv --robot-plan --label backend
```

---

### Bước 5️⃣: Graph Export (Visualization)

**Command:** `bv --robot-graph`

**Formats:**
- JSON (for processing)
- DOT (Graphviz)
- Mermaid (markdown diagrams)
- HTML (interactive visualization)

```bash
# Export as Mermaid (for docs)
bv --robot-graph --graph-format=mermaid > dependency-graph.mmd

# Export as interactive HTML
bv --export-graph mvp-dependencies.html

# Export as JSON (for scripts)
bv --robot-graph --graph-format=json > graph.json
```

---

## 🎯 WORKFLOW CHO MVP V-EDFINANCE

### Session Start Routine

```bash
# 1. Sync beads từ git
cd "c:\Users\luaho\Demo project\v-edfinance"
git pull --rebase
bd sync

# 2. Chạy triage (MEGA-COMMAND)
bv --robot-triage > triage-output.json

# 3. Xem quick summary
cat triage-output.json | jq '.quick_ref'

# 4. Check critical alerts
bv --robot-alerts --severity=critical

# 5. Lấy top recommendation
cat triage-output.json | jq '.recommendations[0]'

# 6. Claim task
TASK_ID=$(cat triage-output.json | jq -r '.recommendations[0].id')
bd update $TASK_ID --status in_progress

# 7. Xem task details
bd show $TASK_ID
```

---

### Mid-Session Checks

```bash
# Check if task blocks nhiều downstream work
bv --robot-insights | jq '.Betweenness["'$TASK_ID'"]'

# Check critical path còn lại
bv --robot-insights | jq '.CriticalPath'

# Verify no cycles introduced
bv --robot-insights | jq '.Cycles'
```

---

### Session End Routine

```bash
# 1. Close task
bd close $TASK_ID --reason "Completed: <description>"

# 2. Check if unblocked new tasks
bv --robot-triage | jq '.recommendations | map(select(.unblocked_by == "'$TASK_ID'"))'

# 3. Update health check
bv --robot-insights | jq '.status'

# 4. Sync to git
bd sync
git add .beads/
git commit -m "feat: close $TASK_ID"
git push
```

---

## 🔥 QUICK COMMANDS CHO MVP

### Tìm P0 Blockers

```bash
# Method 1: Using bd
bd ready --priority 0

# Method 2: Using bv (with graph analysis)
bv --robot-alerts --severity=critical | jq '.blocking_cascades'
```

---

### Tìm Quick Wins

```bash
bv --robot-triage | jq '.quick_wins | map(select(.estimated_minutes < 30))'
```

---

### Parallel Track Planning

```bash
# Get 2-agent plan
bv --robot-plan | jq '.plan.tracks | map(select(.can_parallel == true))'

# Get critical path (cannot parallelize)
bv --robot-plan | jq '.plan.tracks | map(select(.dependencies == "sequential"))'
```

---

### Health Check

```bash
# Overall project health
bv --robot-triage | jq '.project_health'

# Label-specific health
bv --robot-label-health | jq '.results.labels[] | select(.health_level == "critical")'
```

---

### Historical Analysis

```bash
# Changes since last week
bv --robot-diff --diff-since HEAD~7

# Bead-to-commit correlation
bv --robot-history | jq '.histories["ved-o1cw"]'
```

---

## 🎓 BEST PRACTICES

### ✅ DO:

1. **Start with `--robot-triage`** - Đây là entry point tốt nhất
2. **Check `Cycles` LUÔN** - Circular deps = bad graph
3. **Use `--severity=critical`** cho alerts - Tránh noise
4. **Pipe to `jq`** - Parse JSON hiệu quả
5. **Check `.status`** - Verify metrics computed thành công
6. **Use `--robot-plan`** cho multi-agent - Tìm parallel tracks

### ❌ DON'T:

1. **Đừng parse `.beads/issues.jsonl` thủ công** - Dùng bv
2. **Đừng bỏ qua cycles** - Fix ngay khi phát hiện
3. **Đừng dùng `--robot-insights` cho speed** - Dùng `--robot-plan`
4. **Đừng ignore articulation points** - Single point of failure
5. **Đừng skip `bd sync`** - Mất sync với git = mất data

---

## 🔧 TROUBLESHOOTING

### bv command not found

```bash
# Check installation
where bv

# If not found, download from releases
# Windows: bv.exe should be in PATH
```

---

### Metrics show "approx" or "skipped"

**Reason:** Large graph (>500 nodes) or timeout (>500ms)

**Solution:**
```bash
# Use faster commands
bv --robot-plan  # Instead of --robot-insights

# Or filter graph
bv --robot-insights --label backend
```

---

### Cycles detected

**CRITICAL:** Fix immediately!

```bash
# Find cycles
bv --robot-insights | jq '.Cycles'

# Get suggestions to break cycles
bv --robot-suggest | jq '.cycle_breaks'

# Remove bad dependency
bd update <task-id> --remove-dep <dep-id>
```

---

## 📚 REFERENCES

**beads_viewer Documentation:**
- [temp_beads_viewer/README.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/temp_beads_viewer/README.md)

**Beads CLI Guide:**
- [BEADS_GUIDE.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/BEADS_GUIDE.md)

**MVP Pipeline:**
- [MVP_LAUNCH_PIPELINE_2026-01-03.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/MVP_LAUNCH_PIPELINE_2026-01-03.md)

---

## 🎯 TL;DR (Workflow 30 giây)

```bash
# Session Start
cd v-edfinance
bv --robot-triage | jq '.recommendations[0]'  # Top task
bd update <id> --status in_progress           # Claim it

# During Work
bv --robot-insights | jq '.Cycles'            # Check no cycles

# Session End
bd close <id> --reason "Done"                 # Close task
bd sync && git push                           # Sync to git
```

**That's it!** 🚀

---

**Created:** 2026-01-03  
**For:** V-EdFinance MVP Launch  
**Tools:** beads + beads_viewer + jq
