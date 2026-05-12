import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(title: string, teamId: string, authorId: string) {
    return this.prisma.document.create({ data: { title, teamId, authorId } });
  }

  async findByTeam(teamId: string) {
    return this.prisma.document.findMany({
      where: { teamId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.document.findUnique({ where: { id } });
  }

  async updateContent(id: string, content: string) {
    return this.prisma.document.update({ where: { id }, data: { content } });
  }

  async updateTitle(id: string, title: string) {
    return this.prisma.document.update({ where: { id }, data: { title } });
  }

  async delete(id: string) {
    return this.prisma.document.delete({ where: { id } });
  }
}
