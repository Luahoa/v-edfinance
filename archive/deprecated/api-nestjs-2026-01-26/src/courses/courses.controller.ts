import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { type Level, Role } from '@prisma/client';
import type { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { CoursesService } from './courses.service';
import type { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import type { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import type { UpdateProgressDto } from './dto/progress.dto';
import type { GetCourseRosterQueryDto } from './dto/roster.dto';
import type { RosterService } from './roster.service';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly rosterService: RosterService,
    private readonly aiService: AiService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  createCourse(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(createCourseDto);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('level') level?: Level
  ) {
    return this.coursesService.findAllCourses({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      level,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOneCourse(id);
  }

  @Get('lessons/:id')
  findLesson(@Param('id') id: string) {
    return this.coursesService.findOneLesson(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  updateCourse(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.updateCourse(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  removeCourse(@Param('id') id: string) {
    return this.coursesService.removeCourse(id);
  }

  @Post('lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  createLesson(@Body() createLessonDto: CreateLessonDto) {
    return this.coursesService.createLesson(createLessonDto);
  }

  @Patch('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  updateLesson(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.coursesService.updateLesson(id, updateLessonDto);
  }

  @Delete('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  removeLesson(@Param('id') id: string) {
    return this.coursesService.removeLesson(id);
  }

  @Post('lessons/:id/progress')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  updateProgress(
    @Param('id') lessonId: string,
    @Request() req: any,
    @Body() body: UpdateProgressDto
  ) {
    return this.coursesService.updateProgress(
      req.user.userId,
      lessonId,
      body.status,
      body.durationSpent,
      body.watchLogs
    );
  }

  @Get(':id/mentor-advice')
  @UseGuards(JwtAuthGuard)
  getMentorAdvice(@Param('id') id: string, @Request() req: any) {
    return this.aiService.getCourseAdvice(id, req.user.userId);
  }

  /**
   * Get roster of students enrolled in a course (admin/instructor)
   *
   * GET /api/courses/:id/roster
   */
  @Get(':id/roster')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  getCourseRoster(@Param('id') courseId: string, @Query() query: GetCourseRosterQueryDto) {
    return this.rosterService.getCourseRoster(courseId, query);
  }

  /**
   * Get individual student progress for a course (admin/instructor)
   *
   * GET /api/courses/:courseId/roster/:userId
   */
  @Get(':courseId/roster/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  getStudentProgress(@Param('courseId') courseId: string, @Param('userId') userId: string) {
    return this.rosterService.getStudentCourseProgress(courseId, userId);
  }
}
