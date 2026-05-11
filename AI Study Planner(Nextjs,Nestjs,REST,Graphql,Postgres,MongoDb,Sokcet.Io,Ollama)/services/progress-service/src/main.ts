import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '@study/shared-rest';

async function bootstrap() {
  const logger = new Logger('ProgressService');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use((req: any, res: any, next: () => void) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`);
    });
    next();
  });
  
  // CORS configuration
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
  await app.listen(process.env.PORT ?? 3003);
  logger.log(`Progress service running on port ${process.env.PORT ?? 3003}`);
}
bootstrap();
