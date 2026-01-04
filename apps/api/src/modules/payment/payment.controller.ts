import { Controller, Logger, Post, Get, Body, Param, UseGuards, Req, NotFoundException, BadRequestException, UnauthorizedException, Headers, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { StripeService } from './services/stripe.service';
import { TransactionService } from './services/transaction.service';
import { WebhookService } from './services/webhook.service';
import { CreateCheckoutSessionDto, CheckoutSessionResponseDto, TransactionResponseDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly transactionService: TransactionService,
    private readonly webhookService: WebhookService,
  ) {}

  @Post('create-checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Checkout Session for course purchase' })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created successfully',
    type: CheckoutSessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (course not found, already purchased, etc.)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCheckoutSession(
    @Req() req: any,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    const userId = req.user.id;
    this.logger.log(`Creating checkout session for user ${userId}, course ${dto.courseId}`);

    // Get course details
    const course = await this.transactionService['prisma'].course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${dto.courseId} not found`);
    }

    if (!course.published) {
      throw new BadRequestException(`Course ${dto.courseId} is not published and cannot be purchased`);
    }

    // Create transaction record (this will check for duplicate purchases)
    const transaction = await this.transactionService.createTransaction({
      userId,
      courseId: dto.courseId,
      amount: course.price,
      currency: 'vnd',
    });

    // Get or create Stripe customer
    let stripeCustomerId = req.user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripeService.createCustomer({
        email: req.user.email,
        name: typeof req.user.name === 'object' ? req.user.name.vi || req.user.name.en : req.user.name,
        metadata: {
          userId: req.user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await this.transactionService['prisma'].user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });

      this.logger.log(`Created Stripe customer ${stripeCustomerId} for user ${userId}`);
    }

    // Get course title (localized)
    const courseTitle = typeof course.title === 'object' 
      ? course.title.vi || course.title.en || course.title.zh 
      : course.title;

    // Create Stripe Checkout Session
    const session = await this.stripeService.createCheckoutSession({
      mode: 'payment',
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'vnd',
            product_data: {
              name: courseTitle,
              description: `V-EdFinance Course: ${courseTitle}`,
              images: course.thumbnailKey ? [`${process.env.R2_PUBLIC_URL}/${course.thumbnailKey}`] : [],
            },
            unit_amount: course.price,
          },
          quantity: 1,
        },
      ],
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      metadata: {
        transactionId: transaction.id,
        userId,
        courseId: dto.courseId,
      },
    });

    // Update transaction with Stripe session ID
    await this.transactionService.updateTransaction(transaction.id, {
      stripeSessionId: session.id,
      status: 'PROCESSING' as any,
    });

    this.logger.log(`Checkout session created: ${session.id} for transaction ${transaction.id}`);

    return {
      sessionId: session.id,
      url: session.url!,
      transactionId: transaction.id,
    };
  }

  @Get('transaction/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction details',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized to view this transaction' })
  async getTransaction(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionService.getTransactionById(id);

    // Authorization check - user can only view their own transactions
    if (transaction.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('You are not authorized to view this transaction');
    }

    return transaction;
  }

  @Get('transactions/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all transactions for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of user transactions',
    type: [TransactionResponseDto],
  })
  async getMyTransactions(@Req() req: any): Promise<TransactionResponseDto[]> {
    const userId = req.user.id;
    return this.transactionService.getUserTransactions(userId);
  }

  @Get('transactions/stats/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction statistics for current user' })
  @ApiResponse({ status: 200, description: 'User transaction statistics' })
  async getMyTransactionStats(@Req() req: any) {
    const userId = req.user.id;
    return this.transactionService.getUserTransactionStats(userId);
  }

  @Post('webhook')
  @ApiExcludeEndpoint() // Exclude from Swagger docs (used by Stripe, not frontend)
  @ApiOperation({ summary: 'Stripe webhook endpoint (internal use only)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    this.logger.log('Received Stripe webhook');

    // Get raw body from request
    // NestJS requires raw body middleware to be configured for webhook signature verification
    const rawBody = req.rawBody || (req.body as any);

    if (!rawBody) {
      throw new BadRequestException('Missing raw body for webhook signature verification');
    }

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    return this.webhookService.processWebhookEvent(rawBody, signature);
  }
}
