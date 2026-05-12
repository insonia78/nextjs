import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { IsString, IsOptional } from 'class-validator';

class SendNotificationDto {
  @IsString() userId: string;
  @IsString() message: string;
  @IsOptional() @IsString() type?: string;
}

@Controller('notify')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  send(@Body() dto: SendNotificationDto) {
    return this.notificationsService.send(dto.userId, dto.message, dto.type);
  }

  @Get(':userId')
  getForUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getForUser(userId, limit ? parseInt(limit) : 20);
  }

  @Patch(':userId/:notificationId/read')
  markRead(
    @Param('userId') userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markRead(userId, notificationId).then(() => ({ success: true }));
  }
}
