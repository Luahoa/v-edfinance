# 🎯 Amp + Beads Workflow Quick Start

## ⚡ Sử dụng nhanh

### Windows PowerShell
```powershell
# Full workflow (tests + review)
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-296" -Message "Optimization Controller complete"

# Skip tests
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-297" -Message "Quick fix" -SkipTests

# Skip review
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-298" -Message "Urgent hotfix" -SkipReview

# Skip both (emergency)
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-299" -Message "Critical patch" -SkipReview -SkipTests
```

### Linux/Mac Bash
```bash
# Full workflow
./scripts/amp-beads-workflow.sh ved-296 "Optimization Controller complete"

# With options
./scripts/amp-beads-workflow.sh ved-297 "Quick fix" --skip-tests
./scripts/amp-beads-workflow.sh ved-298 "Urgent hotfix" --skip-review
./scripts/amp-beads-workflow.sh ved-299 "Critical patch" --skip-review --skip-tests
```

---

## 🔄 Workflow Steps

1. ✅ Pre-flight checks (git, beads, changes)
2. 🧪 Run tests (optional)
3. 📦 Stage changes
4. 🔍 **Amp Review Checkpoint** (interactive)
5. 💾 Git commit (BEFORE beads)
6. ✅ Beads close task
7. 🔄 Beads sync
8. 🚀 Git push

---

## 🎨 Interactive Review Mode

Khi đến Phase 4, script sẽ **dừng lại** và hỏi:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AMP REVIEW CHECKPOINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Changes staged. Ready for Amp review.

Options:
  1. Let Amp review now (recommended)
  2. Skip review and commit
  3. Cancel workflow

Enter choice (1-3):
```

### Option 1: Amp Review
- Script tạo file `review-ved-XXX.txt`
- Copy nội dung file paste vào Amp chat
- Amp phân tích và đưa suggestions
- Fix issues → chạy lại script
- Hoặc accept → press Enter để continue

### Option 2: Skip Review
- Bỏ qua review, commit ngay

### Option 3: Cancel
- Hủy workflow, unstage changes

---

## 📝 Sample Amp Review Prompt

```markdown
Review the following changes for VED-296:

[Paste diff from review-ved-296.txt]

Check:
1. TypeScript type safety
2. NestJS best practices
3. API design (RESTful, Swagger)
4. Test coverage
5. Performance concerns
6. Security issues

Provide line-by-line feedback.
```

---

## 🚨 Troubleshooting

### Script fails at tests
```powershell
# Skip tests if not critical
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-XXX" -Message "..." -SkipTests
```

### Review file not found
```bash
# File is auto-generated at: review-ved-XXX.txt
# Check current directory
ls review-*.txt
```

### Beads sync fails
```bash
# Retry manually
./beads.exe sync
git push
```

---

## 🎯 Best Practices

1. **Always review for production code**
   - Use `-SkipReview` only for trivial changes

2. **Run tests before commit**
   - Use `-SkipTests` only when tests are known to pass

3. **Commit messages**
   - Use conventional commits: `feat:`, `fix:`, `docs:`
   - Include task ID: `(ved-XXX)`

4. **Review feedback**
   - Take Amp suggestions seriously
   - Fix issues before continuing

---

## 📚 Full Documentation

See [docs/AMP_BEADS_INTEGRATION_GUIDE.md](../docs/AMP_BEADS_INTEGRATION_GUIDE.md) for:
- Complete workflow explanation
- Manual workflow steps
- Common pitfalls
- Advanced git hooks integration

---

**Created:** 2025-12-22  
**Last Updated:** 2025-12-22
