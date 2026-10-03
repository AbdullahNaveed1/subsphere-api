import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { PaymentLinksService } from './payment-links.service';

class CreateLinkDto {
  @IsInt() @Min(1) amount!: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() currency?: string;
}

@ApiTags('payment-links')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(RateLimitGuard, ApiKeyGuard)
@Controller('v1/payment_links')
export class PaymentLinksController {
  constructor(private readonly links: PaymentLinksService) {}
  @Post() @Scopes('payments:write')
  create(@CurrentOrg() org: OrgContext, @Body() dto: CreateLinkDto) {
    return this.links.create(org.id, dto);
  }
  @Get() @Scopes('payments:read')
  list(@CurrentOrg() org: OrgContext) { return this.links.list(org.id); }
}

@ApiTags('payment-links')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Org-Id', required: true })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('payment-links')
export class PaymentLinksDashboardController {
  constructor(private readonly links: PaymentLinksService) {}
  @Post() create(@CurrentOrg() org: OrgContext, @Body() dto: CreateLinkDto) { return this.links.create(org.id, dto); }
  @Get() list(@CurrentOrg() org: OrgContext) { return this.links.list(org.id); }
  @Delete(':id') revoke(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.links.revoke(org.id, id); }
}

@ApiTags('payment-links-public')
@Controller('pay')
export class PaymentLinksPublicController {
  constructor(private readonly links: PaymentLinksService) {}
  @Get(':token') get(@Param('token') token: string) { return this.links.getByToken(token); }
  @Post(':token/pay') pay(@Param('token') token: string) { return this.links.pay(token); }
}