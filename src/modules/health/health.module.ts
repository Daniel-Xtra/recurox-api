import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { RabbitMQHealthIndicator } from './rabbitmq.health';
import { MessagingModule } from '@/infrastructure/messaging/messaging.module';

@Module({
  imports: [TerminusModule, MessagingModule, TypeOrmModule],
  controllers: [HealthController],
  providers: [RabbitMQHealthIndicator],
})
export class HealthModule { }
