import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { QuestionType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new quiz with questions
   * Uses Prisma transaction for atomicity
   */
  async createQuiz(createQuizDto: CreateQuizDto) {
    const { questions, ...quizData } = createQuizDto;

    return await this.prisma.$transaction(async (tx) => {
      // Create quiz
      const quiz = await tx.quiz.create({
        data: {
          ...quizData,
          published: quizData.published ?? false,
        },
      });

      // Create questions
      const createdQuestions = await Promise.all(
        questions.map((question) =>
          tx.quizQuestion.create({
            data: {
              quizId: quiz.id,
              type: question.type,
              question: question.question,
              options: question.options ?? Prisma.DbNull,
              correctAnswer: question.correctAnswer,
              points: question.points || 1,
              order: question.order,
              explanation: question.explanation ?? Prisma.DbNull,
            },
          }),
        ),
      );

      return {
        ...quiz,
        questions: createdQuestions,
      };
    });
  }

  /**
   * Get quiz by ID (with questions)
   */
  async getQuizById(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return quiz;
  }

  /**
   * Get quiz for student attempt (without correct answers)
   */
  async getQuizForAttempt(id: string) {
    const quiz = await this.getQuizById(id);

    // Remove correct answers for student view
    const questionsWithoutAnswers = quiz.questions.map((q) => {
      const { correctAnswer, explanation, ...rest } = q;
      return rest;
    });

    return {
      ...quiz,
      questions: questionsWithoutAnswers,
    };
  }

  /**
   * Get quizzes by lesson ID
   */
  async getQuizzesByLesson(lessonId: string) {
    return await this.prisma.quiz.findMany({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update quiz
   */
  async updateQuiz(id: string, updateQuizDto: UpdateQuizDto) {
    const { questions, ...quizData } = updateQuizDto;

    // Check if quiz exists
    await this.getQuizById(id);

    return await this.prisma.$transaction(async (tx) => {
      // Update quiz
      const updatedQuiz = await tx.quiz.update({
        where: { id },
        data: quizData,
      });

      // If questions provided, replace them
      if (questions) {
        // Delete existing questions
        await tx.quizQuestion.deleteMany({
          where: { quizId: id },
        });

        // Create new questions
        const createdQuestions = await Promise.all(
          questions.map((question) =>
            tx.quizQuestion.create({
              data: {
                quizId: id,
                type: question.type,
                question: question.question,
                options: question.options ?? Prisma.DbNull,
                correctAnswer: question.correctAnswer,
                points: question.points || 1,
                order: question.order,
                explanation: question.explanation ?? Prisma.DbNull,
              },
            }),
          ),
        );

        return {
          ...updatedQuiz,
          questions: createdQuestions,
        };
      }

      return updatedQuiz;
    });
  }

  /**
   * Delete quiz
   */
  async deleteQuiz(id: string) {
    // Check if quiz exists
    await this.getQuizById(id);

    await this.prisma.quiz.delete({
      where: { id },
    });

    return { message: 'Quiz deleted successfully' };
  }

  /**
   * Submit quiz attempt and auto-grade
   */
  async submitQuizAttempt(userId: string, submitQuizDto: SubmitQuizDto) {
    const { quizId, answers } = submitQuizDto;

    // Get quiz with questions
    const quiz = await this.getQuizById(quizId);

    if (!quiz.published) {
      throw new BadRequestException('Cannot submit attempt for unpublished quiz');
    }

    // Calculate score
    let correctPoints = 0;
    let totalPoints = 0;

    quiz.questions.forEach((question) => {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      const correctAnswer = question.correctAnswer;

      if (this.answersMatch(userAnswer, correctAnswer, question.type)) {
        correctPoints += question.points;
      }
    });

    const percentage = totalPoints > 0 ? (correctPoints / totalPoints) * 100 : 0;

    // Save attempt
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        answers,
        score: correctPoints,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
        completedAt: new Date(),
      },
    });

    return attempt;
  }

  /**
   * Get quiz attempt results
   */
  async getAttemptResults(attemptId: string, userId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    // Verify user owns this attempt
    if (attempt.userId !== userId) {
      throw new BadRequestException('Cannot access another user\'s attempt');
    }

    // Add correctness to each question
    const answersData = attempt.answers as Record<string, any>;
    const questionsWithResults = attempt.quiz.questions.map((q) => ({
      ...q,
      userAnswer: answersData[q.id],
      isCorrect: this.answersMatch(answersData[q.id], q.correctAnswer, q.type),
    }));

    return {
      ...attempt,
      quiz: {
        ...attempt.quiz,
        questions: questionsWithResults,
      },
    };
  }

  /**
   * Compare user answer with correct answer (type-specific)
   * Spike learning: JSON.stringify works for all types
   */
  private answersMatch(userAnswer: any, correctAnswer: any, type: QuestionType): boolean {
    if (!userAnswer) return false;

    switch (type) {
      case QuestionType.SHORT_ANSWER:
        // Case-insensitive, trimmed comparison
        return (
          String(userAnswer).toLowerCase().trim() ===
          String(correctAnswer).toLowerCase().trim()
        );

      case QuestionType.MATCHING:
        // Array comparison (order doesn't matter)
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
          return false;
        }
        const sortedUser = [...userAnswer].sort();
        const sortedCorrect = [...correctAnswer].sort();
        return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);

      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.TRUE_FALSE:
      default:
        // Direct comparison
        return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    }
  }
}
