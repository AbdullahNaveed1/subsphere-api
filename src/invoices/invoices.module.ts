import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesPublicController } from './invoices-public.controller';
import { InvoicesService } from './invoices.service';
import { OverdueWorker } from './overdue.worker';
import { PaymentsModule } from '../payments/payments.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { RateLimitModule } from '../common/rate-limit.module';

@Module({
  imports: [PaymentsModule, WebhooksModule, RateLimitModule],
  controllers: [InvoicesController, InvoicesPublicController],
  providers: [InvoicesService, OverdueWorker],
})
export class InvoicesModule {}