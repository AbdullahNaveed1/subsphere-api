import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])],
  providers: [RateLimitGuard],
  exports: [RateLimitGuard, ThrottlerModule],
})
export class RateLimitModule {}
