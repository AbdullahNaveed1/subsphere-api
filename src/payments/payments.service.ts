import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly webhooks: WebhooksService) {}
  async create(orgId: string, dto: any) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
      if (existing) return existing;
    }
    const payment = await this.prisma.payment.create({ data: { orgId, amount: dto.amount, currency: dto.currency || 'PKR', method: dto.method, status: 'succeeded', customerEmail: dto.customerEmail, metadata: dto.metadata ? JSON.stringify(dto.metadata) : null, idempotencyKey: dto.idempotencyKey, providerRef: 'mock_' + Date.now() } });
    await this.webhooks.dispatch(orgId, 'payment.succeeded', payment);
    return payment;
  }
  async list(orgId: string) { return this.prisma.payment.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: 50 }); }
  async get(orgId: string, id: string) { return this.prisma.payment.findFirst({ where: { id, orgId } }); }
}
