import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(RateLimitGuard, ApiKeyGuard)
@Controller('v1/invoices')
export class InvoicesPublicController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get() @Scopes('payments:read')
  list(@CurrentOrg() org: OrgContext) { return this.invoices.listForOrg(org.id); }

  @Get(':id') @Scopes('payments:read')
  get(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.invoices.findOne(org.id, id); }
}