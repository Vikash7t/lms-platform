import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Security middleware - makes HTTP headers more secure
  app.use(helmet());

  // CORS - controls which frontend can access the API
  app.use(
    cors({
      origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
      credentials: true,
    }),
  );

  // Incoming request logging
  app.use(morgan('combined'));

  // Global validation pipe - validates incoming request bodies
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Example: /users -> /api/users
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 8000;

  await app.listen(port);

  logger.log(`Server listening on http://localhost:${port}/api`);
}

bootstrap();