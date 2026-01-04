import { LessonType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
} from 'class-validator';

export class CreateLessonDto {
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @IsObject()
  @IsNotEmpty()
  title: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  content: Record<string, string>;

  @IsObject()
  @IsOptional()
  videoKey?: Record<string, string>;

  @IsInt()
  order: number;

  @IsEnum(LessonType)
  @IsOptional()
  type?: LessonType;

  /**
   * YouTube video URL (optional)
   * Supports formats: https://youtube.com/watch?v=ID, https://youtu.be/ID, or yt:ID
   */
  @IsString()
  @IsOptional()
  @Matches(/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|yt:)[a-zA-Z0-9_-]+/, {
    message: 'Invalid YouTube URL format. Use https://youtube.com/watch?v=VIDEO_ID, https://youtu.be/VIDEO_ID, or yt:VIDEO_ID',
  })
  youtubeUrl?: string;

  /**
   * Video source type (FILE or YOUTUBE)
   */
  @IsEnum(['FILE', 'YOUTUBE'])
  @IsOptional()
  videoType?: 'FILE' | 'YOUTUBE';
}

export class UpdateLessonDto {
  @IsObject()
  @IsOptional()
  title?: Record<string, string>;

  @IsObject()
  @IsOptional()
  content?: Record<string, string>;

  @IsObject()
  @IsOptional()
  videoKey?: Record<string, string>;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsEnum(LessonType)
  @IsOptional()
  type?: LessonType;

  @IsString()
  @IsOptional()
  @Matches(/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|yt:)[a-zA-Z0-9_-]+/, {
    message: 'Invalid YouTube URL format. Use https://youtube.com/watch?v=VIDEO_ID, https://youtu.be/VIDEO_ID, or yt:VIDEO_ID',
  })
  youtubeUrl?: string;

  @IsEnum(['FILE', 'YOUTUBE'])
  @IsOptional()
  videoType?: 'FILE' | 'YOUTUBE';
}
