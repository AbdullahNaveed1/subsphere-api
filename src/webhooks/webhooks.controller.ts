import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { IsString, IsArray } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { WebhooksService } from './webhooks.service';

class SetEndpointDto {
  @IsString() url!: string;
  @IsArray() events!: string[];
}

@ApiTags('webhooks')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Org-Id', required: true })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}
  @Post('endpoint') set(@CurrentOrg() org: OrgContext, @Body() dto: SetEndpointDto) { return this.webhooks.setEndpoint(org.id, dto.url, dto.events); }
  @Get('endpoint') get(@CurrentOrg() org: OrgContext) { return this.webhooks.getEndpoint(org.id); }
  @Get('events') events(@CurrentOrg() org: OrgContext) { return this.webhooks.listEvents(org.id); }
}
