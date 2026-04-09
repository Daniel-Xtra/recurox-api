import { Module } from '@nestjs/common';
import { EmailConsumer } from './email.consumer';

@Module({
  providers: [EmailConsumer],
  exports: [EmailConsumer],
})
export class EmailModule {}
