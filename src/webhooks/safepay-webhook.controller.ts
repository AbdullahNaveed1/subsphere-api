import { Controller, Post, Headers, Req, Logger, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks/safepay')
export class SafepayWebhookController {
  private logger = new Logger(SafepayWebhookController.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
    private readonly config: ConfigService,
  ) {}
  @Post()
  async handle(@Req() req: Request & { rawBody?: Buffer }, @Headers() headers: any) {
    const secret = this.config.get<string>('SAFEPAY_WEBHOOK_SECRET') || '';
    if (!secret) { this.logger.error('SAFEPAY_WEBHOOK_SECRET missing'); throw new UnauthorizedException('Webhook secret not configured'); }
    if (!req.rawBody) throw new UnauthorizedException('Raw body unavailable');
    const sigHeader = headers['x-sfpy-signature'] || headers['x-safepay-signature'];
    if (typeof sigHeader !== 'string' || sigHeader.length === 0) { this.logger.warn('missing sig'); throw new UnauthorizedException('Missing signature'); }
    const expected = createHmac('sha256', secret).update(req.rawBody).digest('hex');
    if (sigHeader.length !== expected.length) throw new UnauthorizedException('Invalid signature');
    const a = Buffer.from(expected, 'utf8'); const b = Buffer.from(sigHeader, 'utf8');
    if (!timingSafeEqual(a, b)) throw new UnauthorizedException('Invalid signature');
    const body = req.body as any;
    this.logger.log('Safepay webhook verified: ' + JSON.stringify(body));
    const token = body?.data?.tracker || body?.tracker || body?.data?.token;
    const status = body?.data?.state || body?.state || body?.type;
    if (!token) return { received: true };
    const payment = await this.prisma.payment.findFirst({ where: { providerRef: token } });
    if (!payment) return { received: true };
    const newStatus = status === 'TRACKER_ENDED' || status === 'succeeded' || status === 'completed' ? 'succeeded' : status === 'failed' || status === 'TRACKER_FAILED' ? 'failed' : payment.status;
    if (newStatus !== payment.status) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: newStatus } });
      await this.webhooks.dispatch(payment.orgId, 'payment.' + newStatus, { ...payment, status: newStatus });
    }
    return { received: true };
  }
}
