import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class AiMentoringDto {
  @IsString()
  @IsNotEmpty()
  userQuery: string;

  @IsString()
  @IsOptional()
  module?: string;

  @IsString()
  @IsOptional()
  lesson?: string;

  @IsString()
  @IsOptional()
  locale?: string;
}
