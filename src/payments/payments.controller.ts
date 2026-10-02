import { Controller, Get, Post, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsObject, Min } from 'class-validator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { PaymentsService } from './payments.service';

class CreatePaymentDto {
  @IsInt() @Min(1) amount!: number;
  @IsString() method!: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() customerEmail?: string;
  @IsOptional() @IsObject() metadata?: any;
}

@ApiTags('payments')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(ApiKeyGuard)
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post() create(@CurrentOrg() org: OrgContext, @Body() dto: CreatePaymentDto, @Headers('idempotency-key') idem?: string) { return this.payments.create(org.id, { ...dto, idempotencyKey: idem }); }
  @Get() list(@CurrentOrg() org: OrgContext) { return this.payments.list(org.id); }
  @Get(':id') get(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.payments.get(org.id, id); }
}
