# 🚀 Quick Start Testing Guide

**Project:** V-EdFinance  
**Objective:** Run tests immediately without complex setup  
**Approach:** Manual testing first, then Swarm automation

---

## ⚡ Option 1: Run Tests Now (Windows)

### Step 1: Run Basic Tests
```bash
# Open PowerShell in project root
cd c:\Users\luaho\Demo project\v-edfinance

# Run all tests
pnpm --filter api test

# Run with coverage
pnpm --filter api test:coverage

# Open coverage report
start apps\api\coverage\lcov-report\index.html
```

**OR use batch script:**
```bash
.\RUN_TESTS.bat
```

---

## 📊 Step 2: Check Current Coverage

After running tests, open `apps/api/coverage/lcov-report/index.html` to see:
- Overall coverage percentage
- Which modules have good coverage (✅)
- Which modules need tests (🔴)

---

## 🎯 Step 3: Priority Testing (Start with Highest Risk)

### Critical Modules (Fintech Compliance) 🔴
Based on coverage report, focus on:

#### 1. Auth Module (MUST be 90%+)
```bash
# Test auth service
pnpm --filter api test auth.service.spec.ts

# If coverage < 90%, create tests:
# apps/api/src/auth/auth.service.spec.ts
```

**Missing Tests to Write:**
- [ ] Password hashing (bcrypt)
- [ ] JWT token generation and validation
- [ ] Refresh token rotation
- [ ] Account lockout after failed attempts
- [ ] Email verification flow

#### 2. Users Module (Target: 85%+)
```bash
pnpm --filter api test users.service.spec.ts
```

**Missing Tests:**
- [ ] User profile JSONB validation
- [ ] Investment profile creation
- [ ] Privacy settings enforcement
- [ ] Multi-locale support (vi/en/zh)

#### 3. Courses Module (Target: 80%+)
```bash
pnpm --filter api test courses.service.spec.ts
```

**Missing Tests:**
- [ ] Course JSONB structure validation
- [ ] Slug generation (unique)
- [ ] Published/Draft filtering
- [ ] Localized content retrieval

---

## 🛠️ Step 4: Write Your First Test

### Example: Test Missing Course Service Method

Create: `apps/api/src/courses/courses.service.spec.ts` (if not exists)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: PrismaService;

  const mockPrisma = {
    course: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create course with localized content', async () => {
      // ARRANGE
      const createDto = {
        title: {
          vi: 'Tài chính cơ bản',
          en: 'Finance 101',
          zh: '基础金融',
        },
        description: {
          vi: 'Khóa học về tài chính cơ bản',
          en: 'Basic finance course',
          zh: '基础金融课程',
        },
        level: 'BEGINNER',
        published: true,
      };

      const mockCourse = {
        id: 'course-uuid',
        slug: 'finance-101',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.course.create.mockResolvedValue(mockCourse);

      // ACT
      const result = await service.create(createDto);

      // ASSERT
      expect(result).toEqual(mockCourse);
      expect(mockPrisma.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createDto.title,
          level: 'BEGINNER',
        }),
      });
    });

    it('should generate unique slug from title', async () => {
      // Test slug generation logic
      const createDto = {
        title: { vi: 'Tài Chính Cơ Bản', en: 'Finance 101', zh: '基础金融' },
        level: 'BEGINNER',
      };

      mockPrisma.course.create.mockResolvedValue({
        id: 'uuid',
        slug: 'finance-101', // Expected slug
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result.slug).toBe('finance-101');
    });

    it('should validate JSONB structure', async () => {
      // Test JSONB validation
      const invalidDto = {
        title: 'Invalid - should be JSONB object', // Wrong type
        level: 'BEGINNER',
      };

      // Should throw validation error
      await expect(service.create(invalidDto as any)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return published courses only', async () => {
      const mockCourses = [
        { id: '1', published: true, title: { vi: 'Course 1' } },
        { id: '2', published: true, title: { vi: 'Course 2' } },
      ];

      mockPrisma.course.findMany.mockResolvedValue(mockCourses);

      const result = await service.findAll({ published: true });

      expect(result).toEqual(mockCourses);
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: { published: true },
      });
    });

    it('should filter by level', async () => {
      const result = await service.findAll({ level: 'BEGINNER' });

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: { level: 'BEGINNER' },
      });
    });
  });

  describe('findOne', () => {
    it('should return course by ID', async () => {
      const mockCourse = {
        id: 'course-uuid',
        title: { vi: 'Course 1' },
      };

      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findOne('course-uuid');

      expect(result).toEqual(mockCourse);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Course not found'
      );
    });
  });
});
```

### Run Your New Test
```bash
cd apps\api
pnpm test courses.service.spec.ts

# Check coverage
pnpm test:coverage courses.service.spec.ts
```

---

## 📈 Step 5: Check Progress

After writing tests, run coverage again:
```bash
pnpm --filter api test:coverage
start apps\api\coverage\lcov-report\index.html
```

**Target Progress:**
- Day 1: Auth module 90%+ ✅
- Day 2: Users + Courses 80%+ ✅
- Day 3: Integration tests ✅
- Day 4: E2E critical flows ✅

---

## 🚀 Step 6: Scale with Swarm (Optional)

Once you're comfortable with manual testing, use Swarm for automation:

### Install Swarm CLI
```bash
# Install Ruby (if not installed)
# Download from: https://rubyinstaller.org/

# Install Swarm
gem install swarm_cli

# Verify installation
swarm --help
```

### Run Automated Testing
```bash
# Unit tests (4 agents parallel)
swarm run swarms/test-unit-swarm.yml

# E2E tests (4 agents)
swarm run swarms/test-e2e-swarm.yml

# Performance tests (3 agents)
swarm run swarms/test-performance-swarm.yml
```

---

## 🎯 Daily Testing Routine

### Morning (10 minutes)
```bash
# Pull latest changes
git pull --rebase

# Run tests
pnpm --filter api test

# If tests fail → Fix before starting new work
```

### Before Commit (5 minutes)
```bash
# Run affected tests
pnpm --filter api test

# Check coverage hasn't dropped
pnpm --filter api test:coverage

# Only commit if tests pass
```

### Before PR (10 minutes)
```bash
# Run full test suite
pnpm --filter api test:coverage

# Run E2E tests
pnpm --filter web playwright test

# Verify coverage ≥ 80%
```

---

## 📚 Quick Reference

### Common Test Commands
```bash
# Run all tests
pnpm --filter api test

# Run specific test file
pnpm --filter api test auth.service.spec.ts

# Watch mode (re-run on file changes)
pnpm --filter api test:watch

# Coverage report
pnpm --filter api test:coverage

# Debug mode
pnpm --filter api test --detectOpenHandles
```

### Test File Locations
- **Unit tests:** `apps/api/src/**/*.spec.ts`
- **Integration tests:** `apps/api/test/**/*.e2e-spec.ts`
- **E2E tests:** `apps/web/tests/**/*.spec.ts`

---

## 🛠️ Troubleshooting

### Test Database Connection Error
```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Verify running
docker ps
```

### Coverage Report Not Generating
```bash
# Clean coverage folder
rm -rf apps/api/coverage

# Re-run with coverage
pnpm --filter api test:coverage
```

### Tests Timeout
```bash
# Increase timeout in jest.config.js
module.exports = {
  testTimeout: 10000, // 10 seconds (default: 5000)
};
```

---

## ✅ Success Criteria

**Before saying "Testing Complete":**
- [ ] All existing tests pass ✅
- [ ] Auth module coverage ≥ 90%
- [ ] Core modules (Users, Courses) ≥ 80%
- [ ] Overall coverage ≥ 70% (minimum)
- [ ] No critical security vulnerabilities
- [ ] CI/CD pipeline configured

---

## 🎉 Next Steps After Manual Testing

Once you hit 70%+ coverage manually:
1. **Document patterns** - Share test examples with team
2. **Automate with Swarm** - Scale to 80%+ coverage
3. **Enable CI/CD** - Block PRs if tests fail
4. **Performance testing** - Use Swarm for load tests

---

**Ready to start?** Run: `.\RUN_TESTS.bat` or `pnpm --filter api test`
