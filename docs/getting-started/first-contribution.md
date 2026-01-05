# First Contribution Guide

Welcome! This guide will help you make your first contribution to V-EdFinance.

## Before You Start

1. ✅ Read [CONTRIBUTING.md](../../CONTRIBUTING.md) for code standards
2. ✅ Complete [Installation](installation.md)
3. ✅ Familiarize with [Development Workflow](development.md)
4. ✅ Browse [existing issues](https://github.com/Luahoa/v-edfinance/issues)

---

## Finding Your First Issue

### Good First Issues

Look for issues labeled `good first issue`:
- https://github.com/Luahoa/v-edfinance/labels/good%20first%20issue

These are:
- Well-documented
- Not too complex
- Good for newcomers

### What to Contribute

**Easy wins**:
- Fix typos in documentation
- Add missing translations (vi/en/zh)
- Improve error messages
- Add unit tests
- Update README

**Medium tasks**:
- Add new UI components
- Implement small features
- Fix bugs
- Improve accessibility

---

## Step-by-Step: Your First PR

### Step 1: Pick an Issue

1. Find an issue you want to work on
2. Comment: "I'd like to work on this"
3. Wait for assignment (or just start if it's a small fix)

### Step 2: Set Up Your Workspace

```bash
# Fork repository on GitHub (click Fork button)

# Clone YOUR fork
git clone https://github.com/YOUR_USERNAME/v-edfinance.git
cd v-edfinance

# Add upstream remote
git remote add upstream https://github.com/Luahoa/v-edfinance.git

# Install dependencies
pnpm install
```

### Step 3: Create Feature Branch

```bash
# Get latest code
git checkout main
git pull upstream main

# Create feature branch
git checkout -b fix/ved-123-fix-typo
```

### Step 4: Make Changes

**Example: Fix a typo in README**

```bash
# Edit file
code README.md

# Make your changes
# Before: "V-EdFinance is a edtech platform"
# After:  "V-EdFinance is an edtech platform"
```

### Step 5: Test Your Changes

```bash
# If code changes, run tests
pnpm test

# If frontend changes, check visually
pnpm dev
# Visit http://localhost:3000

# If docs changes, check formatting
# Just review the file
```

### Step 6: Commit Changes

```bash
# Stage changes
git add README.md

# Commit with conventional format
git commit -m "docs: fix typo in README description

Changed 'a edtech' to 'an edtech' for correct grammar.

Refs: ved-123"
```

**Commit message format**:
```
<type>(<scope>): <description>

[optional body]

Refs: ved-xxx
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Step 7: Push to Your Fork

```bash
git push origin fix/ved-123-fix-typo
```

### Step 8: Create Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template:

```markdown
## Description
Fixed typo in README: "a edtech" → "an edtech"

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [x] Documentation update

## Checklist
- [x] Code follows style guide
- [x] Tests pass (if applicable)
- [x] No console.log() statements
- [x] Documentation updated
```

4. Click "Create pull request"

### Step 9: Address Review Comments

**If reviewer requests changes**:

```bash
# Make requested changes
code README.md

# Commit
git add README.md
git commit -m "docs: address review feedback"

# Push (updates PR automatically)
git push origin fix/ved-123-fix-typo
```

### Step 10: Celebrate! 🎉

Once merged:
- ✅ You're now a contributor!
- ✅ Your name in git history
- ✅ You helped improve V-EdFinance

---

## Example Contributions

### Example 1: Fix Translation

**Issue**: Missing English translation for a button

**Steps**:
```bash
# 1. Create branch
git checkout -b fix/ved-456-add-translation

# 2. Edit locale file
code apps/web/src/i18n/locales/en.json
```

```json
// Add missing translation
{
  "button": {
    "submit": "Submit"  // Was missing
  }
}
```

```bash
# 3. Test
pnpm --filter web dev
# Check button shows "Submit"

# 4. Commit
git add apps/web/src/i18n/locales/en.json
git commit -m "i18n: add missing English translation for submit button

Refs: ved-456"

# 5. Push and create PR
git push origin fix/ved-456-add-translation
```

### Example 2: Add Unit Test

**Issue**: Service method has no tests

**Steps**:
```bash
# 1. Create test file
code apps/api/src/modules/users/users.service.spec.ts
```

```typescript
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

```bash
# 2. Run tests
pnpm --filter api test

# 3. Commit and push
git add apps/api/src/modules/users/users.service.spec.ts
git commit -m "test: add unit tests for UsersService

Refs: ved-789"
git push origin test/ved-789-add-tests
```

---

## Tips for Success

### DO

✅ **Start small** - Fix a typo, add a test  
✅ **Ask questions** - Use Discussions or comment on issue  
✅ **Follow conventions** - Check existing code for patterns  
✅ **Write clear commits** - Use conventional format  
✅ **Test your changes** - Run tests before submitting

### DON'T

❌ **Don't** work on already-assigned issues  
❌ **Don't** submit huge PRs (split into smaller ones)  
❌ **Don't** ignore review feedback  
❌ **Don't** commit secrets (.env files)  
❌ **Don't** change unrelated code

---

## Getting Help

### Where to Ask

- **GitHub Discussions**: https://github.com/Luahoa/v-edfinance/discussions
- **Issue comments**: Comment on the issue you're working on
- **PR comments**: Ask in your Pull Request

### Common Questions

**Q: How do I find issues to work on?**  
A: Check `good first issue` label or ask in Discussions

**Q: Can I work on an issue without assignment?**  
A: Yes for small fixes (typos, docs). For features, ask first.

**Q: My PR hasn't been reviewed yet**  
A: Be patient, reviewers are volunteers. Ping after 3-5 days.

**Q: Tests are failing in my PR**  
A: Run `pnpm test` locally to reproduce and fix

**Q: How do I sync my fork?**  
```bash
git checkout main
git pull upstream main
git push origin main
```

---

## Next Steps

**After your first contribution**:

1. **Look for more issues** - Try `help wanted` label
2. **Improve your skills** - Learn more about the stack
3. **Help others** - Review PRs, answer Discussions
4. **Suggest features** - Create feature request issues

---

## Recognition

Contributors are recognized in:
- Git commit history
- GitHub contributors page
- Release notes (for significant contributions)

**Thank you for contributing!** 🙏

---

**Need help?** Ask in [GitHub Discussions](https://github.com/Luahoa/v-edfinance/discussions)
