import { Injectable, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class PresenceService {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  async setOnline(userId: string) {
    await this.redis.set(`presence:${userId}`, 'online', 'EX', 300);
  }

  async setOffline(userId: string) {
    await this.redis.del(`presence:${userId}`);
  }

  async isOnline(userId: string): Promise<boolean> {
    const status = await this.redis.get(`presence:${userId}`);
    return status === 'online';
  }

  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    const results = await Promise.all(
      userIds.map(async (id) => ({ id, online: await this.isOnline(id) })),
    );
    return results.filter((r) => r.online).map((r) => r.id);
  }
}
