import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { StudyPlan } from './study-plan.entity';
import { CreatePlanInput, CreateTaskInput, UpdateTaskInput } from './dto/create-plan.input';
import { Topic } from './topic.entity';
import { Task } from './task.entity';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TASK_STATUSES = new Set(['pending', 'in_progress', 'completed']);

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(StudyPlan)
    private readonly repo: Repository<StudyPlan>,
    @InjectRepository(Topic)
    private readonly topicRepo: Repository<Topic>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async findAll(userId: string): Promise<StudyPlan[]> {
    this.assertUuid(userId, 'userId');
    return this.repo.find({ where: { userId } });
  }

  async findOne(id: string): Promise<StudyPlan> {
    this.assertUuid(id, 'id');
    const plan = await this.repo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(input: CreatePlanInput): Promise<StudyPlan> {
    this.assertUuid(input.userId, 'userId');
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

  async addTask(topicId: string, input: CreateTaskInput): Promise<StudyPlan> {
    this.assertUuid(topicId, 'id');

    const topic = await this.topicRepo.findOne({
      where: { id: topicId },
      relations: {
        plan: true,
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const task = new Task();
    task.id = randomUUID();
    task.title = input.title;
    task.timeMinutes = input.timeMinutes ?? 30;
    task.deadline = input.deadline;
    task.status = 'pending';
    task.topic = topic;

    await this.taskRepo.save(task);

    const plan = await this.findOne(topic.plan.id);
    plan.progress = this.calculatePlanProgress(plan);
    await this.repo.save(plan);

    return this.findOne(plan.id);
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<StudyPlan> {
    this.assertUuid(taskId, 'id');

    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: {
        topic: {
          plan: true,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (input.title !== undefined) {
      task.title = input.title;
    }

    if (input.timeMinutes !== undefined) {
      task.timeMinutes = input.timeMinutes;
    }

    if (input.deadline !== undefined) {
      task.deadline = input.deadline;
    }

    await this.taskRepo.save(task);

    const plan = await this.findOne(task.topic.plan.id);
    plan.progress = this.calculatePlanProgress(plan);
    await this.repo.save(plan);

    return this.findOne(plan.id);
  }

  async deleteTask(taskId: string): Promise<StudyPlan> {
    this.assertUuid(taskId, 'id');

    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: {
        topic: {
          plan: true,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const planId = task.topic.plan.id;
    await this.taskRepo.delete(taskId);

    const plan = await this.findOne(planId);
    plan.progress = this.calculatePlanProgress(plan);
    await this.repo.save(plan);

    return this.findOne(plan.id);
  }

  async delete(id: string): Promise<boolean> {
    this.assertUuid(id, 'id');
    await this.repo.delete(id);
    return true;
  }

  async updateTaskStatus(taskId: string, status: string): Promise<StudyPlan> {
    this.assertUuid(taskId, 'id');

    if (!TASK_STATUSES.has(status)) {
      throw new BadRequestException('status must be pending, in_progress, or completed');
    }

    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: {
        topic: {
          plan: true,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.status = status;
    await this.taskRepo.save(task);

    const plan = await this.findOne(task.topic.plan.id);
    plan.progress = this.calculatePlanProgress(plan);
    await this.repo.save(plan);

    return this.findOne(plan.id);
  }

  private calculatePlanProgress(plan: StudyPlan): number {
    const tasks = plan.topics.flatMap((topic) => topic.tasks ?? []);

    if (tasks.length === 0) {
      return 0;
    }

    const completedCount = tasks.filter((task) => task.status === 'completed').length;
    return Math.round((completedCount / tasks.length) * 100);
  }

  private assertUuid(value: string, field: 'id' | 'userId') {
    if (!UUID_PATTERN.test(value)) {
      throw new BadRequestException(`${field} must be a valid UUID`);
    }
  }
}
