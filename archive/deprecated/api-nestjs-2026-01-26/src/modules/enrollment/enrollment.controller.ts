import { Controller, Post, Body, Get, Param, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { EnrollmentService, type EnrollmentWebhookPayload } from './enrollment.service';

@Controller('enrollment')
export class EnrollmentController {
  private readonly logger = new Logger(EnrollmentController.name);

  constructor(private readonly enrollmentService: EnrollmentService) {}

  /**
   * Webhook endpoint for external enrollment platforms
   * POST /api/enrollment/webhook
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: EnrollmentWebhookPayload): Promise<{ success: boolean }> {
    this.logger.log(`Received enrollment webhook: ${JSON.stringify(payload)}`);

    try {
      await this.enrollmentService.handleEnrollmentWebhook(payload);
      return { success: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's enrollment history
   * GET /api/enrollment/:userId
   */
  @Get(':userId')
  async getUserEnrollments(@Param('userId') userId: string) {
    return this.enrollmentService.getUserEnrollments(userId);
  }

  /**
   * Check if user is enrolled in a course
   * GET /api/enrollment/:userId/:courseId/status
   */
  @Get(':userId/:courseId/status')
  async checkEnrollmentStatus(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
  ) {
    const isEnrolled = await this.enrollmentService.isUserEnrolled(userId, courseId);
    return { enrolled: isEnrolled };
  }
}
