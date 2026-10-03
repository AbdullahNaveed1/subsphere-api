import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { CouponsService } from './coupons.service';

class CreateCouponDto {
  @IsString() code!: string;
  @IsIn(['percent', 'amount']) discountType!: 'percent' | 'amount';
  @IsInt() @Min(1) discountValue!: number;
  @IsOptional() @IsInt() @Min(1) maxRedemptions?: number;
  @IsOptional() @IsString() expiresAt?: string;
}

@ApiTags('coupons')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(RateLimitGuard, ApiKeyGuard)
@Controller('v1/coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}
  @Post() @Scopes('payments:write')
  create(@CurrentOrg() org: OrgContext, @Body() dto: CreateCouponDto) { return this.coupons.create(org.id, dto); }
  @Get() @Scopes('payments:read')
  list(@CurrentOrg() org: OrgContext) { return this.coupons.list(org.id); }
}

@ApiTags('coupons')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Org-Id', required: true })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('coupons')
export class CouponsDashboardController {
  constructor(private readonly coupons: CouponsService) {}
  @Post() create(@CurrentOrg() org: OrgContext, @Body() dto: CreateCouponDto) { return this.coupons.create(org.id, dto); }
  @Get() list(@CurrentOrg() org: OrgContext) { return this.coupons.list(org.id); }
  @Delete(':id') revoke(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.coupons.revoke(org.id, id); }
}