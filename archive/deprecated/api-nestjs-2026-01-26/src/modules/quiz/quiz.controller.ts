import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ============================================================================
  // TEACHER ENDPOINTS (Create, Read, Update, Delete)
  // ============================================================================

  /**
   * POST /api/quiz - Create new quiz (Teacher/Admin only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  createQuiz(@Body() createQuizDto: CreateQuizDto) {
    return this.quizService.createQuiz(createQuizDto);
  }

  /**
   * GET /api/quiz/:id - Get quiz by ID (with correct answers - Teacher/Admin)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  getQuizById(@Param('id') id: string) {
    return this.quizService.getQuizById(id);
  }

  /**
   * PUT /api/quiz/:id - Update quiz (Teacher/Admin only)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  updateQuiz(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
    return this.quizService.updateQuiz(id, updateQuizDto);
  }

  /**
   * DELETE /api/quiz/:id - Delete quiz (Teacher/Admin only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  deleteQuiz(@Param('id') id: string) {
    return this.quizService.deleteQuiz(id);
  }

  /**
   * GET /api/quiz/lesson/:lessonId - Get quizzes by lesson (Teacher/Admin)
   */
  @Get('lesson/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  getQuizzesByLesson(@Param('lessonId') lessonId: string) {
    return this.quizService.getQuizzesByLesson(lessonId);
  }

  // ============================================================================
  // STUDENT ENDPOINTS (Attempt, Submit, Results)
  // ============================================================================

  /**
   * GET /api/quiz/:id/attempt - Get quiz for student attempt (no correct answers)
   */
  @Get(':id/attempt')
  @UseGuards(JwtAuthGuard)
  getQuizForAttempt(@Param('id') id: string) {
    return this.quizService.getQuizForAttempt(id);
  }

  /**
   * POST /api/quiz/:id/submit - Submit quiz attempt
   */
  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  submitQuizAttempt(
    @Param('id') id: string,
    @Request() req: any,
    @Body() submitQuizDto: SubmitQuizDto,
  ) {
    const userId = req.user.userId;
    return this.quizService.submitQuizAttempt(userId, submitQuizDto);
  }

  /**
   * GET /api/quiz/:id/results/:attemptId - Get attempt results
   */
  @Get(':id/results/:attemptId')
  @UseGuards(JwtAuthGuard)
  getAttemptResults(@Param('attemptId') attemptId: string, @Request() req: any) {
    const userId = req.user.userId;
    return this.quizService.getAttemptResults(attemptId, userId);
  }
}
