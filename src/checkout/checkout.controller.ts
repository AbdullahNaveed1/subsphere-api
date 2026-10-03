import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { CheckoutService } from './checkout.service';

class CreateSessionDto {
  @IsString() paymentId!: string;
  @IsOptional() @IsString() successUrl?: string;
  @IsOptional() @IsString() cancelUrl?: string;
  @IsOptional() @IsString() couponCode?: string;
}

@ApiTags('checkout')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(RateLimitGuard, ApiKeyGuard)
@Controller('v1/checkout_sessions')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post() @Scopes('payments:write')
  create(@CurrentOrg() org: OrgContext, @Body() dto: CreateSessionDto) {
    return this.checkout.create(org.id, dto.paymentId, dto.successUrl, dto.cancelUrl, dto.couponCode);
  }

  @Get(':token') @Scopes('payments:read')
  get(@CurrentOrg() org: OrgContext, @Param('token') token: string) {
    return this.checkout.getByToken(token);
  }
}