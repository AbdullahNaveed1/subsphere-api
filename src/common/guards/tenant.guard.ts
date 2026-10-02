import {
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    const orgId =
      request.headers['x-org-id'] ||
      request.params.orgId ||
      request.query.orgId;

    if (!orgId) {
      throw new BadRequestException('X-Org-Id header is required');
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId: user.id, orgId } },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    request.org = { id: orgId, role: membership.role };
    return true;
  }
}
