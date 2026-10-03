import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class RefundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  async create(orgId: string, paymentId: string, amount: number, reason?: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, orgId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'succeeded') throw new BadRequestException('Only succeeded payments can be refunded');
    const existing = await this.prisma.refund.findMany({ where: { paymentId, status: { in: ['pending', 'succeeded'] } } });
    const alreadyRefunded = existing.reduce((s, r) => s + r.amount, 0);
    if (alreadyRefunded + amount > payment.amount) throw new BadRequestException('Refund exceeds payment amount');
    const refund = await this.prisma.refund.create({ data: { orgId, paymentId, amount, reason, status: 'pending' } });
    await this.webhooks.dispatch(orgId, 'refund.created', refund);
    return refund;
  }

  async list(orgId: string, paymentId?: string) {
    return this.prisma.refund.findMany({ where: { orgId, ...(paymentId ? { paymentId } : {}) }, orderBy: { createdAt: 'desc' } });
  }

  async get(orgId: string, id: string) {
    const r = await this.prisma.refund.findFirst({ where: { id, orgId } });
    if (!r) throw new NotFoundException('Refund not found');
    return r;
  }
}
