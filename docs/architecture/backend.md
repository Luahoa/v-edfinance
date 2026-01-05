# Backend Architecture (NestJS)

**App**: `apps/api/`  
**Framework**: NestJS 10  
**Purpose**: RESTful API server with business logic, authentication, and database access

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Module Architecture](#module-architecture)
- [API Design](#api-design)
- [Authentication & Authorization](#authentication--authorization)
- [Database Integration](#database-integration)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## Directory Structure

```
apps/api/
├── src/
│   ├── modules/                    # Feature modules
│   │   ├── auth/                   # Authentication (JWT)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/         # Passport strategies
│   │   │   └── guards/             # Auth guards
│   │   ├── users/                  # User management
│   │   ├── courses/                # Course management
│   │   ├── gamification/           # Achievements, XP, leaderboards
│   │   │   ├── achievements.service.ts
│   │   │   ├── leaderboards.service.ts
│   │   │   └── xp.service.ts
│   │   ├── ai-mentor/              # Google Gemini integration
│   │   ├── payments/               # Stripe integration
│   │   ├── groups/                 # Social groups
│   │   ├── feed/                   # Social feed
│   │   └── debug/                  # Diagnostic tools
│   ├── common/                     # Shared code
│   │   ├── filters/                # Exception filters
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/                 # Shared guards
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/           # Request/response interceptors
│   │   │   └── transform.interceptor.ts
│   │   ├── validators/             # Custom validators
│   │   │   └── jsonb-validator.ts
│   │   ├── decorators/             # Custom decorators
│   │   │   └── current-user.decorator.ts
│   │   └── dto/                    # Shared DTOs
│   ├── prisma/                     # Prisma integration
│   │   ├── schema.prisma           # Database schema
│   │   ├── migrations/             # SQL migrations
│   │   └── prisma.service.ts       # Prisma client wrapper
│   ├── app.module.ts               # Root module
│   ├── app.controller.ts           # Health check endpoint
│   └── main.ts                     # Application entry point
├── test/                           # E2E tests
│   └── app.e2e-spec.ts
├── nest-cli.json                   # NestJS CLI config
├── tsconfig.json                   # TypeScript config
└── package.json
```

---

## Module Architecture

### Feature Module Pattern

Each feature is a **self-contained module** with its own controllers, services, and DTOs.

**Example: Courses Module**
```
modules/courses/
├── courses.module.ts       # Module definition
├── courses.controller.ts   # HTTP endpoints
├── courses.service.ts      # Business logic
├── dto/                    # Data Transfer Objects
│   ├── create-course.dto.ts
│   └── update-course.dto.ts
└── entities/               # TypeScript types (optional)
    └── course.entity.ts
```

### Module Definition
```typescript
// modules/courses/courses.module.ts
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService], // Export for use in other modules
})
export class CoursesModule {}
```

---

## API Design

### RESTful Endpoints

**Example: Courses API**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/courses` | List all courses | Public |
| GET | `/api/courses/:id` | Get course details | Public |
| POST | `/api/courses` | Create course | Admin |
| PATCH | `/api/courses/:id` | Update course | Admin |
| DELETE | `/api/courses/:id` | Delete course | Admin |
| POST | `/api/courses/:id/enroll` | Enroll in course | User |

### Controller Example
```typescript
// modules/courses/courses.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  async update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  async enroll(@Param('id') id: string, @CurrentUser() user) {
    return this.coursesService.enroll(id, user.id);
  }
}
```

### Service Example
```typescript
// modules/courses/courses.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      where: { deletedAt: null },
      include: {
        modules: true,
        enrollments: { select: { _count: true } },
      },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { modules: { include: { lessons: true } } },
    });

    if (!course || course.deletedAt) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async create(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        difficulty: dto.difficulty,
        // ... other fields
      },
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id); // Check existence
    return this.prisma.course.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Soft delete
    return this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async enroll(courseId: string, userId: string) {
    return this.prisma.enrollment.create({
      data: {
        courseId,
        userId,
        enrolledAt: new Date(),
      },
    });
  }
}
```

---

## Authentication & Authorization

### JWT Strategy

**1. Login Endpoint**
```typescript
// modules/auth/auth.controller.ts
@Post('login')
async login(@Body() loginDto: LoginDto) {
  const user = await this.authService.validateUser(loginDto.email, loginDto.password);
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }
  return this.authService.login(user);
}
```

**2. Generate JWT Token**
```typescript
// modules/auth/auth.service.ts
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
```

**3. Validate JWT Token**
```typescript
// modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Role-Based Access Control (RBAC)

**1. Roles Decorator**
```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

**2. Roles Guard**
```typescript
// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

**3. Usage**
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'teacher')
async create(@Body() dto: CreateCourseDto) {
  return this.coursesService.create(dto);
}
```

---

## Database Integration

### Prisma Service

```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### JSONB Validation

**For multi-language content**:
```typescript
// common/validators/jsonb-validator.ts
import { z } from 'zod';

export const I18nSchema = z.object({
  vi: z.string(),
  en: z.string(),
  zh: z.string(),
});

export function validateI18n(data: any) {
  return I18nSchema.parse(data);
}
```

**Usage in DTOs**:
```typescript
// modules/courses/dto/create-course.dto.ts
import { IsObject } from 'class-validator';
import { I18nSchema } from '@/common/validators/jsonb-validator';

export class CreateCourseDto {
  @IsObject()
  title: { vi: string; en: string; zh: string };

  @IsObject()
  description: { vi: string; en: string; zh: string };
}
```

---

## Error Handling

### Global Exception Filter

```typescript
// common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}
```

**Register in main.ts**:
```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

---

## Testing

### Unit Tests
```typescript
// modules/courses/courses.service.spec.ts
import { Test } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CoursesService, PrismaService],
    }).compile();

    service = module.get(CoursesService);
    prisma = module.get(PrismaService);
  });

  it('should find all courses', async () => {
    const courses = await service.findAll();
    expect(Array.isArray(courses)).toBe(true);
  });
});
```

### E2E Tests
```typescript
// test/courses.e2e-spec.ts
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Courses (e2e)', () => {
  let app;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/courses (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/courses')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```

---

## Related Documentation

- [Frontend Architecture](frontend.md)
- [Database Schema](database.md)
- [Deployment Guide](deployment.md)
- [Prisma Schema](../../apps/api/prisma/schema.prisma)

---

**Last Updated**: 2026-01-05  
**Maintained by**: V-EdFinance Team
