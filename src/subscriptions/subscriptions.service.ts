import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(orgId: string, dto: CreateSubscriptionDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.isActive) throw new NotFoundException('Plan not found');
    const existing = await this.prisma.subscription.findFirst({ where: { orgId, status: { in: ['ACTIVE', 'TRIALING'] } } });
    if (existing) throw new ConflictException('Already has active subscription');
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.interval === 'year') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);
    return this.prisma.subscription.create({ data: { orgId, planId: plan.id, status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: periodEnd }, include: { plan: true } });
  }
  async findForOrg(orgId: string) {
    return this.prisma.subscription.findFirst({ where: { orgId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } }, include: { plan: true }, orderBy: { createdAt: 'desc' } });
  }
  async cancel(orgId: string) {
    const sub = await this.findForOrg(orgId);
    if (!sub) throw new NotFoundException('No active subscription');
    return this.prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELED' }, include: { plan: true } });
  }
}
