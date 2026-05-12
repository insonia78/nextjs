import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Topic } from './topic.entity';

@ObjectType()
@Entity('tasks')
export class Task {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field(() => Int)
  @Column({ default: 30 })
  timeMinutes: number;

  @Field()
  @Column({ default: 'pending' })
  status: string; // 'pending' | 'in_progress' | 'completed'

  @Field({ nullable: true })
  @Column({ nullable: true })
  deadline: string;

  @ManyToOne(() => Topic, (topic) => topic.tasks, { onDelete: 'CASCADE' })
  topic: Topic;
}
