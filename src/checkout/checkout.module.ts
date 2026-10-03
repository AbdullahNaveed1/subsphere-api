import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { CheckoutPublicController } from './checkout.public.controller';
import { RateLimitModule } from '../common/rate-limit.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [RateLimitModule, CouponsModule],
  controllers: [CheckoutController, CheckoutPublicController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}