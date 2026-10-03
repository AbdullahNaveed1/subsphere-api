import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  async listForOrg(orgId: string) { return this.prisma.invoice.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }); }

  async findOne(orgId: string, id: string) {
    const i = await this.prisma.invoice.findFirst({ where: { id, orgId } });
    if (!i) throw new NotFoundException('Invoice not found');
    return i;
  }

  async pay(orgId: string, id: string, method: string = 'raast') {
    const i = await this.findOne(orgId, id);
    if (i.status === 'PAID') return i;
    const payment = await this.payments.create(orgId, {
      amount: i.totalCents,
      method,
      currency: i.currency,
      provider: 'safepay',
      idempotencyKey: 'inv-' + i.id,
    });
    return this.prisma.invoice.update({
      where: { id: i.id },
      data: { status: 'PAID', paidAt: new Date(), paymentId: payment.id },
    });
  }
}
