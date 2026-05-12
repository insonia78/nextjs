import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // POST /api/progress
  @Post()
  create(@Body() dto: CreateProgressDto) {
    return this.progressService.create(dto);
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
