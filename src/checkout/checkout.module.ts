import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { CheckoutPublicController } from './checkout.public.controller';
import { RateLimitModule } from '../common/rate-limit.module';

@Module({
  imports: [RateLimitModule],
  controllers: [CheckoutController, CheckoutPublicController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}