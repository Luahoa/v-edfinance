# Dependency Management - V-EdFinance

## Package Manager: pnpm

Dự án này sử dụng **pnpm** (version 9.15.0+) làm package manager chính thức. **KHÔNG sử dụng npm hoặc yarn**.

## Tại sao pnpm?

- ✅ **Hiệu quả hơn**: Tiết kiệm disk space với content-addressable storage
- ✅ **Nhanh hơn**: Install nhanh hơn npm/yarn
- ✅ **An toàn hơn**: Strict dependency resolution, tránh phantom dependencies
- ✅ **Monorepo-friendly**: Hỗ trợ tốt cho workspace

## Cài đặt pnpm

### Windows
```powershell
# Dùng npm (một lần duy nhất)
npm install -g pnpm@9.15.0

# Hoặc dùng standalone installer
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

### macOS/Linux
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Kiểm tra version
```bash
pnpm --version  # Should be 9.15.0 or higher
```

## Workflow Cơ Bản

### 1️⃣ Clone project & Install
```bash
git clone <repo-url>
cd v-edfinance
pnpm install
```

> ⚠️ **QUAN TRỌNG**: Luôn dùng `pnpm install`, KHÔNG dùng `npm install`

### 2️⃣ Thêm dependency mới
```bash
# Root workspace
pnpm add <package-name>

# Specific workspace
pnpm --filter api add <package-name>
pnpm --filter web add <package-name>
```

### 3️⃣ Update dependencies
```bash
# Update một package cụ thể
pnpm update <package-name>

# Update tất cả (cẩn thận!)
pnpm update

# Check outdated packages
pnpm outdated
```

### 4️⃣ Remove dependency
```bash
pnpm remove <package-name>

# Trong workspace cụ thể
pnpm --filter api remove <package-name>
```

## Lockfile: pnpm-lock.yaml

### Vai trò của lockfile

File `pnpm-lock.yaml` đảm bảo:
- ✅ Mọi người cài đặt **chính xác cùng version** dependencies
- ✅ Deploy environments có **consistent installations**
- ✅ CI/CD pipelines **reproducible**

### Nguyên tắc làm việc với lockfile

#### ✅ LUÔN LUÔN:
- Commit `pnpm-lock.yaml` vào git
- Chạy `pnpm install` sau khi pull code
- Review changes trong lockfile khi add/update packages

#### ❌ TUYỆT ĐỐI KHÔNG:
- Xóa `pnpm-lock.yaml` 
- Edit file lockfile manually
- Commit `package-lock.json` (từ npm)
- Chạy `npm install` thay vì `pnpm install`

## Giải Quyết Merge Conflicts

Khi có conflict trong `pnpm-lock.yaml`:

```bash
# 1. Stash changes (nếu cần)
git stash

# 2. Pull latest
git pull origin main

# 3. Apply stash
git stash pop

# 4. Xóa lockfile và node_modules
rm -rf node_modules pnpm-lock.yaml

# 5. Fresh install
pnpm install

# 6. Commit lockfile mới
git add pnpm-lock.yaml
git commit -m "chore: resolve lockfile conflict"
```

## CI/CD Best Practices

### Frozen Lockfile Mode

Trong CI/CD, luôn dùng `--frozen-lockfile`:

```bash
pnpm install --frozen-lockfile
```

Điều này đảm bảo:
- ❌ Fail nếu lockfile out-of-sync với package.json
- ✅ Không tự động update lockfile
- ✅ Reproducible builds

### Example GitHub Actions

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 9.15.0

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

## Troubleshooting

### Lỗi: "No lockfile found"
```bash
pnpm install  # Sẽ tự tạo lockfile mới
```

### Lỗi: "Lockfile is up to date"
```bash
# Nếu muốn force update
rm pnpm-lock.yaml
pnpm install
```

### Lỗi: "ENOENT: no such file or directory"
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Package version conflicts
```bash
# Xem dependency tree
pnpm why <package-name>

# List tất cả versions
pnpm list <package-name>
```

## Commands Reference

| Task | Command |
|------|---------|
| Install all | `pnpm install` |
| Add package | `pnpm add <pkg>` |
| Add dev dependency | `pnpm add -D <pkg>` |
| Remove package | `pnpm remove <pkg>` |
| Update package | `pnpm update <pkg>` |
| Run script | `pnpm run <script>` hoặc `pnpm <script>` |
| List dependencies | `pnpm list` |
| Check outdated | `pnpm outdated` |
| Clean cache | `pnpm store prune` |

## Monorepo Workspaces

Project structure:
```
v-edfinance/
├── apps/
│   ├── api/        # NestJS backend
│   └── web/        # Next.js frontend
├── packages/       # Shared packages
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

### Working với workspaces:

```bash
# Install cho tất cả workspaces
pnpm install

# Run command trong workspace cụ thể
pnpm --filter api dev
pnpm --filter web dev

# Run command cho tất cả workspaces
pnpm -r dev  # recursive

# Add dependency cho workspace
pnpm --filter api add express
```

## Kiểm Tra Setup

Chạy script validation:
```bash
node scripts/validate-lockfile.js
```

Hoặc trên Windows:
```cmd
CHECK_DEPENDENCIES.bat
```

## Tài Liệu Tham Khảo

- [pnpm Official Docs](https://pnpm.io/)
- [pnpm CLI Commands](https://pnpm.io/cli/install)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Lockfile Format](https://pnpm.io/git#lockfiles)

---

**Câu hỏi?** Liên hệ team lead hoặc tạo issue trên GitHub.
