import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

registerEnumType(TaskStatus, { name: 'TaskStatus' });
registerEnumType(Priority, { name: 'Priority' });

@ObjectType()
export class TaskType {
  @Field(() => ID) id: string;
  @Field() title: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => TaskStatus) status: TaskStatus;
  @Field(() => Priority) priority: Priority;
  @Field({ nullable: true }) assignedTo?: string;
  @Field() teamId: string;
  @Field({ nullable: true }) dueDate?: Date;
  @Field() createdBy: string;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType()
export class DocumentType {
  @Field(() => ID) id: string;
  @Field() title: string;
  @Field() content: string;
  @Field() teamId: string;
  @Field() authorId: string;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}
