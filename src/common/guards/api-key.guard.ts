import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const raw = req.headers['x-api-key'];
    if (!raw) throw new UnauthorizedException('X-API-Key header required');
    const keyHash = createHash('sha256').update(raw).digest('hex');
    const key = await this.prisma.apiKey.findUnique({ where: { keyHash } });
    if (!key || key.revokedAt) throw new UnauthorizedException('Invalid API key');
    await this.prisma.apiKey.update({ where: { id: key.id }, data: { lastUsed: new Date() } });
    req.org = { id: key.orgId, role: 'API' };
    return true;
  }
}
