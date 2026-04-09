import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RabbitMQHealthIndicator extends HealthIndicator {
  constructor(private readonly amqpConnection: AmqpConnection) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isConnected = this.amqpConnection.managedConnection.isConnected();
    const result = this.getStatus(key, isConnected);

    if (isConnected) {
      return result;
    }

    throw new HealthCheckError('RabbitMQ check failed', result);
  }
}
