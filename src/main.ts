import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.RECUROX_PORT || 3000);
  await app.enableVersioning();
  await app.enableCors();
  await app.useGlobalPipes(new ValidationPipe());
  await app.enableShutdownHooks();
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
