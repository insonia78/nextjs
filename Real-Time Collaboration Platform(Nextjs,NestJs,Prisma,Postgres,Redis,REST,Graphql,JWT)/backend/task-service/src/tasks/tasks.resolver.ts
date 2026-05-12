import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { TasksService } from './tasks.service';
import { TaskType, TaskStatus, Priority } from '../graphql/types';

@Resolver(() => TaskType)
export class TasksResolver {
  constructor(private tasksService: TasksService) {}

  @Query(() => [TaskType])
  tasksByTeam(@Args('teamId') teamId: string) {
    return this.tasksService.findByTeam(teamId);
  }

  @Query(() => TaskType, { nullable: true })
  task(@Args('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Mutation(() => TaskType)
  createTask(
    @Args('title') title: string,
    @Args('teamId') teamId: string,
    @Args('createdBy') createdBy: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('assignedTo', { nullable: true }) assignedTo?: string,
    @Args('priority', { type: () => Priority, nullable: true }) priority?: Priority,
    @Args('dueDate', { nullable: true }) dueDate?: Date,
  ) {
    return this.tasksService.create({ title, teamId, createdBy, description, assignedTo, priority, dueDate });
  }

  @Mutation(() => TaskType)
  updateTaskStatus(
    @Args('id') id: string,
    @Args('status', { type: () => TaskStatus }) status: TaskStatus,
  ) {
    return this.tasksService.update(id, { status });
  }

  @Mutation(() => TaskType)
  updateTask(
    @Args('id') id: string,
    @Args('title', { nullable: true }) title?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('assignedTo', { nullable: true }) assignedTo?: string,
    @Args('priority', { type: () => Priority, nullable: true }) priority?: Priority,
  ) {
    return this.tasksService.update(id, { title, description, assignedTo, priority });
  }

  @Mutation(() => TaskType)
  deleteTask(@Args('id') id: string) {
    return this.tasksService.delete(id);
  }
}
