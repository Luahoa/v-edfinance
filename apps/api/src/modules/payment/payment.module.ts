import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { StripeService } from './services/stripe.service';
import { TransactionService } from './services/transaction.service';
import { WebhookService } from './services/webhook.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [PaymentController],
  providers: [StripeService, TransactionService, WebhookService],
  exports: [StripeService, TransactionService, WebhookService],
})
export class PaymentModule {}
