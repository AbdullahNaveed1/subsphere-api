import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class BillingWorker implements OnModuleInit {
  private logger = new Logger(BillingWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  onModuleInit() {
    setInterval(() => this.tick().catch(() => {}), 60000);
    this.logger.log('Billing worker started (60s interval)');
  }

  private async tick() {
    const now = new Date();
    const due = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE', currentPeriodEnd: { lte: now } },
      include: { plan: true },
    });
    if (!due.length) return;
    this.logger.log('Renewing ' + due.length + ' subscription(s)');

    for (const sub of due) {
      const newStart = new Date();
      const newEnd = new Date(newStart);
      if (sub.plan.interval === 'year') newEnd.setFullYear(newEnd.getFullYear() + 1);
      else newEnd.setMonth(newEnd.getMonth() + 1);

      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { currentPeriodStart: newStart, currentPeriodEnd: newEnd },
      });

      if (sub.plan.priceCents > 0) {
        const number = 'INV-' + Date.now() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
        const invoice = await this.prisma.invoice.create({
          data: { orgId: sub.orgId, subscriptionId: sub.id, number, status: 'OPEN', totalCents: sub.plan.priceCents, currency: 'PKR' },
        });
        await this.webhooks.dispatch(sub.orgId, 'invoice.created', invoice);
        this.logger.log('Created invoice ' + number + ' for org ' + sub.orgId);
      }
    }
  }
}
