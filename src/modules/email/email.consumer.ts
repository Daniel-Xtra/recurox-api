import { RABBITMQ_EXCHANGES, RABBITMQ_ROUTING_KEYS, RABBITMQ_QUEUES } from '@/infrastructure/messaging/constants';
import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);

  @RabbitSubscribe({
    exchange: RABBITMQ_EXCHANGES.COMMANDS,
    routingKey: RABBITMQ_ROUTING_KEYS.EMAIL_SEND,
    queue: RABBITMQ_QUEUES.EMAIL,
    // Use the channel defined in RabbitMQModule for strict sequential processing
    queueOptions: {
      channel: 'email-service',
    },
  })
  public async handleEmailSend(msg: EmailPayload): Promise<void | Nack> {
    this.logger.log(`Processing email to: ${msg.to}`);

    try {
      // Simulate email sending logic
      if (!msg.to.includes('@')) {
        throw new Error('Invalid email address');
      }

      this.logger.log(`Email successfully sent to ${msg.to}`);
      // Auto-ack handles success
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);

      // Specifically for fintech: 
      // If it's a transient error, we might want to requeue. 
      // If it's a permanent error, we move to DLQ.

      // The library handles DLQ automatically if we return a Nack with requeue: false
      // and the queue is configured with x-dead-letter-exchange.
      return new Nack(false);
    }
  }
}
