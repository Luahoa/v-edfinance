import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateCertificateDto {
  @ApiProperty({
    description: 'User ID who completed the course',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'Course ID that was completed',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  courseId!: string;

  @ApiProperty({
    description: 'Locale for certificate text',
    enum: ['vi', 'en', 'zh'],
    default: 'vi',
    required: false,
  })
  @IsOptional()
  @IsIn(['vi', 'en', 'zh'])
  locale?: 'vi' | 'en' | 'zh';
}

export class CertificateResponseDto {
  @ApiProperty({
    description: 'Certificate ID',
    example: 'cert-l5x3k9-abc12345',
  })
  id!: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @ApiProperty({
    description: 'Course ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  courseId!: string;

  @ApiProperty({
    description: 'Student name (localized)',
    example: 'Nguyễn Văn B',
  })
  studentName!: string;

  @ApiProperty({
    description: 'Course title (localized)',
    example: 'Tài Chính Hành Vi Cơ Bản',
  })
  courseTitle!: string;

  @ApiProperty({
    description: 'Date of course completion',
    example: '2026-01-04T10:00:00Z',
  })
  completedAt!: Date;

  @ApiProperty({
    description: 'Public URL to certificate PDF on Cloudflare R2',
    example: 'https://pub-abc123.r2.dev/v-edfinance-certificates/certificates/user123/course456/cert-xyz.pdf',
  })
  pdfUrl!: string;

  @ApiProperty({
    description: 'PDF generation metadata',
    example: {
      generationTime: 245,
      fileSize: 123456,
      fontUsed: 'Inter',
    },
  })
  metadata!: {
    generationTime: number;
    fileSize: number;
    fontUsed: string;
  };
}
