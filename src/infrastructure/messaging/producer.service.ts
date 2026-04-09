import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { RABBITMQ_EXCHANGES } from './constants';

@Injectable()
export class RabbitMQProducerService {
  private readonly logger = new Logger(RabbitMQProducerService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  /**
   * Send a command (1:1 task offloading)
   */
  public async sendCommand<T>(routingKey: string, payload: T): Promise<void> {
    this.logger.log(`Sending command: ${routingKey}`);
    await this.amqpConnection.publish(
      RABBITMQ_EXCHANGES.COMMANDS,
      routingKey,
      payload,
      {
        persistent: true, // Durability
      },
    );
  }

  /**
   * Emit a domain event (1:N broadcast)
   */
  public async emitEvent<T>(routingKey: string, payload: T): Promise<void> {
    this.logger.log(`Emitting event: ${routingKey}`);
    await this.amqpConnection.publish(
      RABBITMQ_EXCHANGES.EVENTS,
      routingKey,
      payload,
      {
        persistent: true,
      },
    );
  }

  /**
   * Send a message with delay
   * Requires rabbitmq_delayed_message_exchange plugin installed on RabbitMQ
   */
  public async sendDelayedMessage<T>(
    exchange: string,
    routingKey: string,
    payload: T,
    delayMs: number,
  ): Promise<void> {
    this.logger.log(`Sending delayed message (${delayMs}ms) to ${routingKey}`);
    await this.amqpConnection.publish(
      exchange,
      routingKey,
      payload,
      {
        headers: { 'x-delay': delayMs },
        persistent: true,
      },
    );
  }
}
