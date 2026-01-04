import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsObject,
  MinLength,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class I18nTextDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vi?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  en?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  zh?: string;
}

export class UpdateUserDto {
  @ApiProperty({
    required: false,
    description: 'User display name (i18n format)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  name?: I18nTextDto;

  @ApiProperty({
    required: false,
    enum: ['vi', 'en', 'zh'],
    description: 'Preferred locale',
  })
  @IsOptional()
  @IsString()
  @IsIn(['vi', 'en', 'zh'], {
    message: 'preferredLocale must be one of: vi, en, zh',
  })
  preferredLocale?: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
