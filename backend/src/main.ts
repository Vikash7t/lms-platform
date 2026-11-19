import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService<EnvironmentVariables, true>);

  // Security HTTP Headers
  app.use(helmet());

  // Cookie Parser Middleware
  app.use(cookieParser());

  // Native NestJS CORS using validated FRONTEND_URL
  const frontendUrl = configService.get<string>('FRONTEND_URL', { infer: true });
  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
  });

  // Incoming HTTP request logging
  app.use(morgan('combined'));

  // Global validation pipe - validates incoming request bodies
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Route Prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT', { infer: true });

  await app.listen(port);

  logger.log(`Server listening on http://localhost:${port}/api`);
}

bootstrap();