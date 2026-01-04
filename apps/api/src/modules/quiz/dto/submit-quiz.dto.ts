import { IsNotEmpty, IsObject, IsUUID } from 'class-validator';

export class SubmitQuizDto {
  @IsUUID()
  @IsNotEmpty()
  quizId: string;

  @IsObject()
  @IsNotEmpty()
  answers: Record<string, any>; // { questionId: userAnswer }
}
