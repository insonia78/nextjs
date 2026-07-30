import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { StudySession } from './study-session.schema';

@WebSocketGateway({ cors: { origin: 'http://localhost:3000' } })
export class ProgressGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly progressService: ProgressService) {}

  emitProgressUpdated(session: StudySession) {
    this.server.emit('progressUpdated', session);
  }

  @SubscribeMessage('submitProgress')
  async handleProgress(@MessageBody() dto: CreateProgressDto) {
    const session = await this.progressService.create(dto);
    this.emitProgressUpdated(session);
    return session;
  }
}
