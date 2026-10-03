import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, dto: { code: string; discountType: 'percent' | 'amount'; discountValue: number; maxRedemptions?: number; expiresAt?: string }) {
    const code = dto.code.toUpperCase();
    if (dto.discountType === 'percent' && (dto.discountValue < 1 || dto.discountValue > 100)) {
      throw new BadRequestException('Percent discount must be 1-100');
    }
    if (dto.discountType === 'amount' && dto.discountValue < 1) {
      throw new BadRequestException('Amount discount must be positive');
    }
    const existing = await this.prisma.coupon.findUnique({ where: { orgId_code: { orgId, code } } });
    if (existing) throw new ConflictException('Coupon code already exists');
    return this.prisma.coupon.create({
      data: {
        orgId, code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxRedemptions: dto.maxRedemptions ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async list(orgId: string) {
    return this.prisma.coupon.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
  }

  async revoke(orgId: string, id: string) {
    const c = await this.prisma.coupon.findFirst({ where: { id, orgId } });
    if (!c) throw new NotFoundException('Coupon not found');
    return this.prisma.coupon.update({ where: { id }, data: { active: false } });
  }

  async validate(orgId: string, code: string, amount: number) {
    const c = await this.prisma.coupon.findUnique({ where: { orgId_code: { orgId, code: code.toUpperCase() } } });
    if (!c || !c.active) throw new NotFoundException('Invalid coupon');
    if (c.expiresAt && c.expiresAt < new Date()) throw new BadRequestException('Coupon expired');
    if (c.maxRedemptions != null && c.redemptions >= c.maxRedemptions) throw new BadRequestException('Coupon fully redeemed');
    const discountCents = c.discountType === 'percent'
      ? Math.floor(amount * c.discountValue / 100)
      : c.discountValue;
    const finalCents = Math.max(0, amount - discountCents);
    return { coupon: c, discountCents, finalCents };
  }

  async redeem(couponId: string) {
    return this.prisma.coupon.update({
      where: { id: couponId },
      data: { redemptions: { increment: 1 } },
    });
  }
}