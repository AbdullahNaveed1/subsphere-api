import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac, randomBytes } from 'crypto';
import axios from 'axios';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async setEndpoint(orgId: string, url: string, events: string[]) {
    const secret = 'whsec_' + randomBytes(24).toString('hex');
    return this.prisma.webhookEndpoint.upsert({ where: { orgId }, create: { orgId, url, secret, events: events.join(',') }, update: { url, events: events.join(','), isActive: true } });
  }

  async getEndpoint(orgId: string) { return this.prisma.webhookEndpoint.findUnique({ where: { orgId } }); }

  async dispatch(orgId: string, type: string, data: any) {
    const endpoint = await this.getEndpoint(orgId);
    const payload = JSON.stringify({ type, data, createdAt: new Date().toISOString() });
    const event = await this.prisma.webhookEvent.create({ data: { orgId, type, payload, url: endpoint ? endpoint.url : '', paymentId: data && data.id } });
    if (!endpoint || !endpoint.isActive) return;
    if (!endpoint.events.split(',').includes(type) && !endpoint.events.includes('*')) return;
    this.deliver(event.id, endpoint.url, endpoint.secret, payload).catch(() => {});
  }

  async replay(orgId: string, eventId: string) {
    const event = await this.prisma.webhookEvent.findFirst({ where: { id: eventId, orgId } });
    if (!event) throw new NotFoundException('Event not found');
    const endpoint = await this.getEndpoint(orgId);
    if (!endpoint) throw new NotFoundException('No webhook endpoint configured');
    await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { status: 'pending', attempts: 0, lastError: null, nextRetryAt: null } });
    this.deliver(event.id, endpoint.url, endpoint.secret, event.payload).catch(() => {});
    return { ok: true, eventId: event.id };
  }

  private async deliver(eventId: string, url: string, secret: string, payload: string) {
    const signature = createHmac('sha256', secret).update(payload).digest('hex');
    try {
      await axios.post(url, JSON.parse(payload), { headers: { 'Content-Type': 'application/json', 'X-SubSphere-Signature': signature }, timeout: 10000 });
      await this.prisma.webhookEvent.update({ where: { id: eventId }, data: { status: 'delivered', deliveredAt: new Date() } });
    } catch (err: any) {
      const row = await this.prisma.webhookEvent.findUnique({ where: { id: eventId } });
      const attempts = (row && row.attempts) || 0;
      const backoffMs = Math.min(60000 * Math.pow(2, attempts), 3600000);
      await this.prisma.webhookEvent.update({ where: { id: eventId }, data: { status: attempts >= 4 ? 'failed' : 'pending', attempts: attempts + 1, lastError: (err && err.message && err.message.slice(0, 500)) || 'error', nextRetryAt: new Date(Date.now() + backoffMs) } });
    }
  }

  async listEvents(orgId: string) { return this.prisma.webhookEvent.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: 50 }); }
}
