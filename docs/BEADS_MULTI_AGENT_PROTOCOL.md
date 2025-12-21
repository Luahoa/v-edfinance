# 🔄 Beads Multi-Agent Sync Protocol

## Tổng Quan

Dự án V-EdFinance được xử lý bởi **nhiều AI agents song song**. Để tránh xung đột và mất dữ liệu, tất cả agents **BẮT BUỘC** phải tuân thủ protocol này.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│   │ Agent 1 │    │ Agent 2 │    │ Agent 3 │    │ Agent N │     │
│   │  (Amp)  │    │ (Claude)│    │ (Cursor)│    │   ...   │     │
│   └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘     │
│        │              │              │              │           │
│        └──────────────┴──────┬───────┴──────────────┘           │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │  beads-sync     │  ← Dedicated sync branch │
│                    │    branch       │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│                             ▼                                    │
│                    ┌─────────────────┐                          │
│                    │ GitHub Remote   │                          │
│                    │ origin/beads-   │                          │
│                    │    sync         │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚨 Quy Tắc Bắt Buộc

### 1. KHÔNG BAO GIỜ làm việc mà không sync trước

```bash
# ❌ SAI - Bắt đầu làm việc ngay
bd ready
bd update ved-xxx --status in_progress

# ✅ ĐÚNG - Sync trước, làm sau
.\beads.exe sync              # Lấy changes từ agents khác
.\beads.exe ready             # Xem tasks available
.\beads.exe update ved-xxx --status in_progress
```

### 2. LUÔN sync sau khi hoàn thành task

```bash
# Sau mỗi task completion
.\beads.exe close ved-xxx --reason "Completed: [mô tả ngắn]"
.\beads.exe sync              # Push changes cho agents khác
```

### 3. Sync TRƯỚC KHI kết thúc session

```bash
# Cuối session - MANDATORY
.\beads.exe sync
git add -A
git commit -m "feat: [mô tả] (ved-xxx)"
git push
```

---

## 📋 Agent Session Protocol

### Bắt Đầu Session (MANDATORY)

```bash
# 1. Pull latest code
git pull --rebase

# 2. Sync beads từ remote
.\beads.exe sync

# 3. Health check
.\beads.exe doctor

# 4. Xem workflow context
.\beads.exe prime

# 5. Tìm task để làm
.\beads.exe ready
```

### Trong Session

```bash
# Claim task
.\beads.exe update ved-xxx --status in_progress

# Khi phát hiện task mới trong quá trình làm việc
.\beads.exe create "Task title" \
  --description="Chi tiết" \
  -t task -p 2 \
  --deps discovered-from:ved-xxx

# Hoàn thành task
.\beads.exe close ved-xxx --reason "Completed: mô tả ngắn"

# Sync ngay sau khi close (để agents khác thấy)
.\beads.exe sync
```

### Kết Thúc Session (MANDATORY)

```bash
# 1. Close all in-progress tasks hoặc update status
.\beads.exe list --status in_progress
# Với mỗi task: close hoặc update lý do tạm dừng

# 2. Sync beads
.\beads.exe sync

# 3. Commit code changes
git add -A
git commit -m "feat/fix: [description] (ved-xxx)"

# 4. Push to remote - MANDATORY
git push

# 5. Verify
git status  # Phải hiện "up to date with origin"
```

---

## 🔀 Sync-Branch Workflow

### Tại sao cần Sync-Branch?

| Vấn đề | Giải pháp với sync-branch |
|--------|---------------------------|
| Nhiều agents commit cùng lúc | Mỗi agent sync riêng, merge tự động |
| Xung đột JSONL | Beads có merge driver thông minh |
| Main branch bị "ô nhiễm" | Beads commits vào branch riêng |
| Mất track changes | Mỗi sync có commit riêng |

### Cấu hình (đã setup sẵn)

```yaml
# .beads/config.yaml
sync-branch: "beads-sync"
```

### Các lệnh Sync

```bash
# Sync đầy đủ (pull + push)
.\beads.exe sync

# Chỉ xem status
.\beads.exe sync --status

# Dry run - xem sẽ làm gì
.\beads.exe sync --dry-run

# Chỉ export JSONL (không commit)
.\beads.exe sync --flush-only

# Chỉ import từ JSONL
.\beads.exe sync --import-only

# Merge sync-branch vào main (khi cần)
.\beads.exe sync --merge
```

---

## ⚠️ Xử Lý Xung Đột

### Khi sync bị conflict

```bash
# 1. Xem conflict
.\beads.exe sync --status

# 2. Chạy doctor để kiểm tra
.\beads.exe doctor

# 3. Nếu có mismatch DB-JSONL
.\beads.exe sync --flush-only   # Export DB → JSONL
# hoặc
.\beads.exe sync --import-only  # Import JSONL → DB

# 4. Retry sync
.\beads.exe sync
```

### Khi 2 agents claim cùng 1 task

```bash
# Agent nhận thấy task đã được claim
.\beads.exe show ved-xxx
# Nếu thấy status: in_progress và không phải mình

# Option 1: Chọn task khác
.\beads.exe ready

# Option 2: Tạo sub-task
.\beads.exe create "Sub-task of ved-xxx" \
  --deps blocks:ved-xxx \
  -t task
```

---

## 📊 Monitoring & Health

### Daily Health Check

```bash
# Chạy ít nhất 1 lần/session
.\beads.exe doctor

# Output mong đợi
✓ 29 passed  ⚠ 0 warnings  ✗ 0 failed
```

### Xem tất cả issues đang active

```bash
.\beads.exe list --status open --json
.\beads.exe list --status in_progress
```

### Xem ai đang làm gì (nếu có actor)

```bash
.\beads.exe list --status in_progress --json | jq '.[] | {id, title, updated_at}'
```

---

## 🏷️ Commit Message Convention

Khi commit code liên quan đến beads issue:

```bash
# Format
git commit -m "<type>: <description> (ved-xxx)"

# Examples
git commit -m "feat: Add user authentication (ved-abc)"
git commit -m "fix: Resolve login race condition (ved-def)"
git commit -m "test: Add unit tests for auth service (ved-ghi)"
git commit -m "chore: Update dependencies (ved-jkl)"
```

---

## 🔧 Troubleshooting

### "Database and JSONL are not in sync"

```bash
.\beads.exe sync --flush-only
.\beads.exe doctor
```

### "Daemon version mismatch"

```bash
.\beads.exe daemons killall
.\beads.exe doctor  # Daemon sẽ auto-restart
```

### "sync-branch not found on remote"

```bash
# Lần đầu push sync-branch
git checkout -b beads-sync
git push -u origin beads-sync
git checkout main
.\beads.exe sync
```

### Issues bị duplicate

```bash
.\beads.exe duplicates
.\beads.exe merge ved-dup1 ved-dup2 --into ved-original
```

---

## 📁 File Structure

```
v-edfinance/
├── .beads/
│   ├── config.yaml          # Cấu hình (sync-branch, etc.)
│   ├── beads.db              # SQLite database (local)
│   ├── issues.jsonl          # JSONL for git sync
│   ├── daemon.pid            # Daemon process ID
│   └── daemon.log            # Daemon logs
├── beads.exe                 # CLI binary
├── BEADS_GUIDE.md            # Quick reference
└── docs/
    └── BEADS_MULTI_AGENT_PROTOCOL.md  # This file
```

---

## ✅ Checklist cho Agent

### Bắt đầu Session
- [ ] `git pull --rebase`
- [ ] `.\beads.exe sync`
- [ ] `.\beads.exe doctor` (no failures)
- [ ] `.\beads.exe prime` hoặc `.\beads.exe ready`

### Trong Session
- [ ] Claim task trước khi làm
- [ ] Tạo discovered tasks với `--deps discovered-from`
- [ ] Sync sau mỗi task completion quan trọng

### Kết thúc Session
- [ ] Close/update tất cả in-progress tasks
- [ ] `.\beads.exe sync`
- [ ] `git add -A && git commit`
- [ ] `git push` (MANDATORY)
- [ ] `git status` shows "up to date"

---

## 🔗 Quick Commands Reference

```bash
# === SESSION START ===
git pull --rebase
.\beads.exe sync
.\beads.exe doctor
.\beads.exe ready

# === DURING SESSION ===
.\beads.exe update ved-xxx --status in_progress
.\beads.exe close ved-xxx --reason "Done: description"
.\beads.exe sync

# === SESSION END ===
.\beads.exe sync
git add -A
git commit -m "type: description (ved-xxx)"
git push
```

---

*Last updated: 2025-12-22*
*Protocol version: 1.0*
