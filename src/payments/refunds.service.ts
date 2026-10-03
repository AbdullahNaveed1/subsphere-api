import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ProviderFactory } from './providers/provider.factory';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class RefundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
    private readonly providers: ProviderFactory,
    private readonly ledger: LedgerService,
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

    if (payment.provider === 'test') {
      const updated = await this.prisma.refund.update({ where: { id: refund.id }, data: { status: 'succeeded', providerRef: 'test_ref_' + Date.now() } });
      await this.webhooks.dispatch(orgId, 'refund.succeeded', updated);
      await this.ledger.record(orgId, 'refund', -amount, updated.id, 'Refund ' + updated.id);
      return updated;
    }

    if (payment.providerRef) {
      const provider = this.providers.get(payment.provider);
      if (provider.refund) {
        const r = await provider.refund(payment.providerRef, amount, reason);
        const updated = await this.prisma.refund.update({ where: { id: refund.id }, data: { status: r.status, providerRef: r.providerRef } });
        await this.webhooks.dispatch(orgId, 'refund.' + r.status, updated);
        return updated;
      }
    }
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
