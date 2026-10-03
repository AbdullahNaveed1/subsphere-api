import { Controller, Get, Post, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsObject, IsIn, Min } from 'class-validator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { PaymentsService } from './payments.service';

class CreatePaymentDto {
  @IsInt() @Min(1) amount!: number;
  @IsString() method!: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() provider?: string;
  @IsOptional() @IsString() customerEmail?: string;
  @IsOptional() @IsObject() metadata?: any;
  @IsOptional() @IsIn(['succeeded', 'failed', 'pending']) simulate?: 'succeeded' | 'failed' | 'pending';
}

@ApiTags('payments')
@ApiHeader({ name: 'X-API-Key', required: true })
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post() @UseGuards(RateLimitGuard, ApiKeyGuard) @Scopes('payments:write')
  create(@CurrentOrg() org: OrgContext, @Body() dto: CreatePaymentDto, @Headers('idempotency-key') idem?: string) {
    return this.payments.create(org.id, { ...dto, idempotencyKey: idem }, org.mode);
  }

  @Get() @UseGuards(RateLimitGuard, ApiKeyGuard) @Scopes('payments:read')
  list(@CurrentOrg() org: OrgContext) { return this.payments.list(org.id); }

  @Post('sync') @UseGuards(JwtAuthGuard, TenantGuard)
  sync(@CurrentOrg() org: OrgContext) { return this.payments.syncAll(org.id); }

  @Get(':id') @UseGuards(RateLimitGuard, ApiKeyGuard) @Scopes('payments:read')
  get(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.payments.get(org.id, id); }
}
