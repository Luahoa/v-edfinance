# 🛠️ Database Tools Guide - V-EdFinance

Hướng dẫn sử dụng 4 công cụ database đã được cài đặt cho dự án.

---

## 📊 1. Prisma ERD Generator

**Mục đích:** Tự động tạo sơ đồ quan hệ thực thể (ERD) từ schema.prisma

### Cài đặt
Đã cấu hình trong `apps/api/prisma/schema.prisma`:
```prisma
generator erd {
  provider = "prisma-erd-generator"
  output   = "../docs/erd.svg"
  theme    = "forest"
}
```

### Sử dụng

```bash
cd apps/api

# Tạo ERD diagram
npx prisma generate

# File ERD sẽ được tạo tại: apps/api/docs/erd.svg
```

### Tùy chọn Theme
- `default` - Mermaid default
- `forest` - Green theme (đang dùng)
- `dark` - Dark mode
- `neutral` - Neutral colors

### Output formats
Thay đổi extension trong `output` để đổi format:
- `.svg` - Vector (khuyến nghị)
- `.png` - Raster image
- `.pdf` - PDF document
- `.md` - Mermaid markdown

---

## 🌱 2. Snaplet (Seeding)

**Mục đích:** Tạo dữ liệu giả (mock data) realistic cho testing

### Packages đã cài
- `@snaplet/seed` - Core seeding library
- `@snaplet/copycat` - Deterministic fake data

### Setup lần đầu

```bash
cd apps/api

# Khởi tạo Snaplet config
npx @snaplet/seed init

# Sẽ tạo file: seed.config.ts
```

### Cấu hình cơ bản

Tạo file `apps/api/seed.config.ts`:
```typescript
import { defineConfig } from '@snaplet/seed/config';
import { SeedPostgres } from '@snaplet/seed/adapter-postgres';

export default defineConfig({
  adapter: () => new SeedPostgres(process.env.DATABASE_URL!),
  select: ['!_prisma_migrations'], // Bỏ qua migration table
});
```

### Tạo seed file

Tạo file `apps/api/prisma/seeds/dev-seed.ts`:
```typescript
import { createSeedClient } from '@snaplet/seed';
import { copycat } from '@snaplet/copycat';

async function main() {
  const seed = await createSeedClient();

  // Reset database (cẩn thận!)
  await seed.$resetDatabase();

  // Seed 100 users
  await seed.user((x) =>
    x(100, ({ index }) => ({
      email: copycat.email(index),
      name: copycat.fullName(index),
      locale: copycat.oneOf(index, ['vi', 'en', 'zh']),
    }))
  );

  // Seed 50 courses
  await seed.course((x) =>
    x(50, ({ index }) => ({
      title: {
        vi: copycat.sentence(index, { maxWords: 5 }),
        en: copycat.sentence(index * 2, { maxWords: 5 }),
        zh: copycat.sentence(index * 3, { maxWords: 5 }),
      },
      level: copycat.oneOf(index, ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    }))
  );

  console.log('✅ Database seeded successfully!');
  process.exit(0);
}

main();
```

### Chạy seed

```bash
cd apps/api

# Chạy seed file
npx ts-node prisma/seeds/dev-seed.ts

# Hoặc thêm script vào package.json:
# "seed:dev": "ts-node prisma/seeds/dev-seed.ts"
```

### Copycat Helpers (Fake Data)

```typescript
import { copycat } from '@snaplet/copycat';

// Deterministic - cùng input = cùng output
copycat.email('user-1')         // "user1@example.com"
copycat.fullName('user-1')      // "John Doe"
copycat.phoneNumber('user-1')   // "+1-555-123-4567"
copycat.uuid('user-1')          // "550e8400-e29b-..."
copycat.int('user-1', { min: 0, max: 100 })  // 42
copycat.oneOf('user-1', ['A', 'B', 'C'])     // "B"
copycat.dateString('user-1')    // "2023-05-15"
copycat.paragraph('user-1')     // Long text
```

---

## 🗄️ 3. NocoDB (Database Management UI)

**Mục đích:** Giao diện bảng tính để xem/sửa database mà không cần code

### Khởi động NocoDB

```bash
# Từ root project
docker-compose -f docker-compose.nocodb.yml up -d

# Truy cập: http://localhost:8080
```

### Kết nối với Database hiện có

1. Mở http://localhost:8080
2. Tạo account admin
3. Click "New Base" → "Connect to External Database"
4. Nhập connection string:
   ```
   postgres://postgres:password@host.docker.internal:5432/vedfinance
   ```
   (Thay `password` và `5432` theo config của bạn)

### Kết nối với Database trong docker-compose.nocodb.yml

NocoDB đã được cấu hình sẵn để kết nối với PostgreSQL:
- **Host:** postgres (internal docker network)
- **Port:** 5432
- **Database:** vedfinance

### Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| **Grid View** | Xem data như Excel/Google Sheets |
| **Form View** | Tạo form nhập liệu tự động |
| **Gallery View** | Xem dạng thẻ ảnh |
| **Kanban View** | Xem dạng board |
| **API** | Tự động generate REST API |
| **Filters** | Lọc data phức tạp |
| **Sort** | Sắp xếp multi-column |
| **Relations** | Hiển thị quan hệ giữa tables |

### Dừng NocoDB

```bash
docker-compose -f docker-compose.nocodb.yml down

# Xóa data (reset hoàn toàn):
docker-compose -f docker-compose.nocodb.yml down -v
```

---

## 🔍 4. Kysely (Type-Safe Query Builder)

**Mục đích:** Viết SQL phức tạp với TypeScript type-safety

### Packages đã cài
- `kysely` - Core query builder
- `pg` - PostgreSQL driver
- `prisma-kysely` - Tự động generate types từ Prisma

### Generate Types

```bash
cd apps/api

# Mỗi khi thay đổi schema.prisma:
npx prisma generate

# Sẽ tạo:
# - src/database/types.ts
# - src/database/enums.ts
```

### Sử dụng trong NestJS

**1. Import KyselyModule vào AppModule:**

```typescript
// app.module.ts
import { KyselyModule } from './database';

@Module({
  imports: [
    ConfigModule.forRoot(),
    KyselyModule,
    // ... other modules
  ],
})
export class AppModule {}
```

**2. Inject KyselyService vào Service:**

```typescript
import { Injectable } from '@nestjs/common';
import { KyselyService } from '../database';

@Injectable()
export class AnalyticsService {
  constructor(private readonly kysely: KyselyService) {}

  async getDailyActiveUsers(days: number = 30) {
    return this.kysely.query
      .selectFrom('BehaviorLog')
      .select([
        sql<string>`DATE(created_at)`.as('date'),
        sql<number>`COUNT(DISTINCT user_id)`.as('dau'),
      ])
      .where('createdAt', '>=', sql`NOW() - INTERVAL '${days} days'`)
      .groupBy(sql`DATE(created_at)`)
      .orderBy('date', 'desc')
      .execute();
  }
}
```

### Query Examples

**Select với Join:**
```typescript
const result = await db
  .selectFrom('User')
  .innerJoin('Course', 'Course.instructorId', 'User.id')
  .select(['User.name', 'Course.title'])
  .where('User.locale', '=', 'vi')
  .execute();
```

**Aggregate Functions:**
```typescript
const stats = await db
  .selectFrom('Transaction')
  .select([
    'userId',
    sql<number>`SUM(amount)`.as('totalSpent'),
    sql<number>`COUNT(*)`.as('txCount'),
  ])
  .groupBy('userId')
  .having(sql`SUM(amount)`, '>', 1000)
  .execute();
```

**Subquery:**
```typescript
const activeUsers = await db
  .selectFrom('User')
  .selectAll()
  .where('id', 'in',
    db.selectFrom('BehaviorLog')
      .select('userId')
      .where('createdAt', '>=', sql`NOW() - INTERVAL '7 days'`)
  )
  .execute();
```

**Insert/Update/Delete:**
```typescript
// Insert
await db
  .insertInto('User')
  .values({ email: 'test@example.com', name: 'Test User' })
  .execute();

// Update
await db
  .updateTable('User')
  .set({ name: 'Updated Name' })
  .where('id', '=', userId)
  .execute();

// Delete
await db
  .deleteFrom('BehaviorLog')
  .where('createdAt', '<', sql`NOW() - INTERVAL '90 days'`)
  .execute();
```

**Raw SQL (escape hatch):**
```typescript
const results = await sql<{ count: number }>`
  SELECT COUNT(*) as count 
  FROM "User" 
  WHERE locale = ${locale}
`.execute(db);
```

---

## 📋 Quick Reference

| Tool | Command | Output |
|------|---------|--------|
| **ERD** | `npx prisma generate` | `docs/erd.svg` |
| **Snaplet** | `npx ts-node prisma/seeds/dev-seed.ts` | Seeded DB |
| **NocoDB** | `docker-compose -f docker-compose.nocodb.yml up -d` | http://localhost:8080 |
| **Kysely** | Import `KyselyService` | Type-safe queries |

---

## 🔧 Scripts đề xuất thêm vào package.json

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:erd": "prisma generate && echo 'ERD generated at docs/erd.svg'",
    "db:seed:dev": "ts-node prisma/seeds/dev-seed.ts",
    "db:nocodb:up": "docker-compose -f ../../docker-compose.nocodb.yml up -d",
    "db:nocodb:down": "docker-compose -f ../../docker-compose.nocodb.yml down"
  }
}
```

---

## ⚠️ Lưu ý quan trọng

1. **ERD Generator** yêu cầu Chrome/Chromium (puppeteer đã tự cài)
2. **Snaplet** seed sẽ XÓA data hiện có khi dùng `$resetDatabase()`
3. **NocoDB** nên chỉ dùng cho development, KHÔNG dùng production
4. **Kysely types** cần regenerate mỗi khi thay đổi `schema.prisma`

---

*Generated for V-EdFinance project*
