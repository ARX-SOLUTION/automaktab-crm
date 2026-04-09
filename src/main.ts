import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { NextFunction, Request, Response, urlencoded } from 'express';
import helmet from 'helmet';

import { GlobalExceptionFilter } from '@core/filters';
import { RequestLoggingInterceptor, ResponseWrapperInterceptor } from '@core/interceptors';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  app.use(cookieParser());
  app.use(urlencoded({ extended: true }));
  app.use((request: Request, _response: Response, next: NextFunction) => {
    const sanitize = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map((item) => sanitize(item));
      }

      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, sanitize(item)]),
        );
      }

      if (value === '') {
        return undefined;
      }

      return value;
    };

    request.body = sanitize(request.body);
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  const corsWhitelist = configService.get<string>('CORS_WHITELIST', '');
  const corsOrigins = corsWhitelist
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(configService),
    new ResponseWrapperInterceptor(reflector),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auto Test CRM API')
    .setDescription('Driving school management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();
