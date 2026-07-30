import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { ProgressGateway } from './progress.gateway';

@Controller('progress')
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly progressGateway: ProgressGateway,
  ) {}

  // POST /api/progress
  @Post()
  async create(@Body() dto: CreateProgressDto) {
    const session = await this.progressService.create(dto);
    this.progressGateway.emitProgressUpdated(session);
    return session;
  }

  // GET /api/progress/:userId
  @Get(':userId')
  findByUser(@Param('userId') userId: string) {
    return this.progressService.findByUser(userId);
  }

  // GET /api/progress/:userId/stats
  @Get(':userId/stats')
  getStats(@Param('userId') userId: string) {
    return this.progressService.getStats(userId);
  }
}
