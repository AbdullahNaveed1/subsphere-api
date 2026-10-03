import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersDashboardController } from './customers-dashboard.controller';
import { CustomersService } from './customers.service';
import { RateLimitModule } from '../common/rate-limit.module';

@Module({
  imports: [RateLimitModule],
  controllers: [CustomersController, CustomersDashboardController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
