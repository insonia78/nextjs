import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { PlansService } from './plans.service';
import { StudyPlan } from './study-plan.entity';
import { CreatePlanInput } from './dto/create-plan.input';

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

  @Mutation(() => Boolean)
  deletePlan(@Args('id', { type: () => ID }) id: string) {
    return this.plansService.delete(id);
  }
}
