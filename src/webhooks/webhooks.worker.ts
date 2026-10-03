import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from './webhooks.service';

@Injectable()
export class WebhooksWorker implements OnModuleInit {
  private logger = new Logger(WebhooksWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => this.tick().catch(() => {}), 30000);
    this.logger.log('Webhook retry worker started (30s interval)');
  }

  private async tick() {
    const due = await this.prisma.webhookEvent.findMany({
      where: { status: 'pending', attempts: { gt: 0, lt: 5 }, nextRetryAt: { lte: new Date() } },
      take: 20,
    });
    if (!due.length) return;
    this.logger.log('Retrying ' + due.length + ' webhook(s)');
    for (const ev of due) {
      const endpoint = await this.prisma.webhookEndpoint.findUnique({ where: { orgId: ev.orgId } });
      if (!endpoint) continue;
      await this.webhooks.retryDelivery(ev.id, endpoint.url, endpoint.secret, ev.payload);
    }
  }
}
