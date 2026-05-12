import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, teamId: string, type: string = 'TEXT') {
    return this.prisma.channel.create({ data: { name, teamId, type: type as any } });
  }

  async findByTeam(teamId: string) {
    return this.prisma.channel.findMany({ where: { teamId }, orderBy: { createdAt: 'asc' } });
  }

  async findById(id: string) {
    return this.prisma.channel.findUnique({ where: { id } });
  }
}
