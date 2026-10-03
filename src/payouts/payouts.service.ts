import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly webhooks: WebhooksService,
  ) {}

  async request(orgId: string, dto: { amountCents: number; method?: string; destination: string }) {
    const bal = await this.ledger.balance(orgId);
    if (dto.amountCents < 1) throw new BadRequestException('Amount must be positive');
    if (dto.amountCents > bal.balanceCents) throw new BadRequestException('Insufficient balance');

    const payout = await this.prisma.payout.create({
      data: {
        orgId,
        amountCents: dto.amountCents,
        method: dto.method || 'raast',
        destination: dto.destination,
        status: 'pending',
        reference: 'po_' + Date.now(),
      },
    });
    await this.ledger.record(orgId, 'payout', -dto.amountCents, payout.id, 'Payout to ' + dto.destination);
    await this.webhooks.dispatch(orgId, 'payout.created', payout);
    return payout;
  }

  async list(orgId: string) {
    return this.prisma.payout.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
  }

  async get(orgId: string, id: string) {
    const p = await this.prisma.payout.findFirst({ where: { id, orgId } });
    if (!p) throw new NotFoundException('Payout not found');
    return p;
  }

  async markPaid(orgId: string, id: string) {
    const p = await this.get(orgId, id);
    if (p.status !== 'pending') return p;
    const updated = await this.prisma.payout.update({
      where: { id },
      data: { status: 'paid', processedAt: new Date() },
    });
    await this.webhooks.dispatch(orgId, 'payout.paid', updated);
    return updated;
  }
}