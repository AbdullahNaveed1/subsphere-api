import { Controller, Post, Body, Headers, Req, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks/safepay')
export class SafepayWebhookController {
  private logger = new Logger(SafepayWebhookController.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  @Post()
  async handle(@Body() body: any, @Headers() headers: any) {
    this.logger.log('Safepay webhook: ' + JSON.stringify(body));
    const token = body?.data?.tracker || body?.tracker || body?.data?.token;
    const status = body?.data?.state || body?.state || body?.type;
    if (!token) return { received: true };

    const payment = await this.prisma.payment.findFirst({
      where: { providerRef: token },
    });
    if (!payment) return { received: true };

    const newStatus =
      status === 'TRACKER_ENDED' || status === 'succeeded' || status === 'completed'
        ? 'succeeded'
        : status === 'failed' || status === 'TRACKER_FAILED'
        ? 'failed'
        : payment.status;

    if (newStatus !== payment.status) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: newStatus },
      });
      await this.webhooks.dispatch(payment.orgId, 'payment.' + newStatus, {
        ...payment,
        status: newStatus,
      });
    }
    return { received: true };
  }
}