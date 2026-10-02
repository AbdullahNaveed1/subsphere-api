import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}
  async create(orgId: string, name: string, mode: 'test' | 'live' = 'test') {
    const raw = 'sk_' + mode + '_' + randomBytes(24).toString('hex');
    const keyHash = createHash('sha256').update(raw).digest('hex');
    const prefix = raw.slice(0, 12) + '...';
    const key = await this.prisma.apiKey.create({ data: { orgId, name, keyHash, prefix, mode } });
    return { id: key.id, name: key.name, prefix: key.prefix, mode: key.mode, createdAt: key.createdAt, rawKey: raw };
  }
  async list(orgId: string) {
    return this.prisma.apiKey.findMany({ where: { orgId, revokedAt: null }, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, prefix: true, mode: true, lastUsed: true, createdAt: true } });
  }
  async revoke(orgId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, orgId } });
    if (!key) throw new NotFoundException('API key not found');
    return this.prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  }
}
