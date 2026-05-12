import { Injectable, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

@Injectable()
export class NotificationsService {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  async send(userId: string, message: string, type = 'info'): Promise<Notification> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      userId,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Store in Redis list (last 100 notifications per user)
    await this.redis.lpush(`notifications:${userId}`, JSON.stringify(notification));
    await this.redis.ltrim(`notifications:${userId}`, 0, 99);

    // Publish for real-time delivery
    await this.redis.publish(`notify:${userId}`, JSON.stringify(notification));

    return notification;
  }

  async getForUser(userId: string, limit = 20): Promise<Notification[]> {
    const items = await this.redis.lrange(`notifications:${userId}`, 0, limit - 1);
    return items.map((i) => JSON.parse(i));
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    const items = await this.redis.lrange(`notifications:${userId}`, 0, 99);
    const updated = items.map((i) => {
      const n: Notification = JSON.parse(i);
      if (n.id === notificationId) n.read = true;
      return JSON.stringify(n);
    });

    if (updated.length > 0) {
      await this.redis.del(`notifications:${userId}`);
      await this.redis.rpush(`notifications:${userId}`, ...updated);
    }
  }
}
