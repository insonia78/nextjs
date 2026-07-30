import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { PlansService } from './plans.service';
import { StudyPlan } from './study-plan.entity';
import { CreatePlanInput, CreateTaskInput, UpdateTaskInput } from './dto/create-plan.input';

@Resolver(() => StudyPlan)
export class PlansResolver {
  constructor(private readonly plansService: PlansService) {}

  @Query(() => [StudyPlan], { name: 'plans' })
  getPlans(@Args('userId', { type: () => String }) userId: string) {
    return this.plansService.findAll(userId);
  }

  @Query(() => StudyPlan, { name: 'plan' })
  getPlan(@Args('id', { type: () => ID }) id: string) {
    return this.plansService.findOne(id);
  }

  @Mutation(() => StudyPlan)
  createPlan(@Args('input') input: CreatePlanInput) {
    return this.plansService.create(input);
  }

  @Mutation(() => StudyPlan)
  addTask(
    @Args('topicId', { type: () => ID }) topicId: string,
    @Args('input') input: CreateTaskInput,
  ) {
    return this.plansService.addTask(topicId, input);
  }

  @Mutation(() => StudyPlan)
  updateTask(
    @Args('taskId', { type: () => ID }) taskId: string,
    @Args('input') input: UpdateTaskInput,
  ) {
    return this.plansService.updateTask(taskId, input);
  }

  @Mutation(() => StudyPlan)
  deleteTask(@Args('taskId', { type: () => ID }) taskId: string) {
    return this.plansService.deleteTask(taskId);
  }

  @Mutation(() => Boolean)
  deletePlan(@Args('id', { type: () => ID }) id: string) {
    return this.plansService.delete(id);
  }

  @Mutation(() => StudyPlan)
  updateTaskStatus(
    @Args('taskId', { type: () => ID }) taskId: string,
    @Args('status', { type: () => String }) status: string,
  ) {
    return this.plansService.updateTaskStatus(taskId, status);
  }
}
