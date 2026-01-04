import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { R2StorageService } from './r2-storage.service';

export interface GenerateCertificateRequest {
  userId: string;
  courseId: string;
  locale?: 'vi' | 'en' | 'zh';
}

export interface CertificateResponse {
  id: string;
  userId: string;
  courseId: string;
  studentName: string;
  courseTitle: string;
  completedAt: Date;
  pdfUrl: string;
  metadata: {
    generationTime: number;
    fileSize: number;
    fontUsed: string;
  };
}

/**
 * Certificate Service - Main orchestration layer
 * 
 * Responsibilities:
 * 1. Validate user course completion
 * 2. Generate PDF certificate
 * 3. Upload to Cloudflare R2
 * 4. Store certificate record in database
 */
@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly r2Storage: R2StorageService
  ) {}

  /**
   * Generate certificate for a user who completed a course
   * 
   * Steps:
   * 1. Validate course completion (100% progress)
   * 2. Check if certificate already exists (idempotent)
   * 3. Generate PDF
   * 4. Upload to R2
   * 5. Save to database
   */
  async generateCertificate(
    request: GenerateCertificateRequest
  ): Promise<CertificateResponse> {
    const { userId, courseId, locale = 'vi' } = request;

    this.logger.log(`Generating certificate for user=${userId}, course=${courseId}`);

    // 1. Check if certificate already exists
    const existingCertificate = await this.prisma.certificate.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (existingCertificate) {
      this.logger.log('Certificate already exists, returning existing one');
      return this.mapToResponse(existingCertificate);
    }

    // 2. Validate course completion - Get user and course data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verify user has completed all lessons in the course
    const allLessons = await this.prisma.lesson.findMany({
      where: { courseId, published: true },
    });

    const completedLessons = await this.prisma.userProgress.count({
      where: {
        userId,
        lesson: { courseId },
        status: 'COMPLETED',
      },
    });

    if (completedLessons < allLessons.length) {
      throw new Error(`Course not completed yet. Completed ${completedLessons}/${allLessons.length} lessons.`);
    }

    // 3. Extract localized names
    const studentName = this.extractLocalizedString(user.name, locale);
    const courseTitle = this.extractLocalizedString(course.title, locale);

    // 4. Generate certificate ID
    const certificateId = this.generateCertificateId();

    // 5. Generate PDF
    const pdfResult = await this.pdfGenerator.generateCertificatePdf({
      recipientName: studentName,
      courseTitle,
      completedAt: new Date(),
      certificateId,
      locale,
    });

    // 6. Upload to R2
    const uploadResult = await this.r2Storage.uploadCertificate({
      buffer: pdfResult.buffer,
      certificateId,
      userId,
      courseId,
    });

    // 7. Save to database
    const certificate = await this.prisma.certificate.create({
      data: {
        id: certificateId,
        userId,
        courseId,
        studentName: {
          vi: this.extractLocalizedString(user.name, 'vi'),
          en: this.extractLocalizedString(user.name, 'en'),
          zh: this.extractLocalizedString(user.name, 'zh'),
        },
        courseTitle: {
          vi: this.extractLocalizedString(course.title, 'vi'),
          en: this.extractLocalizedString(course.title, 'en'),
          zh: this.extractLocalizedString(course.title, 'zh'),
        },
        completedAt: new Date(),
        pdfUrl: uploadResult.url,
        metadata: pdfResult.metadata,
      },
    });

    this.logger.log(`Certificate generated successfully: ${certificate.id}`);

    return this.mapToResponse(certificate);
  }

  /**
   * Get certificate by ID
   */
  async getCertificate(certificateId: string): Promise<CertificateResponse> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return this.mapToResponse(certificate);
  }

  /**
   * Get all certificates for a user
   */
  async getUserCertificates(userId: string): Promise<CertificateResponse[]> {
    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    return certificates.map((cert: any) => this.mapToResponse(cert));
  }

  /**
   * Get all certificates for a course (admin/instructor)
   */
  async getCourseCertificates(courseId: string): Promise<CertificateResponse[]> {
    const certificates = await this.prisma.certificate.findMany({
      where: { courseId },
      orderBy: { completedAt: 'desc' },
    });

    return certificates.map((cert: any) => this.mapToResponse(cert));
  }

  /**
   * Helper: Generate unique certificate ID
   */
  private generateCertificateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `cert-${timestamp}-${random}`;
  }

  /**
   * Helper: Extract localized string from JSON field
   */
  private extractLocalizedString(
    jsonField: any,
    locale: 'vi' | 'en' | 'zh'
  ): string {
    if (typeof jsonField === 'string') {
      return jsonField;
    }

    if (typeof jsonField === 'object' && jsonField !== null) {
      return jsonField[locale] || jsonField.vi || jsonField.en || Object.values(jsonField)[0] || '';
    }

    return '';
  }

  /**
   * Helper: Map database model to response DTO
   */
  private mapToResponse(certificate: any): CertificateResponse {
    return {
      id: certificate.id,
      userId: certificate.userId,
      courseId: certificate.courseId,
      studentName: this.extractLocalizedString(certificate.studentName, 'vi'),
      courseTitle: this.extractLocalizedString(certificate.courseTitle, 'vi'),
      completedAt: certificate.completedAt,
      pdfUrl: certificate.pdfUrl || '',
      metadata: certificate.metadata || {
        generationTime: 0,
        fileSize: 0,
        fontUsed: 'Inter',
      },
    };
  }
}
