import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService, private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const raw = req.headers['x-api-key'];
    if (!raw) throw new UnauthorizedException('X-API-Key header required');
    const keyHash = createHash('sha256').update(raw).digest('hex');
    const key = await this.prisma.apiKey.findUnique({ where: { keyHash } });
    if (!key || key.revokedAt) throw new UnauthorizedException('Invalid API key');
    const required = this.reflector.getAllAndOverride<string[]>('scopes', [context.getHandler(), context.getClass()]) || [];
    const granted = (key.scopes || '*').split(',').map(s => s.trim());
    if (required.length && !granted.includes('*')) {
      const ok = required.every(r => granted.includes(r));
      if (!ok) throw new ForbiddenException('API key missing required scope: ' + required.join(','));
    }
    await this.prisma.apiKey.update({ where: { id: key.id }, data: { lastUsed: new Date() } });
    req.org = { id: key.orgId, role: 'API' };
    return true;
  }
}
