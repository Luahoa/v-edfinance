# Payment Schema Migration Guide

## Overview
This migration adds the Payment System schema to support Stripe payment processing for V-EdFinance.

## Changes Made

### 1. New Model: Transaction

**Purpose:** Track all payment transactions (course purchases, subscriptions, etc.)

**Fields:**
- `id` (String, UUID) - Primary key
- `userId` (String) - Foreign key to User
- `courseId` (String?, nullable) - Foreign key to Course (nullable for non-course transactions)
- `amount` (Int) - Payment amount in smallest currency unit (VND = whole number)
- `currency` (String, default: "vnd") - Currency code
- `status` (TransactionStatus, default: PENDING) - Transaction status
- `type` (TransactionType, default: COURSE_PURCHASE) - Transaction type
- `stripeSessionId` (String?, unique) - Stripe Checkout Session ID
- `stripePaymentIntentId` (String?, unique) - Stripe Payment Intent ID
- `metadata` (Json?) - Additional transaction data (discount codes, etc.)
- `createdAt` (DateTime) - Transaction creation timestamp
- `updatedAt` (DateTime) - Last update timestamp
- `completedAt` (DateTime?) - Payment success timestamp
- `failedAt` (DateTime?) - Payment failure timestamp
- `refundedAt` (DateTime?) - Refund timestamp

**Relations:**
- `user` - Many-to-one to User (onDelete: Cascade)
- `course` - Many-to-one to Course (onDelete: SetNull)

**Indexes:**
- userId
- courseId
- status
- stripeSessionId
- stripePaymentIntentId
- createdAt

### 2. New Enum: TransactionStatus

**Values:**
- `PENDING` - Payment initiated but not completed
- `PROCESSING` - Payment being processed by Stripe
- `COMPLETED` - Payment succeeded
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded
- `CANCELLED` - Payment cancelled by user

### 3. New Enum: TransactionType

**Values:**
- `COURSE_PURCHASE` - One-time course purchase
- `SUBSCRIPTION` - Recurring subscription (future feature)
- `CREDITS` - Platform credits (future feature)
- `DONATION` - Donations (future feature)

### 4. User Model Updates

**Added Fields:**
- `stripeCustomerId` (String?, unique) - Stripe Customer ID for payment processing

**Added Relations:**
- `transactions` (Transaction[]) - User's payment transactions

### 5. Course Model Updates

**Added Relations:**
- `transactions` (Transaction[]) - Transactions for this course

## Migration Commands

### Development Environment

```bash
# Navigate to API directory
cd apps/api

# Generate migration
npx prisma migrate dev --name add_payment_system

# This will:
# 1. Create SQL migration file
# 2. Apply migration to database
# 3. Regenerate Prisma Client
```

### Production Environment

```bash
# Navigate to API directory
cd apps/api

# Apply migration
npx prisma migrate deploy

# Regenerate Prisma Client
npx prisma generate
```

## SQL Preview

The migration will execute SQL similar to:

```sql
-- CreateEnum: TransactionStatus
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum: TransactionType
CREATE TYPE "TransactionType" AS ENUM ('COURSE_PURCHASE', 'SUBSCRIPTION', 'CREDITS', 'DONATION');

-- AlterTable: User - Add stripeCustomerId
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateTable: Transaction
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'vnd',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "type" "TransactionType" NOT NULL DEFAULT 'COURSE_PURCHASE',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_stripeSessionId_key" ON "Transaction"("stripeSessionId");
CREATE UNIQUE INDEX "Transaction_stripePaymentIntentId_key" ON "Transaction"("stripePaymentIntentId");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_courseId_idx" ON "Transaction"("courseId");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX "Transaction_stripeSessionId_idx" ON "Transaction"("stripeSessionId");
CREATE INDEX "Transaction_stripePaymentIntentId_idx" ON "Transaction"("stripePaymentIntentId");
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_courseId_fkey" 
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

## Verification Steps

After migration:

1. **Check Database Schema:**
   ```bash
   npx prisma studio
   ```
   - Verify Transaction table exists
   - Verify User.stripeCustomerId column exists
   - Verify TransactionStatus and TransactionType enums exist

2. **Test Prisma Client:**
   ```bash
   npx prisma generate
   pnpm build
   ```
   - Ensure no TypeScript errors
   - Verify Transaction model is available in Prisma Client

3. **Run Tests:**
   ```bash
   pnpm test
   ```
   - Ensure all existing tests pass
   - New payment tests will be added in subsequent tasks

## Rollback Plan

If you need to rollback this migration:

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back add_payment_system

# Or manually drop tables and columns:
# psql -d v_edfinance -c "DROP TABLE \"Transaction\";"
# psql -d v_edfinance -c "ALTER TABLE \"User\" DROP COLUMN \"stripeCustomerId\";"
# psql -d v_edfinance -c "DROP TYPE \"TransactionStatus\";"
# psql -d v_edfinance -c "DROP TYPE \"TransactionType\";"
```

## Data Considerations

### No Data Migration Needed
This is a new feature, so no existing data needs to be migrated.

### Future Considerations
- When adding subscription support, existing transactions will remain as COURSE_PURCHASE type
- refundedAt timestamp will be set via webhook when refunds occur
- metadata field can store discount codes, promotional campaigns, etc.

## Performance Notes

### Indexes
All critical query paths are indexed:
- `userId` - For user transaction history
- `courseId` - For course revenue reports
- `status` - For filtering by transaction status
- `stripeSessionId` / `stripePaymentIntentId` - For webhook lookups (unique)
- `createdAt` - For time-based analytics

### Expected Query Performance
- User transaction history: O(log n) via userId index
- Course revenue lookup: O(log n) via courseId index
- Webhook processing: O(1) via unique stripeSessionId index

## Next Steps

After this migration:

1. **ved-ejqc:** Implement Checkout API
   - Use Transaction model to create payment records
   - Store stripeSessionId for webhook correlation

2. **ved-do76:** Implement Webhook Handler
   - Query Transaction by stripeSessionId
   - Update status to COMPLETED/FAILED
   - Set completedAt/failedAt timestamps

3. **ved-6s0z:** Build Payment UI
   - Display transaction history to users
   - Show payment status in real-time

## Support

If you encounter issues:
- Check Prisma migrate logs: `apps/api/prisma/migrations/`
- Review database schema: `npx prisma studio`
- Regenerate client: `npx prisma generate`
- Reset database (dev only): `npx prisma migrate reset`

---

**Migration Name:** `add_payment_system`  
**Task:** ved-pqpv  
**Estimated Time:** 180 min  
**Status:** Ready to execute
