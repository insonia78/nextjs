import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { GqlAllExceptionsFilter } from './common/filters/gql-all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('PlannerService');
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GqlAllExceptionsFilter());

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
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
  await app.listen(process.env.PORT ?? 3002);
  logger.log(`Planner service (GraphQL) running on port ${process.env.PORT ?? 3002}`);
}
bootstrap();
