# Test Helpers & Mock Data

Reusable test utilities and mock data generators for V-EdFinance API testing.

## Directory Structure

```
test/
├── helpers/
│   ├── test-utils.ts       # General test utilities
│   ├── mock-prisma.ts      # Prisma mocking utilities
│   ├── auth-helper.ts      # Authentication helpers
│   └── index.ts            # Re-exports
├── mocks/
│   ├── users.mock.ts       # 10 sample users
│   ├── courses.mock.ts     # 5 sample courses + lessons
│   ├── behavior.mock.ts    # Behavior logs & streaks
│   └── index.ts            # Re-exports
└── README.md               # This file
```

## Usage Examples

### 1. Unit Testing with Mock Prisma

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { createMockPrismaClient, setupModelMocks } from '../helpers/mock-prisma';
import { mockUsers } from '../mocks/users.mock';
import { UsersService } from '../../src/users/users.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(async () => {
    prisma = createMockPrismaClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should find a user by email', async () => {
    // Setup mock response
    setupModelMocks(prisma.user, {
      findUnique: mockUsers[0],
    });

    const result = await service.findOne('student1@example.com');
    expect(result).toEqual(mockUsers[0]);
  });
});
```

### 2. Integration Testing with Auth

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { generateAuthHeader } from './helpers/auth-helper';
import { cleanupDatabase } from './helpers/test-utils';
import { Role } from '@prisma/client';

describe('Courses API (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /courses - should return courses for authenticated user', async () => {
    const authHeader = generateAuthHeader('user-student-001', Role.STUDENT);

    return request(app.getHttpServer())
      .get('/courses')
      .set(authHeader)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('POST /courses - should require admin role', async () => {
    const studentHeader = generateAuthHeader('user-student-001', Role.STUDENT);
    const adminHeader = generateAuthHeader('user-admin-001', Role.ADMIN);

    // Student should fail
    await request(app.getHttpServer())
      .post('/courses')
      .set(studentHeader)
      .send({ title: 'Test Course' })
      .expect(403);

    // Admin should succeed
    await request(app.getHttpServer())
      .post('/courses')
      .set(adminHeader)
      .send({
        title: {
          vi: 'Khóa học test',
          en: 'Test Course',
          zh: '测试课程',
        },
        // ... other fields
      })
      .expect(201);
  });
});
```

### 3. Using Mock Data

```typescript
import { mockUsers, getUsersByRole, getUserById } from '../mocks/users.mock';
import { mockCourses, getCoursesByLevel } from '../mocks/courses.mock';
import { mockBehaviorLogs, createBehaviorLog } from '../mocks/behavior.mock';
import { Role, Level } from '@prisma/client';

// Get all students
const students = getUsersByRole(Role.STUDENT); // 6 students

// Get specific user
const user = getUserById('user-student-001');
console.log(user.name.vi); // "Nguyễn Văn An"

// Get beginner courses
const beginnerCourses = getCoursesByLevel(Level.BEGINNER);

// Create a test behavior log
const log = createBehaviorLog(
  'user-student-001',
  'LESSON_START',
  'LEARNING',
  { lessonId: 'lesson-001-01' }
);
```

### 4. Database Cleanup

```typescript
import { cleanupDatabase, getPrismaClient } from './helpers/test-utils';

describe('Database Operations', () => {
  beforeEach(async () => {
    // Clean slate before each test
    await cleanupDatabase();
  });

  it('should insert and retrieve data', async () => {
    const prisma = getPrismaClient();

    await prisma.user.create({
      data: mockUsers[0],
    });

    const user = await prisma.user.findUnique({
      where: { email: 'student1@example.com' },
    });

    expect(user).toBeDefined();
  });
});
```

### 5. Timing Utilities

```typescript
import { sleep, waitFor } from './helpers/test-utils';

describe('Async Operations', () => {
  it('should wait for condition', async () => {
    let ready = false;

    setTimeout(() => {
      ready = true;
    }, 1000);

    // Wait up to 2 seconds for ready to become true
    await waitFor(() => ready, 2000);

    expect(ready).toBe(true);
  });

  it('should delay execution', async () => {
    const start = Date.now();
    await sleep(500);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(500);
  });
});
```

## Mock Data Details

### Users (10 total)
- **6 Students**: Various points, locales (vi/en/zh), onboarding states
- **2 Teachers**: Different specializations
- **2 Admins**: Full and content-only access
- Password for all: `Test@1234` (pre-hashed)

### Courses (5 total)
- **3 Published**: Beginner to Intermediate levels
- **2 Unpublished**: For draft/preview testing
- All have localized fields (vi/en/zh)
- Includes 5 sample lessons

### Behavior Logs (8 samples)
- Learning activities
- Portfolio trades
- Social interactions
- Checklist updates

## Key Features

✅ **Localized Mock Data**: All JSONB fields include vi/en/zh translations  
✅ **Pre-hashed Passwords**: BCrypt hashes ready for auth testing  
✅ **Role Coverage**: Student, Teacher, Admin scenarios  
✅ **Database Cleanup**: Safe transaction-based cleanup  
✅ **JWT Helpers**: Token generation and mock guards  
✅ **Type-Safe Mocks**: Full TypeScript support with Prisma types  

## Best Practices

1. **Always cleanup between tests** - Use `cleanupDatabase()` in `beforeEach`
2. **Use generated tokens** - Don't hardcode JWT strings
3. **Test all locales** - Verify vi/en/zh fields are properly handled
4. **Mock at the right level** - Unit tests: mock Prisma, E2E tests: real DB
5. **Leverage helpers** - Don't recreate test utilities in every file
