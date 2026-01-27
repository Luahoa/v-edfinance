import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';
import { CreateQuizDto, CreateQuizQuestionDto } from './create-quiz.dto';

export class UpdateQuizDto extends PartialType(CreateQuizDto) {
  @IsOptional()
  @IsObject()
  title?: Record<string, string>;

  @IsOptional()
  @IsObject()
  description?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  questions?: CreateQuizQuestionDto[];
}
