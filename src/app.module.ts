import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagingModule } from './infrastructure/messaging/messaging.module';
import { EmailModule } from './modules/email/email.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { configValidationSchema } from './common/config/config.schema';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
    }),
    MessagingModule,
    EmailModule,
    NotificationsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
