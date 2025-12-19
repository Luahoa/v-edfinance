import { IsNotEmpty, IsObject } from 'class-validator';

export class LocalizedFieldDto {
  @IsNotEmpty()
  vi: string;

  @IsNotEmpty()
  en: string;

  @IsNotEmpty()
  zh: string;
}

export class CreateCourseDto {
  @IsObject()
  title: LocalizedFieldDto;

  @IsObject()
  description: LocalizedFieldDto;

  @IsNotEmpty()
  slug: string;

  @IsNotEmpty()
  price: number;
}
