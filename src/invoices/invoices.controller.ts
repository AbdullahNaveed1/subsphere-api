import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Org-Id', required: true })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}
  @Get() list(@CurrentOrg() org: OrgContext) { return this.invoices.listForOrg(org.id); }
  @Get(':id') findOne(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.invoices.findOne(org.id, id); }
  @Post(':id/pay') pay(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.invoices.markPaid(org.id, id); }
}
