import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async summary(orgId: string) {
    const [org, subscription, invoiceCount, unpaidTotal] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId } }),
      this.prisma.subscription.findFirst({ where: { orgId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } }, include: { plan: true } }),
      this.prisma.invoice.count({ where: { orgId } }),
      this.prisma.invoice.aggregate({ where: { orgId, status: 'OPEN' }, _sum: { totalCents: true } }),
    ]);
    return { org, subscription, metrics: { invoiceCount, unpaidTotalCents: unpaidTotal._sum.totalCents ?? 0, mrrCents: subscription?.plan?.priceCents ?? 0 } };
  }
}
