import { Module } from '@nestjs/common';
import { NotificationsConsumer } from './notifications.consumer';

@Module({
  providers: [NotificationsConsumer],
  exports: [NotificationsConsumer],
})
export class NotificationsModule {}
