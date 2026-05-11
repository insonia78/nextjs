import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansService } from './plans.service';
import { PlansResolver } from './plans.resolver';
import { StudyPlan } from './study-plan.entity';
import { Topic } from './topic.entity';
import { Task } from './task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudyPlan, Topic, Task])],
  providers: [PlansService, PlansResolver],
})
export class PlansModule {}
