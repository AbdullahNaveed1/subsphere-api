import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, name: string) {
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Math.random().toString(36).slice(2, 6);

    return this.prisma.organization.create({
      data: {
        name,
        slug,
        memberships: {
          create: { userId, role: 'OWNER' },
        },
      },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(userId: string, orgId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    if (!membership) throw new ForbiddenException('Not a member');

    return this.prisma.organization.findUnique({ where: { id: orgId } });
  }
}