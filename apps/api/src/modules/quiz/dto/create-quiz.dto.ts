import { QuestionType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuizQuestionDto {
  @IsEnum(QuestionType)
  @IsNotEmpty()
  type: QuestionType;

  @IsObject()
  @IsNotEmpty()
  question: Record<string, string>; // { vi: "...", en: "...", zh: "..." }

  @IsOptional()
  @IsObject()
  options?: Record<string, any>; // For MULTIPLE_CHOICE, MATCHING

  @IsNotEmpty()
  correctAnswer: any; // Can be string, boolean, or array

  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number;

  @IsInt()
  @Min(0)
  order: number;

  @IsOptional()
  @IsObject()
  explanation?: Record<string, string>; // Localized explanation
}

export class CreateQuizDto {
  @IsUUID()
  @IsNotEmpty()
  lessonId: string;

  @IsObject()
  @IsNotEmpty()
  title: Record<string, string>; // Localized

  @IsOptional()
  @IsObject()
  description?: Record<string, string>; // Localized

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions: CreateQuizQuestionDto[];
}
