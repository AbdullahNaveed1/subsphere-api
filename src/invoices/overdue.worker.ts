import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

const GRACE_DAYS = 7;

@Injectable()
export class OverdueWorker implements OnModuleInit {
  private logger = new Logger(OverdueWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  onModuleInit() {
    setInterval(() => this.tick().catch(() => {}), 300000);
    this.logger.log('Overdue worker started (5m interval)');
  }

  private async tick() {
    const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000);
    const overdue = await this.prisma.invoice.findMany({
      where: { status: 'OPEN', createdAt: { lt: cutoff }, subscriptionId: { not: null } },
      take: 50,
    });
    if (!overdue.length) return;
    this.logger.log('Found ' + overdue.length + ' overdue invoice(s)');

    for (const inv of overdue) {
      await this.prisma.invoice.update({ where: { id: inv.id }, data: { status: 'PAST_DUE' } });
      await this.webhooks.dispatch(inv.orgId, 'invoice.past_due', inv);

      if (inv.subscriptionId) {
        const sub = await this.prisma.subscription.findUnique({ where: { id: inv.subscriptionId } });
        if (sub && sub.status === 'ACTIVE') {
          const updated = await this.prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'PAST_DUE' },
          });
          await this.webhooks.dispatch(inv.orgId, 'subscription.past_due', updated);
          this.logger.log('Marked subscription ' + sub.id + ' PAST_DUE');
        }
      }
    }
  }
}
