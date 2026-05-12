import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleInit, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })
export class NotificationsGateway implements OnGatewayConnection, OnModuleInit {
  @WebSocketServer() server: Server;

  private subscriber: Redis;

  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  onModuleInit() {
    // Duplicate connection for subscribe mode
    this.subscriber = this.redis.duplicate();
    this.subscriber.psubscribe('notify:*');
    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      const userId = channel.replace('notify:', '');
      this.server.to(`user:${userId}`).emit('notification', JSON.parse(message));
    });
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId as string;
    if (userId) {
      client.join(`user:${userId}`);
    }
  }
}
