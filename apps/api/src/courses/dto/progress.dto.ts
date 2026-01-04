import { ApiProperty } from '@nestjs/swagger';
import { ProgressStatus } from '@prisma/client';
import { IsEnum, IsInt, Min, Max, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WatchLogDto {
  @ApiProperty({ description: 'Unix timestamp in milliseconds' })
  @IsInt()
  timestamp: number;

  @ApiProperty({ description: 'Played seconds in video' })
  playedSeconds: number;

  @ApiProperty({ description: 'Played percentage (0.0-1.0)' })
  played: number;

  @ApiProperty({ description: 'Session ID for tracking' })
  sessionId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;
}

export class UpdateProgressDto {
  @ApiProperty({
    enum: ProgressStatus,
    description: 'The progress status of the lesson',
    example: 'IN_PROGRESS',
  })
  @IsEnum(ProgressStatus, {
    message: 'status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED',
  })
  status: ProgressStatus;

  @ApiProperty({
    description: 'Duration spent on the lesson in seconds',
    minimum: 0,
    maximum: 86400,
    example: 300,
  })
  @IsInt({ message: 'durationSpent must be an integer' })
  @Min(0, { message: 'durationSpent must be at least 0' })
  @Max(86400, {
    message: 'durationSpent cannot exceed 86400 seconds (24 hours)',
  })
  durationSpent: number;

  @ApiProperty({
    description: 'Watch logs for anti-cheat validation (required for COMPLETED status)',
    type: [WatchLogDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WatchLogDto)
  watchLogs?: WatchLogDto[];
}
