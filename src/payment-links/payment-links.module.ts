import { Module } from '@nestjs/common';
import { PaymentLinksService } from './payment-links.service';
import { PaymentLinksController, PaymentLinksDashboardController, PaymentLinksPublicController } from './payment-links.controller';
import { RateLimitModule } from '../common/rate-limit.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [RateLimitModule, PaymentsModule],
  controllers: [PaymentLinksController, PaymentLinksDashboardController, PaymentLinksPublicController],
  providers: [PaymentLinksService],
  exports: [PaymentLinksService],
})
export class PaymentLinksModule {}