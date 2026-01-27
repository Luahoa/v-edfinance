import { IsString, IsNumber, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ============================================================================
// Transaction DTOs
// ============================================================================

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionType {
  COURSE_PURCHASE = 'COURSE_PURCHASE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  CREDITS = 'CREDITS',
  DONATION = 'DONATION',
}

export class CreateTransactionDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clx1234567890',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Course ID (optional for non-course transactions)',
    example: 'clx0987654321',
    required: false,
  })
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiProperty({
    description: 'Amount in smallest currency unit (VND = whole number)',
    example: 500000,
  })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'vnd',
    default: 'vnd',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    default: TransactionType.COURSE_PURCHASE,
  })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
    example: { discountCode: 'SUMMER2024' },
  })
  @IsOptional()
  metadata?: any;
}

export class UpdateTransactionDto {
  @ApiProperty({
    description: 'Transaction status',
    enum: TransactionStatus,
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiProperty({
    description: 'Stripe Checkout Session ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  stripeSessionId?: string;

  @ApiProperty({
    description: 'Stripe Payment Intent ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  stripePaymentIntentId?: string;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  @IsOptional()
  metadata?: any;
}

export class TransactionResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'clx1234567890' })
  userId: string;

  @ApiProperty({ example: 'clx0987654321', nullable: true })
  courseId?: string | null;

  @ApiProperty({ example: 500000 })
  amount: number;

  @ApiProperty({ example: 'vnd' })
  currency: string;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ example: 'cs_test_xxx', nullable: true })
  stripeSessionId?: string | null;

  @ApiProperty({ example: 'pi_test_xxx', nullable: true })
  stripePaymentIntentId?: string | null;

  @ApiProperty({ nullable: true })
  metadata?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  completedAt?: Date | null;

  @ApiProperty({ nullable: true })
  failedAt?: Date | null;

  @ApiProperty({ nullable: true })
  refundedAt?: Date | null;
}

// ============================================================================
// Stripe Checkout DTOs
// ============================================================================

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Course ID to purchase',
    example: 'clx1234567890',
  })
  @IsString()
  courseId: string;

  @ApiProperty({
    description: 'Success URL after payment',
    example: 'https://v-edfinance.com/payment/success',
  })
  @IsString()
  successUrl: string;

  @ApiProperty({
    description: 'Cancel URL if payment is cancelled',
    example: 'https://v-edfinance.com/payment/cancel',
  })
  @IsString()
  cancelUrl: string;
}

export class CheckoutSessionResponseDto {
  @ApiProperty({ example: 'cs_test_xxx' })
  sessionId: string;

  @ApiProperty({ example: 'https://checkout.stripe.com/xxx' })
  url: string;

  @ApiProperty({ example: 'clx1234567890' })
  transactionId: string;
}

// ============================================================================
// Stripe Webhook DTOs
// ============================================================================

export class StripeWebhookDto {
  @ApiProperty({
    description: 'Stripe event type',
    example: 'checkout.session.completed',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Event data object',
  })
  data: any;
}

// ============================================================================
// Payment Intent DTOs (For future use)
// ============================================================================

export class PaymentIntentDto {
  @ApiProperty({
    description: 'Amount in cents',
    example: 2000,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'vnd',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Course ID',
    example: 'clx1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  courseId?: string;
}
