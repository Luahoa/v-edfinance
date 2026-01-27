import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class LogEventDto {
  @ApiProperty({ description: 'Session ID tracking the user session' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Path where the event occurred' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({ description: 'Type of event (e.g., click, view, scroll)' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({
    description: 'Category of the action (e.g., COURSE, SOCIAL, SIMULATION)',
    required: false,
  })
  @IsString()
  @IsOptional()
  actionCategory?: string;

  @ApiProperty({ description: 'Duration in milliseconds', required: false })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiProperty({ description: 'Device information metadata', required: false })
  @IsObject()
  @IsOptional()
  deviceInfo?: any;

  @ApiProperty({ description: 'Additional event payload', required: false })
  @IsObject()
  @IsOptional()
  payload?: any;
}
