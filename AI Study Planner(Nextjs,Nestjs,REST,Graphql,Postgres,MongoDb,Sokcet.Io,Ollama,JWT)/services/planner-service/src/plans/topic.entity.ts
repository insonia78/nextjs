import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { StudyPlan } from './study-plan.entity';
import { Task } from './task.entity';

@ObjectType()
@Entity('topics')
export class Topic {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @ManyToOne(() => StudyPlan, (plan) => plan.topics, { onDelete: 'CASCADE' })
  plan: StudyPlan;

  @Field(() => [Task])
  @OneToMany(() => Task, (task) => task.topic, { cascade: true, eager: true })
  tasks: Task[];
}
