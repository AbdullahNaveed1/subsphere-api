import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { OverdueWorker } from './overdue.worker';
import { PaymentsModule } from '../payments/payments.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [PaymentsModule, WebhooksModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, OverdueWorker],
})
export class InvoicesModule {}
