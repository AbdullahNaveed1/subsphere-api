import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  controllers: [DashboardController, AnalyticsController],
  providers: [DashboardService],
})
export class DashboardModule {}
