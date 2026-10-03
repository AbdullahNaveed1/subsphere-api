import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { RefundsService } from './refunds.service';

class CreateRefundDto {
  @IsString() paymentId!: string;
  @IsInt() @Min(1) amount!: number;
  @IsOptional() @IsString() reason?: string;
}

@ApiTags('refunds')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Org-Id', required: true })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('refunds')
export class RefundsDashboardController {
  constructor(private readonly refunds: RefundsService) {}

  @Post()
  create(@CurrentOrg() org: OrgContext, @Body() dto: CreateRefundDto) {
    return this.refunds.create(org.id, dto.paymentId, dto.amount, dto.reason);
  }

  @Get()
  list(@CurrentOrg() org: OrgContext) { return this.refunds.list(org.id); }

  @Get(':id')
  get(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.refunds.get(org.id, id); }
}
