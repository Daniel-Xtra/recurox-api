import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { createSecurityConfig } from './common/config/security.config';
import { createValidationConfig } from './common/config/validation.config';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TrimPipe } from './common/pipes/trim.pipe';
import { HttpErrorFilter } from './common/filters/http-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('RECUROX_PORT') || 3000;



  // 1. Global Versioning and prefix
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 2. Middleware & Security
  app.use(createSecurityConfig());
  app.use(cookieParser());

  // 3. CORS Configuration
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')?.split(',') ?? [
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
    credentials: true,
    maxAge: 86400, // 1 day
  });

  // 4. Global Filters & Pipes
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(
    createValidationConfig(),
    new TrimPipe(),
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 5. Global Interceptors
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // 6. Graceful Shutdown
  app.enableShutdownHooks();

  // 7. Start Application
  await app.listen(port);
  Logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}
bootstrap();
