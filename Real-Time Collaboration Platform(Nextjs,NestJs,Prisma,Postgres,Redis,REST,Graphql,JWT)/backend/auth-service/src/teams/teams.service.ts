import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string, ownerId: string) {
    const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const existing = await this.prisma.team.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Team slug already exists');

    const team = await this.prisma.team.create({
      data: { name, slug, ownerId },
    });

    // Assign creator to team
    await this.prisma.user.update({
      where: { id: ownerId },
      data: { teamId: team.id, role: 'ADMIN' },
    });

    return team;
  }

  async findById(id: string) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async addMember(teamId: string, userId: string) {
    await this.findById(teamId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { teamId },
      select: { id: true, username: true, role: true },
    });
  }
}
