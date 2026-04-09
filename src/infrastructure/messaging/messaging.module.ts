import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQProducerService } from './producer.service';
import { RABBITMQ_EXCHANGES } from './constants';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: RABBITMQ_EXCHANGES.COMMANDS,
            type: 'direct',
          },
          {
            name: RABBITMQ_EXCHANGES.EVENTS,
            type: 'topic',
          },
          {
            name: RABBITMQ_EXCHANGES.DLX,
            type: 'direct',
          },
        ],
        uri: configService.getOrThrow<string>('RECUROX_RABBITMQ_URI'),
        connectionInitOptions: { wait: true },
        channels: {
          'email-service': {
            prefetchCount: 1,
            default: false,
          },
          'notification-service': {
            prefetchCount: 5,
            default: false,
          },
          'default': {
            prefetchCount: 10,
            default: true,
          },
        },
        enableControllerDiscovery: true,
      }),
    }),
  ],
  providers: [RabbitMQProducerService],
  exports: [RabbitMQModule, RabbitMQProducerService],
})
export class MessagingModule { }
