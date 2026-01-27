import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateLessonDto, UpdateLessonDto } from './lesson.dto';
import { LessonType } from '@prisma/client';

describe('CreateLessonDto', () => {
  it('should validate valid DTO without YouTube fields', async () => {
    const dto = new CreateLessonDto();
    dto.courseId = '123e4567-e89b-12d3-a456-426614174000';
    dto.title = { vi: 'Bài học 1', en: 'Lesson 1', zh: '课程 1' };
    dto.content = { vi: 'Nội dung', en: 'Content', zh: '内容' };
    dto.order = 1;
    dto.type = LessonType.VIDEO;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate DTO with valid YouTube URL (watch format)', async () => {
    const dto = new CreateLessonDto();
    dto.courseId = '123e4567-e89b-12d3-a456-426614174000';
    dto.title = { vi: 'Bài học YouTube', en: 'YouTube Lesson', zh: 'YouTube 课程' };
    dto.content = { vi: 'Nội dung', en: 'Content', zh: '内容' };
    dto.order = 1;
    dto.youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    dto.videoType = 'YOUTUBE';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate DTO with valid YouTube URL (short format)', async () => {
    const dto = new CreateLessonDto();
    dto.courseId = '123e4567-e89b-12d3-a456-426614174000';
    dto.title = { vi: 'Bài học', en: 'Lesson', zh: '课程' };
    dto.content = { vi: 'Nội dung', en: 'Content', zh: '内容' };
    dto.order = 1;
    dto.youtubeUrl = 'https://youtu.be/abc123';
    dto.videoType = 'YOUTUBE';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate DTO with yt: prefix format', async () => {
    const dto = new CreateLessonDto();
    dto.courseId = '123e4567-e89b-12d3-a456-426614174000';
    dto.title = { vi: 'Bài học', en: 'Lesson', zh: '课程' };
    dto.content = { vi: 'Nội dung', en: 'Content', zh: '内容' };
    dto.order = 1;
    dto.youtubeUrl = 'yt:xyz789';
    dto.videoType = 'YOUTUBE';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid YouTube URL', async () => {
    const dto = new CreateLessonDto();
    dto.courseId = '123e4567-e89b-12d3-a456-426614174000';
    dto.title = { vi: 'Bài học', en: 'Lesson', zh: '课程' };
    dto.content = { vi: 'Nội dung', en: 'Content', zh: '内容' };
    dto.order = 1;
    dto.youtubeUrl = 'https://example.com/video';
    dto.videoType = 'YOUTUBE';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('youtubeUrl');
    expect(errors[0].constraints?.matches).toContain('Invalid YouTube URL format');
  });

  it('should reject invalid videoType', async () => {
    const dto = new CreateLessonDto();
    dto.courseId = '123e4567-e89b-12d3-a456-426614174000';
    dto.title = { vi: 'Bài học', en: 'Lesson', zh: '课程' };
    dto.content = { vi: 'Nội dung', en: 'Content', zh: '内容' };
    dto.order = 1;
    dto.videoType = 'INVALID' as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('videoType');
  });

  it('should require courseId, title, content, and order', async () => {
    const dto = new CreateLessonDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const properties = errors.map((e) => e.property);
    expect(properties).toContain('courseId');
    expect(properties).toContain('title');
    expect(properties).toContain('content');
    expect(properties).toContain('order');
  });
});

describe('UpdateLessonDto', () => {
  it('should validate DTO with all optional fields empty', async () => {
    const dto = new UpdateLessonDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate DTO with YouTube URL update', async () => {
    const dto = new UpdateLessonDto();
    dto.youtubeUrl = 'https://www.youtube.com/watch?v=newVideo123';
    dto.videoType = 'YOUTUBE';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid YouTube URL in update', async () => {
    const dto = new UpdateLessonDto();
    dto.youtubeUrl = 'not-a-youtube-url';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('youtubeUrl');
  });

  it('should validate partial updates', async () => {
    const dto = new UpdateLessonDto();
    dto.title = { vi: 'Tiêu đề mới', en: 'New title', zh: '新标题' };
    dto.order = 5;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
