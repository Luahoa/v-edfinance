# Hướng Dẫn Sử Dụng Beads (bd) cho V-EdFinance

## 📖 Beads là gì?

**Beads** là một công cụ quản lý issue/task được tối ưu cho AI agents:
- Git-backed: Lưu trữ issues dưới dạng JSONL trong `.beads/`
- Dependency-aware: Theo dõi quan hệ phụ thuộc giữa các tasks  
- Auto-sync: Tự động đồng bộ với git
- Agent-optimized: JSON output, phát hiện task sẵn sàng làm

## 🚀 Cài Đặt Nhanh (Windows)

### Bước 1: Cài đặt Go

1. Tải Go từ: https://go.dev/dl/
2. Chọn Windows installer (`.msi`)
3. Chạy installer
4. Khởi động lại PowerShell

### Bước 2: Cài đặt Beads CLI

```powershell
go install github.com/steveyegge/beads/cmd/bd@latest
```

### Bước 3: Thêm vào PATH

```powershell
# Tạm thời (session hiện tại)
$env:Path += ";$env:USERPROFILE\go\bin"

# Vĩnh viễn
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\go\bin", [EnvironmentVariableTarget]::User)
```

### Bước 4: Kiểm tra cài đặt

```powershell
bd version
bd help
```

### Bước 5: Khởi tạo trong project

```powershell
cd "c:\Users\luaho\Demo project\v-edfinance"
bd init --quiet --prefix ved
```

### Bước 6: Cài đặt Git hooks (khuyến nghị)

```powershell
bd hooks install
```

## 📋 Các Lệnh Cơ Bản

### Context và Workflow
```bash
bd prime                    # Context đầy đủ về workflow hiện tại
bd ready                    # Xem tasks không có blocker
bd ready --json             # Output JSON (cho AI agent)
```

### Tạo task mới

```bash
bd create "Implement user authentication" \
  --description="Add JWT-based authentication for API endpoints" \
  -t feature \
  -p 1 \
  --json
```

**Tham số:**
- `-t`: Type (`bug`, `feature`, `task`, `epic`, `chore`)
- `-p`: Priority (0=Critical, 1=High, 2=Medium, 3=Low, 4=Backlog)

### Xem danh sách tasks

```bash
bd list                          # Tất cả tasks
bd list --status open            # Chỉ tasks đang mở
bd list --priority 1             # Chỉ priority 1
bd list --json                   # JSON output
```

### Xem chi tiết task

```bash
bd show ved-abc123
bd show ved-abc123 --json
```

### Cập nhật task

```bash
bd update ved-abc123 --status in_progress
bd update ved-abc123 --priority 0
bd update ved-abc123 --status in_progress --json
```

### Đóng task

```bash
bd close ved-abc123 --reason "Completed successfully"
bd close ved-abc123 --reason "Completed" --json
```

### Tạo dependency giữa các tasks

```bash
# Task A phụ thuộc vào Task B (B blocks A)
bd dep add ved-taskA ved-taskB

# Tạo task mới phát hiện trong quá trình làm việc
bd create "Fix login bug" \
  --description="Login fails with special characters in password" \
  -t bug \
  -p 1 \
  --deps discovered-from:ved-parent123 \
  --json
```

### Đồng bộ với Git

```bash
bd sync    # Export to JSONL, commit, pull, import, push
```

## 🔗 Workflow cho AI Agent

1. **Kiểm tra task sẵn sàng**: 
   ```bash
   bd ready --json
   ```

2. **Claim task**:
   ```bash
   bd update ved-abc --status in_progress --json
   ```

3. **Làm việc**: Implement, test, document

4. **Phát hiện thêm công việc**:
   ```bash
   bd create "New bug found" \
     --description="Details about the bug" \
     -t bug \
     -p 1 \
     --deps discovered-from:ved-abc \
     --json
   ```

5. **Hoàn thành**:
   ```bash
   bd close ved-abc --reason "Implemented and tested" --json
   ```

6. **Đồng bộ cuối session**:
   ```bash
   bd sync
   ```

## 📊 Issue Types

- `bug` - Lỗi cần sửa
- `feature` - Tính năng mới
- `task` - Công việc (tests, docs, refactoring)
- `epic` - Feature lớn có nhiều subtasks
- `chore` - Công việc bảo trì (dependencies, tooling)

## 🎯 Priorities

- `0` - **Critical**: Security, data loss, broken builds
- `1` - **High**: Major features, important bugs
- `2` - **Medium**: Nice-to-have features, minor bugs
- `3` - **Low**: Polish, optimization
- `4` - **Backlog**: Future ideas

## 🔍 Các Lệnh Hữu Ích Khác

```bash
# Xem tasks bị block
bd blocked --json

# Xem dependency tree
bd dep tree ved-abc123

# Xem thống kê
bd stats

# Tìm kiếm duplicates
bd duplicates

# Merge duplicate tasks
bd merge ved-dup1 ved-dup2 --into ved-original --json

# Xóa task
bd delete ved-abc123

# Kiểm tra hệ thống (health check)
bd doctor

# Web interface (cho người dùng)
bd monitor --port 8080

# Context đầy đủ về workflow (cho AI)
bd prime
```

## 💡 Best Practices

1. **Luôn dùng `--json` flag** khi làm việc với AI agent
2. **Always include descriptions** khi tạo issues
3. **Link discovered work** với `discovered-from` dependencies
4. **Sync at end of session**: `bd sync` để đảm bảo đồng bộ
5. **Check for duplicates** trước khi tạo issue mới
6. **Use dependency graph** để hiểu rõ quan hệ giữa các tasks

## 🔗 Tài Liệu Tham Khảo

- [README](beads/README.md) - Tổng quan
- [Agent Instructions](beads/AGENT_INSTRUCTIONS.md) - Hướng dẫn chi tiết cho AI
- [Installation Guide](beads/docs/INSTALLING.md) - Cài đặt chi tiết
- [CLI Reference](beads/docs/CLI_REFERENCE.md) - Tham khảo CLI đầy đủ

## ⚡ Quick Reference Card

```bash
# Workflow cơ bản
bd prime                                         # Context đầy đủ về workflow hiện tại
bd ready --json                                  # Xem tasks available
bd doctor                                        # Health check hệ thống
bd create "Title" --description="..." -p 1 --json    # Tạo task
bd update ved-xxx --status in_progress --json   # Claim task
bd close ved-xxx --reason "Done" --json         # Hoàn thành
bd sync                                          # Đồng bộ với git

# Tìm kiếm & filter
bd list --status open --priority 1 --json       # Open P1 tasks
bd show ved-xxx --json                          # Chi tiết task
bd dep tree ved-xxx                             # Dependency tree

# Cleanup
bd duplicates --auto-merge                      # Merge duplicates
bd delete ved-xxx                               # Xóa task
```

---

**Lưu ý**: Beads được thiết kế để thay thế markdown TODOs và task lists. Sử dụng `bd` cho TẤT CẢ việc quản lý tasks trong project này!
