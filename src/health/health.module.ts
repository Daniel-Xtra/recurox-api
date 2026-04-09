import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RabbitMQHealthIndicator } from './rabbitmq.health';
import { MessagingModule } from '@/infrastructure/messaging/messaging.module';

@Module({
  imports: [TerminusModule, MessagingModule],
  controllers: [HealthController],
  providers: [RabbitMQHealthIndicator],
})
export class HealthModule { }
