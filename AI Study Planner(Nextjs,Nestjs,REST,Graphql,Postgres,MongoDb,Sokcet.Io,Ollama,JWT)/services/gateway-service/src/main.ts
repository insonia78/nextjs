import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { GatewayMiddleware } from './gateway.middleware';

async function bootstrap() {
  const logger = new Logger('GatewayService');

  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Request logging
  app.use((req: any, res: any, next: () => void) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      logger.log(
        `${req.method} ${req.originalUrl} → ${res.statusCode} [${durationMs}ms]`,
      );
    });
    next();
  });

  // CORS
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // Forward WebSocket upgrade events to the progress service proxy
  const gatewayMiddleware = app.get(GatewayMiddleware);
  const httpServer = app.getHttpServer();
  httpServer.on('upgrade', (req: any, socket: any, head: any) => {
    const upgradeHandler = gatewayMiddleware.wsProxies.get('/socket.io');
    if (upgradeHandler) {
      upgradeHandler(req, socket, head);
    } else {
      socket.destroy();
    }
  });

  logger.log(`API Gateway running on http://localhost:${port}`);
  logger.log(`  /api/auth/*     → ${process.env.AUTH_SERVICE_URL     ?? 'http://localhost:3001'}`);
  logger.log(`  /graphql        → ${process.env.PLANNER_SERVICE_URL  ?? 'http://localhost:3002'}`);
  logger.log(`  /api/progress/* → ${process.env.PROGRESS_SERVICE_URL ?? 'http://localhost:3003'}`);
  logger.log(`  /socket.io      → ${process.env.PROGRESS_SERVICE_URL ?? 'http://localhost:3003'} (WS)`);
  logger.log(`  /api/ai/*       → ${process.env.AI_SERVICE_URL       ?? 'http://localhost:3004'}`);
}
bootstrap();
