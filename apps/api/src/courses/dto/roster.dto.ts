import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetCourseRosterQueryDto {
  @ApiProperty({
    description: 'Page number (1-indexed)',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of students per page',
    example: 20,
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Sort by field',
    enum: ['enrolledAt', 'progress', 'lastActivity', 'name'],
    required: false,
    default: 'enrolledAt',
  })
  @IsOptional()
  @IsIn(['enrolledAt', 'progress', 'lastActivity', 'name'])
  sortBy?: 'enrolledAt' | 'progress' | 'lastActivity' | 'name' = 'enrolledAt';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    description: 'Search by student name or email',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class StudentRosterItemDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @ApiProperty({
    description: 'Student name',
    example: 'Nguyễn Văn A',
  })
  name!: string;

  @ApiProperty({
    description: 'Student email',
    example: 'student@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Enrolled date',
    example: '2026-01-01T10:00:00Z',
  })
  enrolledAt!: Date;

  @ApiProperty({
    description: 'Course progress percentage (0-100)',
    example: 75.5,
  })
  progress!: number;

  @ApiProperty({
    description: 'Number of lessons completed',
    example: 12,
  })
  completedLessons!: number;

  @ApiProperty({
    description: 'Total lessons in course',
    example: 16,
  })
  totalLessons!: number;

  @ApiProperty({
    description: 'Last activity timestamp',
    example: '2026-01-04T15:30:00Z',
  })
  lastActivity!: Date;

  @ApiProperty({
    description: 'Has completed the course',
    example: false,
  })
  completed!: boolean;
}

export class CourseRosterResponseDto {
  @ApiProperty({
    description: 'Course ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  courseId!: string;

  @ApiProperty({
    description: 'Course title',
    example: 'Tài Chính Hành Vi Cơ Bản',
  })
  courseTitle!: string;

  @ApiProperty({
    description: 'Total enrolled students',
    example: 150,
  })
  totalStudents!: number;

  @ApiProperty({
    description: 'List of students in current page',
    type: [StudentRosterItemDto],
  })
  students!: StudentRosterItemDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      currentPage: 1,
      totalPages: 8,
      limit: 20,
      totalStudents: 150,
    },
  })
  pagination!: {
    currentPage: number;
    totalPages: number;
    limit: number;
    totalStudents: number;
  };
}
