import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrgsModule } from './orgs/orgs.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CommonModule } from './common/common.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    ApiKeysModule,
    PaymentsModule,
    WebhooksModule,
    CustomersModule,
    PrismaModule,
    AuthModule,
    OrgsModule,
    PlansModule,
    SubscriptionsModule,
    InvoicesModule,
    DashboardModule,
  ],
})
export class AppModule {}
