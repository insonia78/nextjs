import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    title: string;
    description?: string;
    teamId: string;
    createdBy: string;
    assignedTo?: string;
    priority?: string;
    dueDate?: Date;
  }) {
    return this.prisma.task.create({ data: data as any });
  }

  async findByTeam(teamId: string) {
    return this.prisma.task.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.task.findUnique({ where: { id } });
  }

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedTo: string;
    dueDate: Date;
  }>) {
    return this.prisma.task.update({ where: { id }, data: data as any });
  }

  async delete(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}
