import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceCents: 'asc' },
    });
  }

  async getOne(id: string) {
    return this.prisma.plan.findUnique({ where: { id } });
  }
}