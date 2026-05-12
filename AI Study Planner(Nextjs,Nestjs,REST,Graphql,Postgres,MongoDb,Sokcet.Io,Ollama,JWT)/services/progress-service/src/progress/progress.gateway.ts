import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';

@WebSocketGateway({ cors: { origin: 'http://localhost:3000' } })
export class ProgressGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly progressService: ProgressService) {}

  @SubscribeMessage('submitProgress')
  async handleProgress(@MessageBody() dto: CreateProgressDto) {
    const session = await this.progressService.create(dto);
    this.server.emit('progressUpdated', session);
    return session;
  }
}
