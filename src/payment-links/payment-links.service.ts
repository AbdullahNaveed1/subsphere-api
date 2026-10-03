import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { randomBytes } from 'crypto';

@Injectable()
export class PaymentLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  async create(orgId: string, dto: { amount: number; description?: string; method?: string; currency?: string }) {
    const token = randomBytes(16).toString('hex');
    const link = await this.prisma.paymentLink.create({
      data: {
        token, orgId,
        amount: dto.amount,
        currency: dto.currency || 'PKR',
        description: dto.description || null,
        method: dto.method || 'card',
      },
    });
    return { ...link, url: 'http://localhost:3000/pay/' + token };
  }

  async list(orgId: string) {
    return this.prisma.paymentLink.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
  }

  async revoke(orgId: string, id: string) {
    const l = await this.prisma.paymentLink.findFirst({ where: { id, orgId } });
    if (!l) throw new NotFoundException('Payment link not found');
    return this.prisma.paymentLink.update({ where: { id }, data: { active: false } });
  }

  async getByToken(token: string) {
    const l = await this.prisma.paymentLink.findUnique({ where: { token } });
    if (!l) throw new NotFoundException('Payment link not found');
    if (!l.active) throw new BadRequestException('Payment link is inactive');
    return l;
  }

  async pay(token: string) {
    const link = await this.getByToken(token);
    const payment = await this.payments.create(link.orgId, {
      amount: link.amount,
      method: link.method,
      currency: link.currency,
      provider: 'test',
      simulate: 'succeeded',
      idempotencyKey: 'pl-' + link.token + '-' + Date.now(),
    });
    await this.prisma.paymentLink.update({ where: { id: link.id }, data: { timesUsed: { increment: 1 } } });
    return payment;
  }
}