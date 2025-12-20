---
description: Hướng dẫn cài đặt Beads cho Windows
---

# Cài đặt Beads cho Windows

## Bước 1: Cài đặt Go (nếu chưa có)

1. Tải Go từ: https://go.dev/dl/
2. Chọn phiên bản Windows installer (`.msi`)
3. Chạy installer và làm theo hướng dẫn
4. Khởi động lại PowerShell để Go được nhận diện

## Bước 2: Kiểm tra Go đã được cài đặt

```powershell
go version
```

## Bước 3: Cài đặt Beads

```powershell
go install github.com/steveyegge/beads/cmd/bd@latest
```

## Bước 4: Kiểm tra PATH

Đảm bảo `%USERPROFILE%\go\bin` đã được thêm vào PATH:

```powershell
$env:Path += ";$env:USERPROFILE\go\bin"
```

Để thêm vĩnh viễn, chạy:

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\go\bin", [EnvironmentVariableTarget]::User)
```

## Bước 5: Kiểm tra Beads

```powershell
bd version
bd help
```

## Bước 6: Khởi tạo Beads trong project

```powershell
cd "c:\Users\luaho\Demo project\v-edfinance"
bd init --quiet
```

## Bước 7: Cài đặt Git hooks (khuyến nghị)

```powershell
bd hooks install
```

## Bước 8: Tạo file AGENTS.md

Thêm hướng dẫn cho AI agent:

```powershell
echo "Use 'bd' for task tracking. Run 'bd ready' to see available tasks." >> AGENTS.md
```

---

## Các lệnh Beads quan trọng

- `bd ready` - Xem các task sẵn sàng để làm (không có blocker)
- `bd create "Tiêu đề task" -p 0` - Tạo task mới với priority 0 (cao nhất)
- `bd list` - Xem tất cả tasks
- `bd show bd-xxxx` - Xem chi tiết một task
- `bd update bd-xxxx --status in_progress` - Cập nhật trạng thái task
- `bd close bd-xxxx --reason "Completed"` - Đóng task
- `bd dep add <child> <parent>` - Tạo dependency giữa các tasks
- `bd sync` - Đồng bộ với git ngay lập tức

---

## Tài liệu tham khảo

- README: `beads/README.md`
- Agent Instructions: `beads/AGENT_INSTRUCTIONS.md`
- Installing Guide: `beads/docs/INSTALLING.md`
