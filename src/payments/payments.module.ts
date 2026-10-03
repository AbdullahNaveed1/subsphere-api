import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RefundsController } from './refunds.controller';
import { RefundsDashboardController } from './refunds-dashboard.controller';
import { PaymentsDashboardController } from './payments-dashboard.controller';
import { RefundsService } from './refunds.service';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { SafepayProvider } from './providers/safepay.provider';
import { ProviderFactory } from './providers/provider.factory';

@Module({
  imports: [WebhooksModule, RateLimitModule],
  controllers: [PaymentsController, RefundsController, RefundsDashboardController, PaymentsDashboardController],
  providers: [PaymentsService, RefundsService, SafepayProvider, ProviderFactory],
  exports: [PaymentsService, RefundsService],
})
export class PaymentsModule {}
