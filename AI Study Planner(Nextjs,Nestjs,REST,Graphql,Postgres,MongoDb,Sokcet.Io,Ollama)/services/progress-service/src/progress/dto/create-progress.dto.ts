import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreateProgressDto {
  @IsString()
  userId: string;

  @IsString()
  taskId: string;

  @IsEnum(['completed', 'in_progress', 'pending'])
  status: string;

  @IsNumber()
  timeSpent: number;

  @IsString()
  @IsOptional()
  planId?: string;

  @IsString()
  @IsOptional()
  topicId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
