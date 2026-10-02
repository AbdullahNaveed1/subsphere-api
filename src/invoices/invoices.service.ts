import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}
  async listForOrg(orgId: string) { return this.prisma.invoice.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }); }
  async findOne(orgId: string, id: string) { const i = await this.prisma.invoice.findFirst({ where: { id, orgId } }); if (!i) throw new NotFoundException('Invoice not found'); return i; }
  async markPaid(orgId: string, id: string) { const i = await this.findOne(orgId, id); if (i.status === 'PAID') return i; return this.prisma.invoice.update({ where: { id: i.id }, data: { status: 'PAID', paidAt: new Date() } }); }
}
