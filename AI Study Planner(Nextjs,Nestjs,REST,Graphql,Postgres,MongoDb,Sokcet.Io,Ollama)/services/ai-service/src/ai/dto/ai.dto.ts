import { IsString, IsArray, IsOptional, IsNumber } from 'class-validator';

export class GeneratePlanDto {
  @IsString()
  userId: string;

  @IsString()
  goal: string;

  @IsArray()
  @IsString({ each: true })
  topics: string[];

  @IsNumber()
  @IsOptional()
  hoursPerDay?: number;

  @IsNumber()
  @IsOptional()
  daysAvailable?: number;
}

export class RecommendationDto {
  @IsString()
  userId: string;

  @IsArray()
  recentProgress: {
    topic: string;
    timeSpent: number;
    status: string;
  }[];
}
