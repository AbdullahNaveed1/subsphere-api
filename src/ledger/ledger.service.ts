import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async record(orgId: string, type: 'payment' | 'refund' | 'fee' | 'payout', amountCents: number, reference?: string, description?: string) {
    const last = await this.prisma.ledgerEntry.findFirst({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    const prev = last?.balanceAfter || 0;
    const balanceAfter = prev + amountCents;
    return this.prisma.ledgerEntry.create({
      data: { orgId, type, amountCents, balanceAfter, reference: reference || null, description: description || null },
    });
  }

  async balance(orgId: string) {
    const last = await this.prisma.ledgerEntry.findFirst({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return { balanceCents: last?.balanceAfter || 0 };
  }

  async list(orgId: string, limit = 50) {
    return this.prisma.ledgerEntry.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: limit });
  }
}