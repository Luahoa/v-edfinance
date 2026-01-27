import { Type } from 'class-transformer';
import {
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class LocalizedStringDto {
  @IsString()
  vi: string;

  @IsString()
  en: string;

  @IsString()
  zh: string;
}

export class CourseMetadataDto {
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title: LocalizedStringDto;

  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description: LocalizedStringDto;
}

export class InvestmentProfileMetadataDto {
  @IsObject()
  investmentPhilosophy: any; // Could be further detailed

  @IsObject()
  financialGoals: any;
}
