import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { LedgerController, LedgerDashboardController } from './ledger.controller';
import { RateLimitModule } from '../common/rate-limit.module';

@Module({
  imports: [RateLimitModule],
  controllers: [LedgerController, LedgerDashboardController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}