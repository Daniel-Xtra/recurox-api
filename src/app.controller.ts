import { Controller, Post, Body, Logger } from '@nestjs/common';
import { RabbitMQProducerService } from './infrastructure/messaging/producer.service';
import { RABBITMQ_ROUTING_KEYS } from './infrastructure/messaging/constants';

@Controller('test-messaging')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly producer: RabbitMQProducerService) {}

  @Post('trigger')
  async triggerSampleMessages(@Body() data: { email: string; userId: string }) {
    this.logger.log('--- Triggering Sample Working ---');

    // 1. Send an Email Command (Sequential/Reliable Channel)
    await this.producer.sendCommand(RABBITMQ_ROUTING_KEYS.EMAIL_SEND, {
      to: data.email || 'user@example.com',
      subject: 'Welcome to Recurox!',
      body: 'Your account has been successfully created.',
    });

    // 2. Emit a User Created Event (Broadcast/High-Throughput Channel)
    await this.producer.emitEvent('user.created', {
      id: data.userId || 'user_12345',
      timestamp: new Date().toISOString(),
      metadata: { source: 'api_test' },
    });

    return {
      status: 'Messages triggered successfully',
      details: 'Check your terminal console for consumer logs.',
    };
  }
}
