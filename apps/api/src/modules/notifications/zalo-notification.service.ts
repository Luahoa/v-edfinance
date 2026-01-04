import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface UserRegistrationData {
  userId: string;
  phone: string;
  name: string;
  email: string;
}

interface CourseEnrollmentData {
  userId: string;
  phone: string;
  name: string;
  courseId: string;
  courseName: string;
  startDate: string;
}

@Injectable()
export class ZaloNotificationService {
  private readonly logger = new Logger(ZaloNotificationService.name);
  private readonly n8nWebhookUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.n8nWebhookUrl = this.configService.get<string>(
      'N8N_WEBHOOK_URL',
      'http://localhost:5678',
    );
  }

  async sendUserRegistrationNotification(
    data: UserRegistrationData,
  ): Promise<void> {
    try {
      const webhookUrl = `${this.n8nWebhookUrl}/webhook/user-registered`;

      await firstValueFrom(
        this.httpService.post(webhookUrl, data, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      this.logger.log(
        `✅ Sent user registration notification to ${data.phone}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send registration notification: ${error.message}`,
        error.stack,
      );
      // Don't throw - notification failure shouldn't break registration
    }
  }

  async sendCourseEnrollmentNotification(
    data: CourseEnrollmentData,
  ): Promise<void> {
    try {
      const webhookUrl = `${this.n8nWebhookUrl}/webhook/course-enrolled`;

      await firstValueFrom(
        this.httpService.post(webhookUrl, data, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      this.logger.log(
        `✅ Sent course enrollment notification to ${data.phone} for course ${data.courseId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send enrollment notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
