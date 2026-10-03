import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ProviderFactory } from './providers/provider.factory';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
    private readonly providers: ProviderFactory,
  ) {}

  async create(orgId: string, dto: any, mode?: 'test' | 'live') {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
      if (existing) return existing;
    }

    if (dto.simulate) {
      if (mode !== 'test') throw new ForbiddenException('simulate only allowed with sk_test_ keys');
      const allowed = ['succeeded', 'failed', 'pending'];
      if (!allowed.includes(dto.simulate)) throw new BadRequestException('simulate must be one of: ' + allowed.join(', '));
      const payment = await this.prisma.payment.create({
        data: {
          orgId, amount: dto.amount, currency: dto.currency || 'PKR', method: dto.method,
          provider: 'test', status: dto.simulate, providerRef: 'test_' + Date.now(),
          customerEmail: dto.customerEmail, metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
          idempotencyKey: dto.idempotencyKey,
        },
      });
      await this.webhooks.dispatch(orgId, 'payment.' + payment.status, payment);
      return payment;
    }

    const providerName = dto.provider || 'safepay';
    const provider = this.providers.get(providerName);
    let result;
    try {
      result = await provider.createPayment({ amount: dto.amount, currency: dto.currency || 'PKR', method: dto.method, customerEmail: dto.customerEmail, metadata: dto.metadata });
    } catch (err: any) {
      throw new BadRequestException('Provider error: ' + (err && err.message ? err.message : 'unknown'));
    }
    const payment = await this.prisma.payment.create({
      data: { orgId, amount: dto.amount, currency: dto.currency || 'PKR', method: dto.method, provider: providerName, status: result.status, providerRef: result.providerRef, customerEmail: dto.customerEmail, metadata: dto.metadata ? JSON.stringify(dto.metadata) : null, idempotencyKey: dto.idempotencyKey },
    });
    await this.webhooks.dispatch(orgId, 'payment.created', payment);
    return { ...payment, checkoutUrl: result.checkoutUrl };
  }

  async list(orgId: string) {
    return this.prisma.payment.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async get(orgId: string, id: string) {
    return this.prisma.payment.findFirst({ where: { id, orgId } });
  }

  async syncAll(orgId: string) {
    const pending = await this.prisma.payment.findMany({
      where: { orgId, status: 'pending', provider: 'safepay', providerRef: { not: null } },
    });
    const secretKey = process.env.SAFEPAY_SECRET_KEY || '';
    const host = process.env.SAFEPAY_ENV === 'sandbox' ? 'https://sandbox.api.getsafepay.com' : 'https://api.getsafepay.com';
    const updated: string[] = [];
    for (const p of pending) {
      try {
        const res = await axios.get(host + '/order/v1/' + p.providerRef + '/state', {
          headers: { 'X-SFPY-MERCHANT-SECRET': secretKey },
        });
        const state = res.data?.data?.state;
        if (state === 'TRACKER_ENDED') {
          await this.prisma.payment.update({ where: { id: p.id }, data: { status: 'succeeded' } });
          await this.webhooks.dispatch(orgId, 'payment.succeeded', { ...p, status: 'succeeded' });
          updated.push(p.id);
        }
      } catch (e) {}
    }
    return { checked: pending.length, updated };
  }
}
