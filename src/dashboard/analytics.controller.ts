import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Org-Id', required: true })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('revenue')
  async revenue(@CurrentOrg() org: OrgContext) {
    const succeeded = await this.prisma.payment.findMany({
      where: { orgId: org.id, status: 'succeeded' },
      select: { amount: true, createdAt: true },
    });
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const total = succeeded.reduce((s, p) => s + p.amount, 0);
    const total30 = succeeded.filter(p => p.createdAt >= last30).reduce((s, p) => s + p.amount, 0);
    const total7 = succeeded.filter(p => p.createdAt >= last7).reduce((s, p) => s + p.amount, 0);

    const buckets: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }
    for (const p of succeeded) {
      const key = p.createdAt.toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += p.amount;
    }

    const paymentsCount = await this.prisma.payment.count({ where: { orgId: org.id } });
    const failedCount = await this.prisma.payment.count({ where: { orgId: org.id, status: 'failed' } });
    const refunded = await this.prisma.refund.aggregate({ where: { orgId: org.id, status: 'succeeded' }, _sum: { amount: true } });

    return {
      totalCents: total,
      last30Cents: total30,
      last7Cents: total7,
      refundedCents: refunded._sum.amount || 0,
      daily: Object.entries(buckets).map(([date, cents]) => ({ date, cents })),
      counts: { payments: paymentsCount, failed: failedCount },
    };
  }
}
