import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ProviderFactory } from './providers/provider.factory';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly webhooks: WebhooksService, private readonly providers: ProviderFactory) {}
  async create(orgId: string, dto: any) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
      if (existing) return existing;
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
  async list(orgId: string) { return this.prisma.payment.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: 50 }); }
  async get(orgId: string, id: string) { return this.prisma.payment.findFirst({ where: { id, orgId } }); }
}
