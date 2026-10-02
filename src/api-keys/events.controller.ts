import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('public')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(ApiKeyGuard)
@Controller('v1/events')
export class EventsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() async list(@CurrentOrg() org: OrgContext, @Query('since') since?: string) {
    return this.prisma.webhookEvent.findMany({
      where: { orgId: org.id, ...(since ? { createdAt: { gt: new Date(since) } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
