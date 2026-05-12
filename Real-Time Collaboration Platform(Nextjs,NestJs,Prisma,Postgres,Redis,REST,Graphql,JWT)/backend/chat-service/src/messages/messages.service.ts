import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async create(content: string, senderId: string, channelId: string) {
    const message = await this.prisma.message.create({
      data: { content, senderId, channelId },
    });

    // Publish to Redis for real-time delivery
    await this.redis.publish(
      `channel:${channelId}`,
      JSON.stringify(message),
    );

    return message;
  }

  async findByChannel(channelId: string, take = 50, skip = 0) {
    return this.prisma.message.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async editMessage(id: string, content: string, requesterId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id } });
    if (!msg || msg.senderId !== requesterId) throw new Error('Unauthorized');

    return this.prisma.message.update({
      where: { id },
      data: { content, editedAt: new Date() },
    });
  }

  async deleteMessage(id: string, requesterId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id } });
    if (!msg || msg.senderId !== requesterId) throw new Error('Unauthorized');

    return this.prisma.message.delete({ where: { id } });
  }
}
