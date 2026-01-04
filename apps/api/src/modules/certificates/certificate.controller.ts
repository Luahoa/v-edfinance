import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CertificateService } from './services/certificate.service';
import { GenerateCertificateDto, CertificateResponseDto } from './dto/certificate.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('certificates')
@Controller('certificates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  /**
   * Generate certificate for a completed course
   * 
   * POST /api/certificates/generate
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate certificate for completed course',
    description:
      'Validates course completion, generates PDF certificate, uploads to Cloudflare R2, and stores record in database. Idempotent - returns existing certificate if already generated.',
  })
  @ApiResponse({
    status: 201,
    description: 'Certificate generated successfully',
    type: CertificateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Course not completed yet',
  })
  @ApiResponse({
    status: 404,
    description: 'Course progress not found',
  })
  async generateCertificate(
    @Body() dto: GenerateCertificateDto
  ): Promise<CertificateResponseDto> {
    return this.certificateService.generateCertificate(dto);
  }

  /**
   * Get certificate by ID
   * 
   * GET /api/certificates/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get certificate by ID',
    description: 'Retrieve certificate details including PDF URL',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate found',
    type: CertificateResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate not found',
  })
  async getCertificate(@Param('id') id: string): Promise<CertificateResponseDto> {
    return this.certificateService.getCertificate(id);
  }

  /**
   * Get all certificates for a user
   * 
   * GET /api/certificates/user/:userId
   */
  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get all certificates for a user',
    description: 'List all certificates earned by a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'User certificates retrieved',
    type: [CertificateResponseDto],
  })
  async getUserCertificates(
    @Param('userId') userId: string
  ): Promise<CertificateResponseDto[]> {
    return this.certificateService.getUserCertificates(userId);
  }

  /**
   * Get all certificates for a course (admin/instructor only)
   * 
   * GET /api/certificates/course/:courseId
   */
  @Get('course/:courseId')
  @ApiOperation({
    summary: 'Get all certificates for a course',
    description: 'List all certificates issued for a specific course (admin/instructor)',
  })
  @ApiResponse({
    status: 200,
    description: 'Course certificates retrieved',
    type: [CertificateResponseDto],
  })
  async getCourseCertificates(
    @Param('courseId') courseId: string
  ): Promise<CertificateResponseDto[]> {
    return this.certificateService.getCourseCertificates(courseId);
  }
}
