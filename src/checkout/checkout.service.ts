import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { CouponsService } from '../coupons/coupons.service';

const TTL_MS = 30 * 60 * 1000;

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coupons: CouponsService,
  ) {}

  async create(orgId: string, paymentId: string, successUrl?: string, cancelUrl?: string, couponCode?: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, orgId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'pending') throw new BadRequestException('Only pending payments can be checked out');

    let finalAmount = payment.amount;
    if (couponCode) {
      const v = await this.coupons.validate(orgId, couponCode, payment.amount);
      finalAmount = v.finalCents;
      await this.coupons.redeem(v.coupon.id);
    }

    const token = randomBytes(24).toString('hex');
    const session = await this.prisma.checkoutSession.create({
      data: {
        token, orgId, paymentId,
        amount: finalAmount, currency: payment.currency,
        status: 'open',
        successUrl: successUrl || null,
        cancelUrl: cancelUrl || null,
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });
    return { id: session.id, token: session.token, url: 'http://localhost:3000/checkout/' + session.token, expiresAt: session.expiresAt };
  }

  async getByToken(token: string) {
    const s = await this.prisma.checkoutSession.findUnique({ where: { token } });
    if (!s) throw new NotFoundException('Checkout session not found');
    if (s.status === 'open' && s.expiresAt < new Date()) {
      await this.prisma.checkoutSession.update({ where: { id: s.id }, data: { status: 'expired' } });
      s.status = 'expired';
    }
    const payment = await this.prisma.payment.findUnique({ where: { id: s.paymentId } });
    return { session: s, payment };
  }

  async complete(token: string, outcome: 'succeeded' | 'failed') {
    const s = await this.prisma.checkoutSession.findUnique({ where: { token } });
    if (!s) throw new NotFoundException('Checkout session not found');
    if (s.status !== 'open') throw new BadRequestException('Session is ' + s.status);
    if (s.expiresAt < new Date()) throw new BadRequestException('Session expired');

    const updated = await this.prisma.checkoutSession.update({
      where: { id: s.id },
      data: { status: outcome === 'succeeded' ? 'completed' : 'cancelled', completedAt: new Date() },
    });
    await this.prisma.payment.update({ where: { id: s.paymentId }, data: { status: outcome } });
    return updated;
  }

  async cancel(token: string) {
    const s = await this.prisma.checkoutSession.findUnique({ where: { token } });
    if (!s) throw new NotFoundException('Checkout session not found');
    if (s.status !== 'open') return s;
    return this.prisma.checkoutSession.update({ where: { id: s.id }, data: { status: 'cancelled', completedAt: new Date() } });
  }
}