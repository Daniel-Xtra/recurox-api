import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { RabbitMQHealthIndicator } from './rabbitmq.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly rabbitmq: RabbitMQHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  public check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.rabbitmq.isHealthy('rabbitmq'),
    ]);
  }
}
