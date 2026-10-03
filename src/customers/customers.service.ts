import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, email: string, name?: string, metadata?: any) {
    const existing = await this.prisma.customer.findUnique({ where: { orgId_email: { orgId, email } } });
    if (existing) throw new ConflictException('Customer with this email already exists');
    return this.prisma.customer.create({ data: { orgId, email, name, metadata: metadata ? JSON.stringify(metadata) : null } });
  }

  async list(orgId: string) {
    return this.prisma.customer.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
  }

  async get(orgId: string, id: string) {
    const c = await this.prisma.customer.findFirst({ where: { id, orgId } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async remove(orgId: string, id: string) {
    await this.get(orgId, id);
    return this.prisma.customer.delete({ where: { id } });
  }
}
