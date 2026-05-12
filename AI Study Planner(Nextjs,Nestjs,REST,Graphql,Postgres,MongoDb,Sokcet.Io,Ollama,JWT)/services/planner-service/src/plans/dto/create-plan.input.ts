import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber } from 'class-validator';

@InputType()
export class CreateTaskInput {
  @Field()
  @IsString()
  title: string;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @IsOptional()
  timeMinutes?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deadline?: string;
}

@InputType()
export class CreateTopicInput {
  @Field()
  @IsString()
  name: string;

  @Field(() => [CreateTaskInput], { nullable: true })
  @IsOptional()
  tasks?: CreateTaskInput[];
}

@InputType()
export class CreatePlanInput {
  @Field()
  @IsString()
  title: string;

  @Field()
  @IsString()
  userId: string;

  @Field(() => [CreateTopicInput], { nullable: true })
  @IsOptional()
  topics?: CreateTopicInput[];
}
