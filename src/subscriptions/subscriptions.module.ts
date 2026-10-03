import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { BillingWorker } from './billing.worker';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [WebhooksModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, BillingWorker],
})
export class SubscriptionsModule {}
