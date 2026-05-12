import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(email: string, username: string, password: string) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) throw new ConflictException('Email or username already exists');

    const hashed = await bcrypt.hash(password, 12);
    return this.prisma.user.create({
      data: { email, username, password: hashed },
      select: { id: true, email: true, username: true, role: true, createdAt: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, avatar: true, role: true, teamId: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateAvatar(id: string, avatar: string) {
    return this.prisma.user.update({
      where: { id },
      data: { avatar },
      select: { id: true, email: true, username: true, avatar: true },
    });
  }

  async listByTeam(teamId: string) {
    return this.prisma.user.findMany({
      where: { teamId },
      select: { id: true, username: true, avatar: true, role: true },
    });
  }
}
