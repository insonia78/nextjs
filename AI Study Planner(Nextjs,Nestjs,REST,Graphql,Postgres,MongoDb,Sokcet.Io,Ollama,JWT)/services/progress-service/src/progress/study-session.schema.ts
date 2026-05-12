import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StudySessionDocument = StudySession & Document;

@Schema({ timestamps: true })
export class StudySession {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  taskId: string;

  @Prop({ required: true, enum: ['completed', 'in_progress', 'pending'] })
  status: string;

  @Prop({ required: true })
  timeSpent: number; // in minutes

  @Prop()
  planId: string;

  @Prop()
  topicId: string;

  @Prop()
  notes: string;
}

export const StudySessionSchema = SchemaFactory.createForClass(StudySession);
