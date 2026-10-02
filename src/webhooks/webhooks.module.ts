import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { SafepayWebhookController } from './safepay-webhook.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  controllers: [WebhooksController, SafepayWebhookController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}