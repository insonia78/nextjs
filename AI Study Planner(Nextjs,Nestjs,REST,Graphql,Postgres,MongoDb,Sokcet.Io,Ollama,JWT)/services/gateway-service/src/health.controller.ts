import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      upstreams: {
        auth:     process.env.AUTH_SERVICE_URL     ?? 'http://localhost:3001',
        planner:  process.env.PLANNER_SERVICE_URL  ?? 'http://localhost:3002',
        progress: process.env.PROGRESS_SERVICE_URL ?? 'http://localhost:3003',
        ai:       process.env.AI_SERVICE_URL       ?? 'http://localhost:3004',
      },
    };
  }
}
