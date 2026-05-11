import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Topic } from './topic.entity';

@ObjectType()
@Entity('study_plans')
export class StudyPlan {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  userId: string;

  @Field()
  @Column({ default: 0 })
  progress: number;

  @Field(() => [Topic])
  @OneToMany(() => Topic, (topic) => topic.plan, { cascade: true, eager: true })
  topics: Topic[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
