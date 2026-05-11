import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { ProgressGateway } from './progress.gateway';
import { StudySession, StudySessionSchema } from './study-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudySession.name, schema: StudySessionSchema },
    ]),
  ],
  providers: [ProgressService, ProgressGateway],
  controllers: [ProgressController],
})
export class ProgressModule {}
