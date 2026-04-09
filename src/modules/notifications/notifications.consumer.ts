import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES } from '@/infrastructure/messaging/constants';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsConsumer {
  private readonly logger = new Logger(NotificationsConsumer.name);

  // This consumer listens to ANY user-related event (topic pattern user.#)
  @RabbitSubscribe({
    exchange: RABBITMQ_EXCHANGES.EVENTS,
    routingKey: 'user.#',
    queue: RABBITMQ_QUEUES.NOTIFICATIONS,
    queueOptions: {
      channel: 'notification-service',
    },
  })
  public async handleUserEvents(msg: Record<string, unknown>, amqpMsg: { fields: { routingKey: string } }): Promise<void> {
    const routingKey = amqpMsg.fields.routingKey;
    this.logger.log(`Received event [${routingKey}]: ${JSON.stringify(msg)}`);

    switch (routingKey) {
      case 'user.created':
        this.logger.log(`Preparing welcome notification for user: ${msg.id}`);
        break;
      case 'user.deleted':
        this.logger.log(`Cleaning up notifications for user: ${msg.id}`);
        break;
      default:
        this.logger.debug(`Generic notification for event: ${routingKey}`);
    }
  }
}
