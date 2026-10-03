import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Org-Id', required: true })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('payments')
export class PaymentsDashboardController {
  constructor(private readonly payments: PaymentsService) {}
  @Get()
  list(@CurrentOrg() org: OrgContext) { return this.payments.list(org.id); }
}
