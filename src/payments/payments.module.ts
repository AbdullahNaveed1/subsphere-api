import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { SafepayProvider } from './providers/safepay.provider';
import { ProviderFactory } from './providers/provider.factory';

@Module({
  imports: [WebhooksModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, SafepayProvider, ProviderFactory],
  exports: [PaymentsService],
})
export class PaymentsModule {}
