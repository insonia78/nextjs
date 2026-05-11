import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { StudyPlan } from './study-plan.entity';
import { CreatePlanInput } from './dto/create-plan.input';
import { Topic } from './topic.entity';
import { Task } from './task.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(StudyPlan)
    private readonly repo: Repository<StudyPlan>,
  ) {}

  async findAll(userId: string): Promise<StudyPlan[]> {
    return this.repo.find({ where: { userId } });
  }

  async findOne(id: string): Promise<StudyPlan> {
    const plan = await this.repo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(input: CreatePlanInput): Promise<StudyPlan> {
    const plan = this.repo.create({
      id: randomUUID(),
      title: input.title,
      userId: input.userId,
      topics:
        input.topics?.map((topicInput) => {
          const topic = new Topic();
          topic.id = randomUUID();
          topic.name = topicInput.name;
          topic.tasks =
            topicInput.tasks?.map((taskInput) => {
              const task = new Task();
              task.id = randomUUID();
              task.title = taskInput.title;
              task.timeMinutes = taskInput.timeMinutes ?? 30;
              task.deadline = taskInput.deadline;
              task.status = 'pending';
              return task;
            }) ?? [];
          return topic;
        }) ?? [],
    });

    return this.repo.save(plan);
  }

  async delete(id: string): Promise<boolean> {
    await this.repo.delete(id);
    return true;
  }
}
