import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';

import { router, protectedProcedure } from '../trpc';
import { quizzes, quizQuestions, quizAttempts } from '../../../drizzle/schema';

export const quizRouter = router({
  // Get quiz by ID with questions
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const quiz = await ctx.db.query.quizzes.findFirst({
        where: eq(quizzes.id, input.id),
        with: {
          questions: {
            orderBy: quizQuestions.order,
          },
        },
      });
      return quiz;
    }),

  // Get quizzes for a lesson
  getByLesson: protectedProcedure
    .input(z.object({ lessonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const lessonQuizzes = await ctx.db.query.quizzes.findMany({
        where: and(
          eq(quizzes.lessonId, input.lessonId),
          eq(quizzes.published, true)
        ),
      });
      return lessonQuizzes;
    }),

  // Submit quiz attempt
  submit: protectedProcedure
    .input(
      z.object({
        quizId: z.string(),
        answers: z.record(z.string(), z.unknown()), // questionId -> answer
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get quiz with questions to calculate score
      const quiz = await ctx.db.query.quizzes.findFirst({
        where: eq(quizzes.id, input.quizId),
        with: {
          questions: true,
        },
      });

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Calculate score
      let score = 0;
      const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

      for (const question of quiz.questions) {
        const userAnswer = input.answers[question.id];
        if (JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)) {
          score += question.points;
        }
      }

      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

      // Create attempt record
      const [attempt] = await ctx.db
        .insert(quizAttempts)
        .values({
          userId: ctx.user.id,
          quizId: input.quizId,
          answers: input.answers,
          score,
          percentage,
          completedAt: new Date(),
        })
        .returning();

      return attempt;
    }),

  // Get user's attempts for a quiz
  getAttempts: protectedProcedure
    .input(z.object({ quizId: z.string() }))
    .query(async ({ ctx, input }) => {
      const attempts = await ctx.db.query.quizAttempts.findMany({
        where: and(
          eq(quizAttempts.userId, ctx.user.id),
          eq(quizAttempts.quizId, input.quizId)
        ),
        orderBy: desc(quizAttempts.startedAt),
      });
      return attempts;
    }),
});
