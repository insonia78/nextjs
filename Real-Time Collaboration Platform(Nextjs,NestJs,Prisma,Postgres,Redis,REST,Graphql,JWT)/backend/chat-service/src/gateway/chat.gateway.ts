import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';
import { PresenceService } from '../presence/presence.service';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private messagesService: MessagesService,
    private presenceService: PresenceService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId as string;
    if (userId) {
      await this.presenceService.setOnline(userId);
      this.server.emit('presence:online', { userId });
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.auth?.userId as string;
    if (userId) {
      await this.presenceService.setOffline(userId);
      this.server.emit('presence:offline', { userId });
    }
  }

  @SubscribeMessage('join:channel')
  handleJoinChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`channel:${data.channelId}`);
    return { event: 'joined', channelId: data.channelId };
  }

  @SubscribeMessage('leave:channel')
  handleLeaveChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`channel:${data.channelId}`);
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() data: { content: string; senderId: string; channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagesService.create(
      data.content,
      data.senderId,
      data.channelId,
    );
    this.server.to(`channel:${data.channelId}`).emit('message:new', message);
    return message;
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @MessageBody() data: { channelId: string; userId: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`channel:${data.channelId}`).emit('typing:start', {
      userId: data.userId,
      username: data.username,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: { channelId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`channel:${data.channelId}`).emit('typing:stop', {
      userId: data.userId,
    });
  }
}
