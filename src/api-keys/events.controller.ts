import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

class TriggerEventDto {
  @IsString() type!: string;
  @IsOptional() @IsObject() data?: any;
}

@ApiTags('public')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(ApiKeyGuard)
@Controller('v1/events')
export class EventsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  @Get() async list(@CurrentOrg() org: OrgContext, @Query('since') since?: string) {
    return this.prisma.webhookEvent.findMany({
      where: { orgId: org.id, ...(since ? { createdAt: { gt: new Date(since) } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  @Post('trigger') async trigger(@CurrentOrg() org: OrgContext, @Body() dto: TriggerEventDto) {
    await this.webhooks.dispatch(org.id, dto.type, dto.data || {});
    const latest = await this.prisma.webhookEvent.findFirst({ where: { orgId: org.id }, orderBy: { createdAt: 'desc' } });
    return { id: latest?.id, type: dto.type };
  }
}
