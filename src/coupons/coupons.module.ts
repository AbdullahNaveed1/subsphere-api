import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController, CouponsDashboardController } from './coupons.controller';
import { RateLimitModule } from '../common/rate-limit.module';

@Module({
  imports: [RateLimitModule],
  controllers: [CouponsController, CouponsDashboardController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}