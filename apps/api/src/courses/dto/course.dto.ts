import { Level } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsObject()
  @IsNotEmpty()
  title: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  description: Record<string, string>;

  @IsString()
  @IsNotEmpty()
  thumbnailKey: string;

  @IsInt()
  price: number;

  @IsEnum(Level)
  @IsOptional()
  level?: Level;

  @IsOptional()
  published?: boolean;
}

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsObject()
  @IsOptional()
  title?: Record<string, string>;

  @IsObject()
  @IsOptional()
  description?: Record<string, string>;

  @IsString()
  @IsOptional()
  thumbnailKey?: string;

  @IsInt()
  @IsOptional()
  price?: number;

  @IsEnum(Level)
  @IsOptional()
  level?: Level;
}
