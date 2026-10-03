import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { RefundsService } from './refunds.service';

class CreateRefundDto {
  @IsInt() @Min(1) amount!: number;
  @IsOptional() @IsString() reason?: string;
}

@ApiTags('refunds')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(RateLimitGuard, ApiKeyGuard)
@Controller('v1/refunds')
export class RefundsController {
  constructor(private readonly refunds: RefundsService) {}

  @Post() @Scopes('refunds:write')
  create(@CurrentOrg() org: OrgContext, @Body() dto: CreateRefundDto & { paymentId: string }) {
    return this.refunds.create(org.id, dto.paymentId, dto.amount, dto.reason);
  }

  @Get() @Scopes('refunds:read')
  list(@CurrentOrg() org: OrgContext) { return this.refunds.list(org.id); }

  @Get(':id') @Scopes('refunds:read')
  get(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.refunds.get(org.id, id); }
}
