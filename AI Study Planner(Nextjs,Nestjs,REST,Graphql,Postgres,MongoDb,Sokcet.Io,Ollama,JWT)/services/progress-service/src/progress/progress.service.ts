import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudySession, StudySessionDocument } from './study-session.schema';
import { CreateProgressDto } from './dto/create-progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(StudySession.name)
    private readonly model: Model<StudySessionDocument>,
  ) {}

  async create(dto: CreateProgressDto): Promise<StudySession> {
    return this.model.create(dto);
  }

  async findByUser(userId: string): Promise<StudySession[]> {
    return this.model.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getStats(userId: string) {
    const sessions = await this.model.find({ userId }).exec();
    const totalMinutes = sessions.reduce((sum, s) => sum + s.timeSpent, 0);
    const completed = sessions.filter((s) => s.status === 'completed').length;
    return { totalMinutes, totalSessions: sessions.length, completed };
  }
}
