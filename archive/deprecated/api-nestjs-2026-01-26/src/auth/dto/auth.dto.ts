import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * V-SEC-004: I18n name structure validation
 * Ensures all locales are present and valid
 */
class I18nNameDto {
  @IsString()
  @IsNotEmpty()
  vi: string;

  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  zh: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecureP@ss123',
    description:
      'Password must be at least 12 characters, contain 1 uppercase, 1 lowercase, 1 number, and 1 special character',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(12, {
    message:
      'Password must be at least 12 characters long (PCI DSS compliance)',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
    {
      message:
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)',
    },
  )
  password: string;

  @ApiProperty({
    example: { vi: 'Nguyễn Văn A', en: 'John Doe', zh: '张三' },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nNameDto)
  name?: I18nNameDto;

  @ApiProperty({ enum: Role, default: Role.STUDENT, required: false })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
