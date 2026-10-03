import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsPublicController } from './subscriptions-public.controller';
import { SubscriptionsService } from './subscriptions.service';
import { BillingWorker } from './billing.worker';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { RateLimitModule } from '../common/rate-limit.module';

@Module({
  imports: [WebhooksModule, RateLimitModule],
  controllers: [SubscriptionsController, SubscriptionsPublicController],
  providers: [SubscriptionsService, BillingWorker],
})
export class SubscriptionsModule {}