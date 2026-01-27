import { IsInt, IsNotEmpty, IsObject, IsString, IsUUID } from 'class-validator';

export class UpdateInvestmentProfileDto {
  @IsInt()
  riskScore: number;

  @IsObject()
  investmentPhilosophy: Record<string, string>;

  @IsObject()
  financialGoals: Record<string, string>;

  @IsString()
  @IsNotEmpty()
  currentKnowledge: string;
}
