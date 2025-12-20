---
description: How to resolve merge conflicts in .beads/issues.jsonl
---

# Giải Quyết Merge Conflicts trong Beads

## Khi nào xảy ra merge conflict?

Khi bạn và người khác cùng thay đổi beads database, có thể gặp conflict trong `.beads/issues.jsonl`.

## Các bước giải quyết

### Cách 1: Chấp nhận remote changes (khuyến nghị)

```bash
# Chấp nhận tất cả thay đổi từ remote
git checkout --theirs .beads/issues.jsonl

# Import lại vào database
bd import -i .beads/issues.jsonl

# Hoàn tất merge
git add .beads/issues.jsonl
git commit -m "Resolved beads conflict - accepted remote"
```

### Cách 2: Giữ local changes

```bash
# Giữ tất cả thay đổi local
git checkout --ours .beads/issues.jsonl

# Export lại
bd export -o .beads/issues.jsonl

# Hoàn tất merge
git add .beads/issues.jsonl
git commit -m "Resolved beads conflict - kept local"
```

### Cách 3: Merge thủ công (cho conflicts phức tạp)

```bash
# 1. Thủ công edit .beads/issues.jsonl
# Mở file và xóa các conflict markers (<<<, ===, >>>)
# Giữ lại tất cả các dòng json hợp lệ

# 2. Import file đã merge
bd import -i .beads/issues.jsonl

# 3. Export lại để đảm bảo format đúng
bd export -o .beads/issues.jsonl

# 4. Commit
git add .beads/issues.jsonl
git commit -m "Resolved beads conflict - manual merge"
```

## Merge Driver (Tự động)

Beads có merge driver thông minh để tự động giải quyết conflicts:

```bash
# Cài đặt merge driver (chạy một lần)
bd init --quiet

# Merge driver sẽ tự động:
# - Kết hợp thay đổi từ cả 2 branches
# - Giữ hash IDs duy nhất
# - Tránh duplicates
```

## Kiểm tra sau khi resolve

```bash
# Xem danh sách issues
bd list

# Kiểm tra duplicates
bd duplicates

# Nếu có duplicates, merge chúng
bd duplicates --auto-merge
```

## Phòng tránh conflicts

1. **Luôn sync trước khi làm việc**:
   ```bash
   git pull --rebase
   bd import -i .beads/issues.jsonl
   ```

2. **Sync thường xuyên**:
   ```bash
   bd sync  # Export + commit + push
   ```

3. **Cài git hooks**:
   ```bash
   bd hooks install
   ```

## Lưu ý

- Hash IDs (`ved-abc123`) giúp tránh conflicts
- Cùng một ID với nội dung khác = update bình thường
- Beads được thiết kế để an toàn với multi-user workflows
