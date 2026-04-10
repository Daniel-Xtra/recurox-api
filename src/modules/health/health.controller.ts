import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, HealthCheckResult, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { RabbitMQHealthIndicator } from './rabbitmq.health';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly rabbitmq: RabbitMQHealthIndicator,
    private readonly db: TypeOrmHealthIndicator,
  ) { }

  @Get()
  @HealthCheck()
  public check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.rabbitmq.isHealthy('rabbitmq'),
      () => this.db.pingCheck('database'),
    ]);
  }
}
