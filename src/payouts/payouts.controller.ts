import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { PayoutsService } from './payouts.service';

class CreatePayoutDto {
  @IsInt() @Min(1) amountCents!: number;
  @IsOptional() @IsString() method?: string;
  @IsString() destination!: string;
}

@ApiTags('payouts')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(RateLimitGuard, ApiKeyGuard)
@Controller('v1/payouts')
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}
  @Post() @Scopes('payments:write')
  create(@CurrentOrg() org: OrgContext, @Body() dto: CreatePayoutDto) { return this.payouts.request(org.id, dto); }
  @Get() @Scopes('payments:read')
  list(@CurrentOrg() org: OrgContext) { return this.payouts.list(org.id); }
  @Get(':id') @Scopes('payments:read')
  get(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.payouts.get(org.id, id); }
}